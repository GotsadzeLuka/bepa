import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Prisma, OrderStatus } from '@prisma/client'
import { transitionOrder } from '../src/lib/order-fulfillment'

function fixture(initialStatus: OrderStatus, variant = false) {
  const state = {
    id: 'demo-order',
    status: initialStatus,
    items: [{ quantity: 2, productId: 'demo-product', variantId: variant ? 'demo-variant' : null, product: { id: 'demo-product', slug: 'demo-item' } }],
    user: null,
  }
  const calls = { orderUpdates: 0, productRestocks: 0, variantRestocks: 0 }
  let allowUpdate = true
  const tx = {
    $queryRaw: async () => [{ id: 'demo-product' }],
    order: {
      findUnique: async () => ({ ...state }),
      updateMany: async ({where, data}: {where:{status:OrderStatus};data:{status:OrderStatus}}) => {
        if (!allowUpdate || where.status !== state.status) return {count:0}
        calls.orderUpdates++
        state.status = data.status
        return {count:1}
      },
      findUniqueOrThrow: async () => ({ ...state }),
    },
    product: { updateMany: async () => { calls.productRestocks++; return {count:1} } },
    productVariant: { updateMany: async () => { calls.variantRestocks++; return {count:1} } },
  }
  return { tx: tx as unknown as Prisma.TransactionClient, state, calls, failNextUpdate: () => {allowUpdate=false} }
}

test('cancellation restores stock once and retry is idempotent', async () => {
  const {tx,calls} = fixture('confirmed')
  await transitionOrder(tx,'demo-order','cancelled')
  await transitionOrder(tx,'demo-order','cancelled')
  assert.equal(calls.orderUpdates, 1)
  assert.equal(calls.productRestocks, 1)
})

test('variant cancellation restores variant stock rather than base product stock', async () => {
  const {tx,calls} = fixture('processing',true)
  await transitionOrder(tx,'demo-order','cancelled')
  assert.equal(calls.variantRestocks, 1)
  assert.equal(calls.productRestocks, 0)
})

test('lost compare-and-swap forbids inventory restoration', async () => {
  const {tx,calls,failNextUpdate} = fixture('pending')
  failNextUpdate()
  await assert.rejects(transitionOrder(tx,'demo-order','cancelled'), /status changed/)
  assert.equal(calls.productRestocks, 0)
})

test('shipped orders cannot be cancelled through stock restoration flow', async () => {
  const {tx,calls} = fixture('shipped')
  await assert.rejects(transitionOrder(tx,'demo-order','cancelled'), /Invalid order status/)
  assert.equal(calls.productRestocks,0)
})
