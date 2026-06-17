// OneDrive backup provider via Microsoft Graph (implicit OAuth). Requires an
// Azure app (client id) in VITE_MS_CLIENT_ID with "Access tokens (implicit)"
// enabled and the Files.ReadWrite.AppFolder delegated permission. Files live in
// the app's private folder (special/approot).
import { openPopupForToken } from './cloudPopup'

const CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID
export const onedriveConfigured = Boolean(CLIENT_ID)

const FILE_URL = 'https://graph.microsoft.com/v1.0/me/drive/special/approot:/offset-backup.json:/content'
let token = null

async function ensureToken() {
  if (token) return token
  const redirect = window.location.origin
  const url =
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize' +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    '&response_type=token' +
    `&redirect_uri=${encodeURIComponent(redirect)}` +
    '&response_mode=fragment' +
    `&scope=${encodeURIComponent('Files.ReadWrite.AppFolder')}`
  token = await openPopupForToken(url, redirect)
  return token
}

export async function onedriveBackup(payload) {
  const t = await ensureToken()
  const r = await fetch(FILE_URL, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!r.ok) throw new Error(`OneDrive upload failed (${r.status}).`)
}

export async function onedriveRestore() {
  const t = await ensureToken()
  const r = await fetch(FILE_URL, { headers: { Authorization: `Bearer ${t}` } })
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`OneDrive download failed (${r.status}).`)
  return r.json()
}
