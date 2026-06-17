// Dropbox backup provider (implicit OAuth + content API). Requires a Dropbox
// app key in VITE_DROPBOX_APP_KEY. Use an "App folder" scoped app so files
// live in a private folder; paths are relative to that folder.
import { openPopupForToken } from './cloudPopup'

const APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY
export const dropboxConfigured = Boolean(APP_KEY)

const FILE_PATH = '/offset-backup.json'
let token = null

async function ensureToken() {
  if (token) return token
  const redirect = window.location.origin
  const url =
    'https://www.dropbox.com/oauth2/authorize' +
    `?client_id=${encodeURIComponent(APP_KEY)}` +
    '&response_type=token' +
    `&redirect_uri=${encodeURIComponent(redirect)}`
  token = await openPopupForToken(url, redirect)
  return token
}

export async function dropboxBackup(payload) {
  const t = await ensureToken()
  const r = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({ path: FILE_PATH, mode: 'overwrite', mute: true }),
    },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`Dropbox upload failed (${r.status}).`)
}

export async function dropboxRestore() {
  const t = await ensureToken()
  const r = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Dropbox-API-Arg': JSON.stringify({ path: FILE_PATH }),
    },
  })
  if (r.status === 409) return null // path/not_found
  if (!r.ok) throw new Error(`Dropbox download failed (${r.status}).`)
  return r.json()
}
