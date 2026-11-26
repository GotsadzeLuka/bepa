import { Prisma, type PrismaClient } from '@prisma/client'
import { checkoutRequestIdForGuestToken } from './checkout-attempt'
import { isSameCheckoutRequest } from './checkout-idempotency'
import { lockProducts, reserveInventory } from './inventory'
import { calculateOrderTotal } from './money'
import type { CreateOrderInput } from './validations'

export class CheckoutError extends Error {}

const checkoutSelect = {
  id: true,
  userId: true,
  shippingAddress: true,
  notes: true,
  items: { select: { productId: true, variantId: true, quantity: true } },
} satisfies Prisma.OrderSelect

export async function placeCheckout(
  db: PrismaClient,
  order: CreateOrderInput,
  userId: string | null,
): Promise<{ id: string; products: { id: string; slug: string }[] }> {
  const token = order.guestCheckoutToken
  if (!userId && (!token || await checkoutRequestIdForGuestToken(token) !== order.checkoutRequestId)) {
    throw new CheckoutError('Start a fresh checkout and try again.')
  }

  try {
    return await db.$transaction(async (tx) => {
      // Serialize this checkout attempt before we inspect stock. A retry must
      // succeed even if the original request purchased the last unit.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${order.checkoutRequestId}::text, 0))::text`
      const prior = await tx.order.findUnique({
        where: { checkoutRequestId: order.checkoutRequestId },
        select: checkoutSelect,
      })
      if (prior) {
        if (!isSameCheckoutRequest(prior, order, userId)) {
          throw new CheckoutError('Checkout request does not match the saved order.')
        }
        return { id: prior.id, products: [] }
      }

      const productIds = [...new Set(order.items.map((item) => item.productId))]
      const variantIds = order.items.flatMap((item) => item.variantId ? [item.variantId] : [])
      await lockProducts(tx, productIds)
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, slug: true, price: true, salePrice: true, stock: true },
      })
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
        select: { id: true, productId: true, price: true, stock: true },
      })

      const productsById = new Map(products.map((product) => [product.id, product]))
      const variantsById = new Map(variants.map((variant) => [variant.id, variant]))
      const pricedItems = order.items.map((item) => {
        const product = productsById.get(item.productId)
        const variant = item.variantId ? variantsById.get(item.variantId) : undefined
        if (!product || (item.variantId && !variant)) {
          throw new CheckoutError('One or more items are no longer available.')
        }
        if (variant && variant.productId !== product.id) {
          throw new CheckoutError('The selected variant does not belong to that product.')
        }
        if ((variant?.stock ?? product.stock) < item.quantity) {
          throw new CheckoutError('One or more items have insufficient stock.')
        }
        return { ...item, price: variant?.price ?? product.salePrice ?? product.price }
      })

      const total = calculateOrderTotal(pricedItems)
      const saved = await tx.order.create({
        data: {
          userId,
          checkoutRequestId: order.checkoutRequestId,
          total,
          shippingAddress: order.shippingAddress,
          notes: order.notes,
          items: { createMany: { data: pricedItems } },
        },
        select: { id: true },
      })
      for (const item of pricedItems) await reserveInventory(tx, item)
      return { id: saved.id, products }
    })
  } catch (error) {
    if (error instanceof CheckoutError) throw error
    throw new CheckoutError('Checkout is temporarily unavailable. Your cart has been kept. Please retry.', {
      cause: error,
    })
  }
}
