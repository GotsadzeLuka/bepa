import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Prisma } from '@prisma/client'
import { calculateOrderTotal } from '../src/lib/money'

test('checkout uses decimal math for fractional prices', () => {
  assert.equal(calculateOrderTotal([
    { price: new Prisma.Decimal('0.10'), quantity: 3 },
    { price: '0.20', quantity: 1 },
  ]).toFixed(2), '0.50')
  assert.equal(calculateOrderTotal([{ price: '13.25', quantity: 4 }]).toFixed(2), '53.00')
})

test('checkout rejects empty orders and invalid values', () => {
  assert.throws(() => calculateOrderTotal([]))
  for (const quantity of [0, -1, 101, 1.5, Number.NaN]) {
    assert.throws(() => calculateOrderTotal([{ price: '2.00', quantity }]))
  }
  for (const price of ['0', '-1', 'NaN']) {
    assert.throws(() => calculateOrderTotal([{ price, quantity: 1 }]))
  }
})
