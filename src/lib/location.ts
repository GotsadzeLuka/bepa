/**
 * Google Maps location link helpers.
 *
 * A delivery location is stored as a plain Google Maps URL, either built
 * from browser geolocation coordinates or pasted by the user from the
 * Google Maps share dialog. Only Google-owned hosts are accepted so the
 * stored link is always safe for admins to open.
 */

const GOOGLE_MAPS_EXACT_HOSTS = new Set([
  'maps.app.goo.gl',
  'maps.google.com',
  'www.google.com',
  'google.com',
])

export function isGoogleMapsUrl(value: string): boolean {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return false
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    return false
  }

  const host = url.hostname.toLowerCase()

  // goo.gl short links are only maps when the path says so
  if (host === 'goo.gl') {
    return url.pathname.startsWith('/maps')
  }

  if (!GOOGLE_MAPS_EXACT_HOSTS.has(host)) {
    return false
  }

  // On the main google.com domain require an explicit /maps path
  if (host === 'google.com' || host === 'www.google.com') {
    return url.pathname.startsWith('/maps') || url.pathname === '/maps'
  }

  return true
}

export function buildMapsUrlFromCoords(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(6)
  const lng = longitude.toFixed(6)
  return `https://www.google.com/maps?q=${lat},${lng}`
}
