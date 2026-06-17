// Vercel serverless function: reads a receipt / bill / invoice with Claude's
// vision model and returns clean, structured fields. This is far more accurate
// than the on-device OCR (Tesseract) fallback — it understands layout, messy
// scans, handwriting and non-English receipts instead of regex-guessing.
//
// The client (src/lib/ocr.js → scanReceipt) calls this first and falls back to
// on-device OCR if it returns anything other than 200. If ANTHROPIC_API_KEY is
// not configured the function replies 501 so the app keeps working on OCR.
//
// Env:
//   ANTHROPIC_API_KEY  (required for AI scanning; set in the Vercel dashboard)
//   SCAN_MODEL         (optional; defaults to Anthropic's most capable model)

import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.SCAN_MODEL || 'claude-opus-4-8'

// Categories the app already uses — nudges the model to map onto an existing
// one so the result drops straight into the category picker.
const CATEGORIES = [
  'Materials',
  'Labor / Contractors',
  'Permits & Legal',
  'Utilities',
  'Property Tax',
  'Maintenance & Repairs',
  'Insurance',
  'Loan / EMI',
  'Brokerage / Marketing',
  'Furnishing',
  'Other',
]

const SYSTEM = `You are an expert bookkeeping assistant that reads a single receipt, bill or invoice and extracts its key fields. The image or PDF may be photographed at an angle, blurry, creased, handwritten, thermal-printed, or in a language other than English — read it as carefully as a human accountant would.

Return ONLY a JSON object (no prose, no markdown fences) with exactly these keys:

- "amount": the FINAL grand total actually paid or payable, as a plain number with no currency symbol and no thousands separators (use a dot for decimals). Prefer values labelled "Grand Total", "Total Amount", "Amount Payable", "Balance Due" or "Net Payable" over any sub-total. Use null only if no total can be found.
- "tax": the total tax charged on the bill (GST / VAT / sales tax / service tax) as a plain number. If CGST and SGST (or multiple tax lines) are itemised, return their sum. Use null if no tax is shown.
- "date": the invoice/receipt date in strict YYYY-MM-DD format. Infer the day/month order from context (e.g. Indian receipts are usually DD/MM/YYYY). Use null if no date is present.
- "vendor": the name of the business / merchant / supplier that ISSUED the receipt (the payee), not the customer. Keep it concise. Use null if not shown.
- "category": the single best-fit category for this expense from this list — ${CATEGORIES.join(', ')}. If none clearly fit, return a short custom label (1–3 words). Use null only if you cannot tell.

All five keys must always be present. Use the JSON value null (never "", "N/A" or 0) for anything you cannot determine.`

// JSON schema for structured output. Nullable via union types so the model can
// honestly report missing fields instead of inventing them.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['amount', 'tax', 'date', 'vendor', 'category'],
  properties: {
    amount: { type: ['number', 'null'] },
    tax: { type: ['number', 'null'] },
    date: { type: ['string', 'null'] },
    vendor: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
  },
}

function textFromMessage(msg) {
  return (msg?.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
}

// Tolerant JSON parse: strips code fences and pulls the first {...} block.
function parseJsonLoose(s) {
  if (!s) return null
  let t = s.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    return JSON.parse(t)
  } catch {
    /* try to locate an embedded object */
  }
  const m = t.match(/\{[\s\S]*\}/)
  if (m) {
    try {
      return JSON.parse(m[0])
    } catch {
      /* give up */
    }
  }
  return null
}

function toNumber(v) {
  if (v == null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''))
  return Number.isNaN(n) ? null : n
}

function toDate(v) {
  if (!v || typeof v !== 'string') return null
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function toStr(v) {
  if (v == null) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  if (!s || /^(n\/?a|none|unknown|null)$/i.test(s)) return null
  return s.slice(0, 80)
}

async function callClaude(client, content, useSchema) {
  const req = {
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  }
  if (useSchema) req.output_config = { format: { type: 'json_schema', schema: SCHEMA } }
  const msg = await client.messages.create(req)
  return textFromMessage(msg)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Not configured — tell the client to use on-device OCR instead.
    res.status(501).json({ error: 'ai_not_configured' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { kind, media_type, data } = body
    if (!data || !media_type) {
      res.status(400).json({ error: 'missing_image' })
      return
    }

    const client = new Anthropic({ apiKey })
    const fileBlock =
      kind === 'document'
        ? { type: 'document', source: { type: 'base64', media_type, data } }
        : { type: 'image', source: { type: 'base64', media_type, data } }
    const content = [fileBlock, { type: 'text', text: 'Extract the fields from this receipt.' }]

    let raw
    try {
      raw = await callClaude(client, content, true)
    } catch {
      // Some models / older API versions may not accept output_config; the
      // system prompt already asks for raw JSON, so retry without the schema.
      raw = await callClaude(client, content, false)
    }

    const parsed = parseJsonLoose(raw) || {}
    res.status(200).json({
      amount: toNumber(parsed.amount),
      tax: toNumber(parsed.tax),
      date: toDate(parsed.date),
      vendor: toStr(parsed.vendor),
      category: toStr(parsed.category),
    })
  } catch (err) {
    res.status(502).json({ error: err?.message || 'scan_failed' })
  }
}
