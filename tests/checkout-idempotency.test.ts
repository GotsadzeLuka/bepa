import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkoutRequestIdForGuestToken } from '../src/lib/checkout-attempt'
import { isSameCheckoutRequest } from '../src/lib/checkout-idempotency'
import type { CreateOrderInput } from '../src/lib/validations'

const input: CreateOrderInput = {
  checkoutRequestId: '00000000-0000-4000-8000-000000000002',
  guestCheckoutToken: '00000000-0000-4000-8000-000000000003',
  items: [{ productId: '00000000-0000-4000-8000-000000000001', quantity: 2 }],
  shippingAddress: {
    firstName: 'Demo', lastName: 'Customer', email: 'demo@example.com',
    phone: '+995555123456', address: 'Example street 10', city: 'Tbilisi',
  },
}
const existing = {
  userId: null, notes: null,
  items: input.items.map(item => ({...item, variantId: null})),
  shippingAddress: {...input.shippingAddress},
}
test('identical guest retry matches original order', () => {
  assert.equal(isSameCheckoutRequest(existing, input, null), true)
})
test('guest request ID is a stable UUIDv8 derived from the separate token', async () => {
  const token = input.guestCheckoutToken!
  const requestId = await checkoutRequestIdForGuestToken(token)
  assert.match(requestId, /^[a-f0-9]{8}-[a-f0-9]{4}-8[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/)
  assert.equal(await checkoutRequestIdForGuestToken(token), requestId)
  assert.notEqual(await checkoutRequestIdForGuestToken(input.checkoutRequestId), requestId)
})
test('different address, cart, or notes cannot retrieve a guest order ID', () => {
  assert.equal(isSameCheckoutRequest(existing, {
    ...input, shippingAddress: {...input.shippingAddress, email: 'attacker@example.com'},
  }, null), false)
  assert.equal(isSameCheckoutRequest(existing, {
    ...input, items: [{...input.items[0], quantity: 1}],
  }, null), false)
  assert.equal(isSameCheckoutRequest(existing, {...input, notes:'different'}, null), false)
})
test('authenticated retry requires matching account identity', () => {
  assert.equal(isSameCheckoutRequest({...existing, userId:'account-a'}, input, 'account-b'), false)
  assert.equal(isSameCheckoutRequest({...existing, userId:'account-a'}, input, null), false)
})
test('jsonb key order is immaterial but unknown fields fail closed', () => {
  const reordered = Object.fromEntries(Object.entries(existing.shippingAddress).reverse())
  assert.equal(isSameCheckoutRequest({...existing, shippingAddress:reordered}, input, null), true)
  assert.equal(isSameCheckoutRequest({...existing, shippingAddress:{...reordered, extra:'x'}}, input, null), false)
})
