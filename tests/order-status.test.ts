import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAllowedOrderStatuses, isAllowedOrderStatusTransition } from '../src/lib/order-status'

test('normal fulfillment and pre-shipment cancellation are allowed', () => {
  assert.equal(isAllowedOrderStatusTransition('pending', 'confirmed'), true)
  assert.equal(isAllowedOrderStatusTransition('confirmed', 'processing'), true)
  assert.equal(isAllowedOrderStatusTransition('processing', 'shipped'), true)
  assert.equal(isAllowedOrderStatusTransition('shipped', 'delivered'), true)
  assert.equal(isAllowedOrderStatusTransition('processing', 'cancelled'), true)
  assert.equal(isAllowedOrderStatusTransition('pending', 'pending'), true)
})

test('cancelled, shipped and delivered orders cannot be silently restocked or reactivated', () => {
  assert.deepEqual(getAllowedOrderStatuses('cancelled'), [])
  assert.deepEqual(getAllowedOrderStatuses('delivered'), [])
  assert.equal(isAllowedOrderStatusTransition('cancelled','pending'), false)
  assert.equal(isAllowedOrderStatusTransition('shipped','cancelled'), false)
  assert.equal(isAllowedOrderStatusTransition('delivered','cancelled'), false)
})
