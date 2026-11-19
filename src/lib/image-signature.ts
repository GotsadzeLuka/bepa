/**
 * Minimal image magic-byte validation for catalog uploads.
 * MIME supplied by the browser alone is untrusted.
 */
export function hasValidImageSignature(data: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') {
    return data.length > 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  }
  if (mime === 'image/png') {
    return data.length > 8 && [137,80,78,71,13,10,26,10].every((byte, i) => data[i] === byte)
  }
  if (mime === 'image/webp') {
    return data.length >= 12 &&
      'RIFF' === String.fromCharCode(...data.subarray(0, 4)) &&
      'WEBP' === String.fromCharCode(...data.subarray(8, 12))
  }
  if (mime === 'image/avif') {
    if (data.length < 16 || String.fromCharCode(...data.subarray(4, 8)) !== 'ftyp') return false
    const brand = String.fromCharCode(...data.subarray(8, 12))
    return brand === 'avif' || brand === 'avis'
  }
  return false
}
