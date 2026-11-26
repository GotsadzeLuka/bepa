import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, test } from 'node:test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { prisma } from '../../src/lib/db'
import { checkoutRequestIdForGuestToken } from '../../src/lib/checkout-attempt'
import { CheckoutError, placeCheckout } from '../../src/lib/checkout'
import { reserveInventory } from '../../src/lib/inventory'
import { transitionOrder } from '../../src/lib/order-fulfillment'
import { createOrderSchema } from '../../src/lib/validations'
import { requireIsolatedDatabase } from '../../scripts/isolated-database'

requireIsolatedDatabase()

const products: string[] = []
const orders: string[] = []
const profiles: string[] = []

async function checkoutInput(productId: string) {
  const guestCheckoutToken = randomUUID()
  return createOrderSchema.parse({
    checkoutRequestId: await checkoutRequestIdForGuestToken(guestCheckoutToken),
    guestCheckoutToken,
    items: [{ productId, quantity: 1 }],
    shippingAddress: {
      firstName: 'Test', lastName: 'Buyer', email: 'buyer@example.invalid',
      address: '123 Demo Street', city: 'Tbilisi', phone: '+995555123456',
      postalCode: undefined,
    },
  })
}

async function createProduct(stock = 1) {
  const slug = 'integration-' + randomUUID()
  const p = await prisma.product.create({data: {
    nameEn: 'Synthetic test product', nameKa: 'სატესტო პროდუქტი',
    slug, price: '10.00', stock, isActive: true,
  }})
  products.push(p.id)
  return p
}
async function createOrder(productId: string, requestId = randomUUID(), variantId?: string) {
  const order = await prisma.order.create({data: {
    checkoutRequestId: requestId, status: 'confirmed',
    total: '10.00', shippingAddress: {firstName:'Test',lastName:'User'},
  }})
  orders.push(order.id)
  await prisma.orderItem.create({data: {
    orderId: order.id, productId, variantId, price:'10.00', quantity: 1,
  }})
  return order
}
after(async () => {
  // Foreign-key-dependent deletes happen in order, leaving no shared fixtures.
  await prisma.order.deleteMany({where:{id:{in:orders}}})
  await prisma.review.deleteMany({where:{userId:{in:profiles}}})
  await prisma.product.deleteMany({where:{id:{in:products}}})
  await prisma.profile.deleteMany({where:{id:{in:profiles}}})
  for (const id of profiles) await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${id}::uuid`
  await prisma.$disconnect()
})

test('only one concurrent buyer can reserve the final product unit', async () => {
  const p = await createProduct()
  const buy = async () => {
    const order = await placeCheckout(prisma, await checkoutInput(p.id), null)
    orders.push(order.id)
    return order.id
  }
  const outcomes = await Promise.allSettled([buy(), buy()])
  assert.equal(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1)
  assert.equal(await prisma.orderItem.count({ where: { productId: p.id } }), 1)
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock, 0)
})

test('failure after reservation rolls inventory and order back', async () => {
  const p = await createProduct()
  const key = randomUUID()
  await assert.rejects(prisma.$transaction(async tx => {
    await tx.order.create({data:{checkoutRequestId:key,total:'10.00',shippingAddress:{test:true}}})
    await reserveInventory(tx,{productId:p.id,quantity:1})
    throw new Error('Injected failure after stock reservation')
  }),/Injected failure/)
  assert.equal((await prisma.product.findUniqueOrThrow({where:{id:p.id}})).stock,1)
  assert.equal(await prisma.order.count({where:{checkoutRequestId:key}}),0)
})

test('concurrent legitimate retries return one order even when stock is exhausted', async () => {
  const p = await createProduct()
  const input = await checkoutInput(p.id)
  const buy = async () => {
    const order = await placeCheckout(prisma, input, null)
    orders.push(order.id)
    return order
  }
  const [first, second] = await Promise.all([buy(), buy()])
  assert.equal(first.id, second.id)
  assert.equal(await prisma.order.count({ where: { checkoutRequestId: input.checkoutRequestId } }), 1)
  assert.equal((await prisma.product.findUniqueOrThrow({ where: { id: p.id } })).stock, 0)
})

test('checkout uses database prices and does not persist the guest token', async () => {
  const p = await createProduct()
  await prisma.product.update({ where: { id: p.id }, data: { salePrice: '7.49' } })
  const input = await checkoutInput(p.id)
  const saved = await placeCheckout(prisma, input, null)
  orders.push(saved.id)
  const order = await prisma.order.findUniqueOrThrow({ where: { id: saved.id }, include: { items: true } })
  assert.equal(order.total.toFixed(2), '7.49')
  assert.equal(order.items[0].price.toFixed(2), '7.49')
  assert.notEqual(order.checkoutRequestId, input.guestCheckoutToken)
  await assert.rejects(
    placeCheckout(prisma, { ...input, guestCheckoutToken: randomUUID() }, null),
    CheckoutError,
  )
})

test('an unavailable PostgreSQL connection returns a controlled checkout error', async () => {
  const offline = new PrismaClient({
    adapter: new PrismaPg({ connectionString: 'postgresql://test@127.0.0.1:1/be_pa', connectionTimeoutMillis: 500 }),
    log: [],
  })
  try {
    await assert.rejects(
      placeCheckout(offline, await checkoutInput(randomUUID()), null),
      { message: 'Checkout is temporarily unavailable. Your cart has been kept. Please retry.' },
    )
  } finally {
    await offline.$disconnect()
  }
})

test('concurrent cancellation does not restore stock more than once', async () => {
  const p=await createProduct(0)
  const order=await createOrder(p.id)
  const results=await Promise.allSettled([
    prisma.$transaction(tx=>transitionOrder(tx,order.id,'cancelled')),
    prisma.$transaction(tx=>transitionOrder(tx,order.id,'cancelled')),
  ])
  assert.equal(results.filter(r=>r.status==='fulfilled').length>=1,true)
  assert.equal((await prisma.product.findUniqueOrThrow({where:{id:p.id}})).stock,1)
  assert.equal((await prisma.order.findUniqueOrThrow({where:{id:order.id}})).status,'cancelled')
})

test('variant stock is reserved and restored without altering base stock', async () => {
  const p=await createProduct(5)
  const variant=await prisma.productVariant.create({data:{
    productId:p.id,nameEn:'Test variant',nameKa:'ვარიანტი',price:'10.00',stock:1,
  }})
  await prisma.$transaction(tx=>reserveInventory(tx,{productId:p.id,variantId:variant.id,quantity:1}))
  assert.equal((await prisma.productVariant.findUniqueOrThrow({where:{id:variant.id}})).stock,0)
  const order=await createOrder(p.id,randomUUID(),variant.id)
  await prisma.$transaction(tx=>transitionOrder(tx,order.id,'cancelled'))
  assert.equal((await prisma.productVariant.findUniqueOrThrow({where:{id:variant.id}})).stock,1)
  assert.equal((await prisma.product.findUniqueOrThrow({where:{id:p.id}})).stock,5)
})

test('shipped orders reject cancellation without restocking', async () => {
  const p=await createProduct(0)
  const order=await createOrder(p.id)
  await prisma.order.update({where:{id:order.id},data:{status:'shipped'}})
  await assert.rejects(prisma.$transaction(tx=>transitionOrder(tx,order.id,'cancelled')),/Invalid order status/)
  assert.equal((await prisma.product.findUniqueOrThrow({where:{id:p.id}})).stock,0)
})

test('unique review per product and user survives concurrent inserts', async () => {
  const p=await createProduct()
  const uid=randomUUID();profiles.push(uid)
  // Create an auth identity first: the database signup trigger creates its profile.
  // This exercises the Supabase auth.users -> profiles integrity boundary.
  await prisma.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${uid}::uuid, ${'test-'+uid+'@example.invalid'})`
  assert.equal(await prisma.profile.count({where:{id:uid}}),1)
  const write=()=>prisma.review.create({data:{productId:p.id,userId:uid,rating:5}})
  const outcomes=await Promise.allSettled([write(),write()])
  assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1)
  assert.equal(await prisma.review.count({where:{productId:p.id,userId:uid}}),1)
})

test('database CHECK constraints prevent negative inventory and order quantities', async () => {
  const p=await createProduct(1)
  await assert.rejects(prisma.product.update({where:{id:p.id},data:{stock:-1}}))
  assert.equal((await prisma.product.findUniqueOrThrow({where:{id:p.id}})).stock,1)
  const order=await createOrder(p.id)
  await assert.rejects(prisma.orderItem.create({data:{orderId:order.id,productId:p.id,quantity:0,price:'10.00'}}))
})
