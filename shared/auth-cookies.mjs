// OAuth runs as a top-level navigation on our first-party hosted app.
// Keep the proof cookie on the same host across Google's return navigation.
export function firstPartyGoogleCookies(response, siteUrl, authSiteUrl) {
  if (!siteUrl || siteUrl !== authSiteUrl || !siteUrl.startsWith('https://')) return response;
  const headers = new Headers(response.headers);
  const combined = headers.get('Set-Cookie');
  if (!combined) return response;
  const cookies = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : combined.split(/,(?=\s*(?:__Host-)?google(?:OAuth(?:pkce|state|nonce)|RedirectTo)=)/);
  headers.delete('Set-Cookie');
  for (const cookie of cookies) {
    const googleCookie = /^(?:__Host-)?google(?:OAuth(?:pkce|state|nonce)|RedirectTo)=/.test(cookie.trim());
    headers.append('Set-Cookie', googleCookie
      ? cookie.replace(/;\s*Partitioned(?=;|$)/gi, '').replace(/;\s*SameSite=None(?=;|$)/gi, '; SameSite=Lax')
      : cookie);
  }
  return new Response(response.body, {status: response.status, statusText: response.statusText, headers});
}
