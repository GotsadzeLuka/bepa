/** Reject open redirects, including backslash and nested encoded separators. */
const BASE_ORIGIN = 'https://bepa.invalid'

export function getSafeRedirect(input: string | null | undefined): string {
  if (!input || input.length > 1024) return '/'

  let decoded = input
  for (let attempt = 0; attempt < 4; attempt++) {
    if (
      !decoded.startsWith('/') ||
      decoded.startsWith('//') ||
      decoded.startsWith('/\\') ||
      /[\u0000-\u001f\u007f\\]/.test(decoded)
    ) return '/'

    try {
      const next = decodeURIComponent(decoded)
      if (next === decoded) break
      decoded = next
    } catch {
      return '/'
    }
  }

  try {
    const url = new URL(input, BASE_ORIGIN)
    if (url.origin !== BASE_ORIGIN || url.username || url.password) return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}
