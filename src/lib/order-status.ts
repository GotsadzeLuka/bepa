import type { OrderStatus } from '@prisma/client'

// A dispatched order cannot be cancelled as a restock; it needs a returns flow.
const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function getAllowedOrderStatuses(status: OrderStatus): readonly OrderStatus[] {
  return transitions[status]
}

export function isAllowedOrderStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return from === to || transitions[from].includes(to)
}
