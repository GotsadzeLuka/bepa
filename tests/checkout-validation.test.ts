import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOrderSchema } from '../src/lib/validations'

const productId = '00000000-0000-4000-8000-000000000001'
const checkoutRequestId = '00000000-0000-4000-8000-000000000002'
const shippingAddress = {
  firstName: 'Demo', lastName: 'Customer',
  email: 'demo@example.com', phone: '+995555123456',
  address: 'Example street 10', city: 'Tbilisi',
}
const base = {
  checkoutRequestId, shippingAddress,
  items: [{ productId, quantity: 2 }],
}

test('valid checkout accepts a bounded cart with a stable request ID', () => {
  assert.equal(createOrderSchema.safeParse(base).success, true)
})
test('duplicate line items, oversized carts and invalid quantities are rejected', () => {
  assert.equal(createOrderSchema.safeParse({...base, items:[...base.items, ...base.items]}).success, false)
  assert.equal(createOrderSchema.safeParse({...base, items: Array(51).fill(base.items[0])}).success, false)
  assert.equal(createOrderSchema.safeParse({...base, items:[{productId,quantity:101}]}).success, false)
})
test('checkout requires a UUID request ID and validated shipping details', () => {
  assert.equal(createOrderSchema.safeParse({...base, checkoutRequestId:'not-uuid'}).success, false)
  assert.equal(createOrderSchema.safeParse({...base,shippingAddress:{...shippingAddress,email:'invalid'}}).success,false)
})
