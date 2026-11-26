'use client'

import { useLoadOnMount } from '@/lib/use-load-on-mount'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Package, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/ui/SafeImage'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name_en: string
    slug: string
    images: { url: string; is_primary: boolean }[]
  }
}

interface ShippingAddress {
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  shipping_address: ShippingAddress | null
  items: OrderItem[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-sky-100 text-sky-800',
  processing: 'bg-violet-100 text-violet-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-rose-100 text-rose-800',
}

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (signal?.aborted) return
      if (!user) return

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          shipping_address,
          items:order_items (
            id,
            quantity,
            price,
            product:products (
              id,
              name_en,
              slug,
              images:product_images (url, is_primary)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (signal?.aborted) return
      setOrders(data as unknown as Order[])
    } catch (error) {
      if (signal?.aborted) return
      console.error('Error loading orders:', error)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [supabase])

  useLoadOnMount(loadOrders)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const toggleOrder = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded-full bg-white/60" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-[1.75rem] bg-white/60" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/70 bg-white/86 px-6 py-14 text-center shadow-[0_20px_64px_-44px_rgba(15,23,42,0.48)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">No Orders Yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
          You haven&apos;t placed any orders yet. Start shopping!
        </p>
        <Button asChild size="lg" className="mt-6 rounded-full">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 font-display text-2xl font-black tracking-tight text-slate-950">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id

          return (
            <div
              key={order.id}
              className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/86 shadow-[0_18px_56px_-38px_rgba(15,23,42,0.42)] backdrop-blur-xl"
            >
              {/* Order Header */}
              <button
                onClick={() => toggleOrder(order.id)}
                className="flex w-full items-center justify-between p-4 transition-colors hover:bg-white sm:p-5"
              >
                <div className="flex items-center gap-6">
                  <div className="text-left">
                    <p className="text-xs text-slate-500">Order ID</p>
                    <p className="font-mono text-sm font-semibold text-slate-950">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-xs text-slate-500">Date</p>
                    <p className="text-sm font-medium text-slate-800">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge className={cn('rounded-full capitalize', statusColors[order.status])}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="font-black tracking-tight text-slate-950">₾{order.total.toFixed(2)}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Order Details */}
              {isExpanded && (
                <div className="space-y-5 border-t border-slate-200/80 p-4 sm:p-5">
                  {/* Items */}
                  <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const product = item.product
                        const primaryImage = product?.images?.find((img) => img.is_primary)?.url || product?.images?.[0]?.url

                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                              {primaryImage ? (
                                <SafeImage
                                  src={primaryImage}
                                  alt={product?.name_en || 'Product'}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                  <ShoppingBag className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              {product ? (
                                <Link
                                  href={`/product/${product.slug}`}
                                  className="text-sm font-semibold text-slate-950 hover:text-primary"
                                >
                                  {product.name_en}
                                </Link>
                              ) : (
                                <p className="text-sm font-medium text-slate-500">
                                  Product not available
                                </p>
                              )}
                              <p className="mt-0.5 text-sm text-slate-500">
                                Qty: {item.quantity} × ₾{item.price}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-950">
                                ₾{(item.quantity * item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Shipping Address</h4>
                      <div className="text-sm leading-6 text-slate-600">
                        <p>
                          {order.shipping_address.firstName}{' '}
                          {order.shipping_address.lastName}
                        </p>
                        <p>{order.shipping_address.address}</p>
                        <p>
                          {order.shipping_address.city}
                          {order.shipping_address.postalCode &&
                            `, ${order.shipping_address.postalCode}`}
                        </p>
                        <p>{order.shipping_address.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
