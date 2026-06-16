// On-device receipt reading (OCR) for images + PDFs. The heavy libraries are
// imported dynamically so they only download when the user actually scans.

function pad(n) {
  return String(n).padStart(2, '0')
}

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

async function ocrImage(image, onProgress) {
  const Tesseract = (await import('tesseract.js')).default
  const { data } = await Tesseract.recognize(image, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress || 0)
    },
  })
  return data?.text || ''
}

async function loadPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjsLib
}

async function extractPdfText(file) {
  try {
    const pdfjsLib = await loadPdfjs()
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    let text = ''
    const pages = Math.min(doc.numPages, 5)
    for (let i = 1; i <= pages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((it) => it.str).join(' ') + '\n'
    }
    return text
  } catch {
    return ''
  }
}

async function renderPdfFirstPage(file) {
  try {
    const pdfjsLib = await loadPdfjs()
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    const page = await doc.getPage(1)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
    return canvas
  } catch {
    return null
  }
}

// Returns the raw text read from a receipt file (image or PDF).
export async function extractText(file, onProgress) {
  const type = file.type || ''
  const name = (file.name || '').toLowerCase()
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    const text = await extractPdfText(file)
    if (text.replace(/\s/g, '').length > 20) return text // text-based PDF
    const canvas = await renderPdfFirstPage(file) // scanned PDF → OCR
    if (canvas) return ocrImage(canvas, onProgress)
    return text
  }
  return ocrImage(file, onProgress)
}

function guessDate(text) {
  let m = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`
  m = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})\b/)
  if (m) {
    let [, d, mo, y] = m
    if (+mo > 12 && +d <= 12) [d, mo] = [mo, d] // tolerate m/d/y order
    if (+mo > 12) return null
    if (y.length === 2) y = '20' + y
    return `${y}-${pad(mo)}-${pad(d)}`
  }
  m = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{2,4})\b/)
  if (m) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mo) {
      let y = m[3]
      if (y.length === 2) y = '20' + y
      return `${y}-${mo}-${pad(m[1])}`
    }
  }
  return null
}

function guessAmount(lines) {
  const moneyRe = /(?:₹|rs\.?|inr|\$|usd)?\s*([0-9][0-9,]*\.[0-9]{2}|[0-9][0-9,]{2,})/gi
  const candidates = []
  for (const line of lines) {
    const lower = line.toLowerCase()
    const weight = /grand\s*total|amount\s*due|balance\s*due|amount payable|net amount/.test(lower)
      ? 3
      : /total|amount|subtotal/.test(lower)
        ? 2
        : 1
    let m
    while ((m = moneyRe.exec(line))) {
      const val = parseFloat(m[1].replace(/,/g, ''))
      if (!isNaN(val) && val > 0 && val < 1e9) candidates.push({ val, weight })
    }
  }
  if (!candidates.length) return null
  candidates.sort((a, b) => b.weight - a.weight || b.val - a.val)
  return candidates[0].val
}

function guessVendor(lines) {
  const skip = /total|invoice|receipt|gst|tax|date|amount|bill|tel|phone|www\.|http|@|order|cash|change|qty|subtotal/i
  const v = lines.find((l) => /[a-z]/i.test(l) && !skip.test(l) && l.replace(/[^a-z]/gi, '').length >= 3)
  return v ? v.replace(/\s+/g, ' ').trim().slice(0, 60) : null
}

// Best-effort structured fields from receipt text. The user verifies/edits.
export function parseReceipt(text) {
  const out = { amount: null, date: null, vendor: null }
  if (!text) return out
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  out.amount = guessAmount(lines)
  out.date = guessDate(text)
  out.vendor = guessVendor(lines)
  return out
}
