import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSameCheckoutRequest } from '../src/lib/checkout-idempotency'
import type { CreateOrderInput } from '../src/lib/validations'

const input: CreateOrderInput = {
  checkoutRequestId: '00000000-0000-4000-8000-000000000002',
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
