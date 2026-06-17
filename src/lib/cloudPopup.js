// Minimal OAuth helper: opens a popup to the provider's implicit-grant
// authorize URL, then reads the access token from the fragment once the popup
// lands back on our own origin (redirect_uri). Works without any SDK.
export function openPopupForToken(authUrl, redirectUri) {
  return new Promise((resolve, reject) => {
    const popup = window.open(authUrl, 'offset_oauth', 'width=600,height=720')
    if (!popup) {
      reject(new Error('Popup blocked — allow popups for this site and try again.'))
      return
    }

    const started = Date.now()
    const timer = setInterval(() => {
      // Give up after 3 minutes.
      if (Date.now() - started > 180000) {
        clearInterval(timer)
        try { popup.close() } catch { /* ignore */ }
        reject(new Error('Timed out waiting for sign-in.'))
        return
      }
      if (popup.closed) {
        clearInterval(timer)
        reject(new Error('Sign-in window was closed.'))
        return
      }
      let href
      try {
        href = popup.location.href // throws (cross-origin) until back on our origin
      } catch {
        return // still on the provider's domain
      }
      if (href && href.startsWith(redirectUri)) {
        clearInterval(timer)
        const frag = popup.location.hash.replace(/^#/, '')
        const query = popup.location.search.replace(/^\?/, '')
        try { popup.close() } catch { /* ignore */ }
        const params = new URLSearchParams(frag || query)
        const token = params.get('access_token')
        if (token) resolve(token)
        else reject(new Error(params.get('error_description') || params.get('error') || 'No access token returned.'))
      }
    }, 400)
  })
}
