import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hasValidImageSignature } from '../src/lib/image-signature'

const bytes = (text: string) => new TextEncoder().encode(text)
test('accepts matching PNG, JPEG, WebP and AVIF file signatures', () => {
  assert.equal(hasValidImageSignature(Uint8Array.from([137,80,78,71,13,10,26,10,1]), 'image/png'), true)
  assert.equal(hasValidImageSignature(Uint8Array.from([255,216,255,224,0]), 'image/jpeg'), true)
  assert.equal(hasValidImageSignature(bytes('RIFF____WEBP'), 'image/webp'), true)
  assert.equal(hasValidImageSignature(bytes('____ftypavif____'), 'image/avif'), true)
})
test('rejects spoofed types and unsupported SVG/HTML uploads', () => {
  assert.equal(hasValidImageSignature(bytes('<script>alert(1)</script>'), 'image/png'), false)
  assert.equal(hasValidImageSignature(bytes('<svg></svg>'), 'image/svg+xml'), false)
  assert.equal(hasValidImageSignature(bytes('RIFF____WEBP'), 'image/jpeg'), false)
  assert.equal(hasValidImageSignature(bytes('____ftypheic____'), 'image/avif'), false)
  assert.equal(hasValidImageSignature(bytes(''), 'image/png'), false)
})
