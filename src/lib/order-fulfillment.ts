import type { OrderStatus, Prisma } from '@prisma/client'
import { isAllowedOrderStatusTransition } from './order-status'

/**
 * Purely transactional order transition. Call inside Prisma.$transaction.
 * Conditional status update + inventory restoration must commit atomically.
 */
export async function transitionOrder(tx: Prisma.TransactionClient, orderId: string, nextStatus: OrderStatus) {
  const current = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } }, user: true },
  })
  if (!current) throw new Error('Order not found')
  if (!isAllowedOrderStatusTransition(current.status, nextStatus)) {
    throw new Error('Invalid order status transition')
  }
  if (current.status === nextStatus) return current

  // Compare-and-swap guarantees concurrent transitions cannot both succeed.
  const changed = await tx.order.updateMany({
    where: { id: orderId, status: current.status },
    data: { status: nextStatus },
  })
  if (changed.count !== 1) throw new Error('Order status changed; refresh and retry')

  if (nextStatus === 'cancelled') {
    for (const item of current.items) {
      // Deleted product or variant records may leave nullable foreign keys.
      // They cannot be restocked, but cancellation must remain possible.
      if (item.variantId) {
        await tx.productVariant.updateMany({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      } else if (item.productId) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }
  }

  return tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { product: true, variant: true } }, user: true },
  })
}
