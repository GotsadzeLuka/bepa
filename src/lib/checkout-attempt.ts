/** Derive a UUIDv8 attempt ID from a separately generated, random guest token. */
export async function checkoutRequestIdForGuestToken(token: string): Promise<string> {
  const input = new TextEncoder().encode('bepa guest checkout v1\n' + token)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', input)
  const bytes = new Uint8Array(digest, 0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x80
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}
