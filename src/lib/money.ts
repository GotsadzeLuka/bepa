import { Prisma } from '@prisma/client'

/** Exact decimal math for checkout totals; avoid JavaScript floating point. */
export function calculateOrderTotal(
  lines: ReadonlyArray<{ price: Prisma.Decimal | string | number; quantity: number }>
): Prisma.Decimal {
  if (!lines.length) throw new Error('Order must include at least one item')
  return lines.reduce((total, item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      throw new Error('Invalid order quantity')
    }
    const price = new Prisma.Decimal(item.price)
    if (!price.isFinite() || price.lte(0)) throw new Error('Invalid order price')
    return total.plus(price.times(item.quantity))
  }, new Prisma.Decimal(0))
}
