import { Prisma } from '@prisma/client'

/** Checkout, variant edits and restocking serialize on the parent product. */
export async function lockProducts(tx: Prisma.TransactionClient, productIds: string[]) {
  if (productIds.length === 0) return
  const ids = Prisma.join([...new Set(productIds)].map((id) => Prisma.sql`${id}::uuid`))
  await tx.$queryRaw`SELECT id FROM products WHERE id IN (${ids}) ORDER BY id FOR UPDATE`
}

/**
 * The checkout stock reservation boundary. This function must be invoked
 * inside the same transaction that creates the order and its order items.
 * Conditional UPDATE protects the final stock unit from concurrent buyers.
 */
export async function reserveInventory(
  tx: Prisma.TransactionClient,
  item: { productId: string; variantId?: string | null; quantity: number },
) {
  if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
    throw new Error('Invalid order quantity')
  }

  if (item.variantId) {
    const updated = await tx.productVariant.updateMany({
      where: {
        id: item.variantId,
        productId: item.productId,
        isActive: true,
        product: { isActive: true },
        stock: { gte: item.quantity },
      },
      data: { stock: { decrement: item.quantity } },
    })
    if (updated.count !== 1) throw new Error('One or more products do not have enough stock.')
    return
  }

  const updated = await tx.product.updateMany({
    where: { id: item.productId, isActive: true, stock: { gte: item.quantity } },
    data: { stock: { decrement: item.quantity } },
  })
  if (updated.count !== 1) throw new Error('One or more products do not have enough stock.')
}
