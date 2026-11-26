import type { Prisma } from '@prisma/client'
import type { CreateOrderInput } from './validations'

type StoredCheckout = {
  userId: string | null
  shippingAddress: Prisma.JsonValue
  notes: string | null
  items: Array<{ productId: string | null; variantId: string | null; quantity: number }>
}

/** Compare the saved order after authenticating the buyer or checking their guest token. */
export function isSameCheckoutRequest(
  stored: StoredCheckout,
  incoming: CreateOrderInput,
  callerUserId: string | null,
): boolean {
  if (stored.userId !== callerUserId) return false
  if ((stored.notes ?? '') !== (incoming.notes ?? '')) return false
  const address = stored.shippingAddress
  if (!address || Array.isArray(address) || typeof address !== 'object') return false
  const keys = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'postalCode', 'locationUrl'] as const
  if (Object.keys(address).some((key) => !keys.some((allowed) => allowed === key))) return false
  if (!keys.every((key) => address[key] === incoming.shippingAddress[key])) return false

  if (stored.items.length !== incoming.items.length) return false
  const canonical = (productId: string | null, variantId: string | null) => productId + ':' + (variantId ?? '')
  const expected = new Map(incoming.items.map((item) => [
    canonical(item.productId, item.variantId ?? null), item.quantity,
  ]))
  return stored.items.every((item) =>
    expected.get(canonical(item.productId, item.variantId)) === item.quantity
  )
}
