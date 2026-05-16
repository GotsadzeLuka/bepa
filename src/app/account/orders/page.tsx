'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images: { url: string; is_primary: boolean }[]
  }
}

interface Order {
  id: string
  status: string
  total: number
  created_at: string
  shipping_address: any
  items: OrderItem[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
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
              name,
              slug,
              images:product_images (url, is_primary)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data as unknown as Order[])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="h-8 w-32 bg-zinc-200 rounded" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-zinc-200 rounded-lg" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
        <p className="text-muted-foreground mb-8">
          You haven't placed any orders yet. Start shopping!
        </p>
        <Link href="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrder === order.id

          return (
            <div
              key={order.id}
              className="bg-zinc-50 rounded-lg overflow-hidden"
            >
              {/* Order Header */}
              <button
                onClick={() => toggleOrder(order.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-zinc-100 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-medium">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={cn('capitalize', statusColors[order.status])}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold">₾{order.total.toFixed(2)}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Order Details */}
              {isExpanded && (
                <div className="border-t p-4 space-y-4">
                  {/* Items */}
                  <div>
                    <h4 className="font-medium mb-3">Items</h4>
                    <div className="space-y-3">
                      {order.items.map((item) => {
                        const product = item.product
                        const primaryImage = product?.images?.find((img) => img.is_primary)?.url || product?.images?.[0]?.url

                        return (
                          <div key={item.id} className="flex gap-3">
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-white shrink-0">
                              {primaryImage ? (
                                <Image
                                  src={primaryImage}
                                  alt={product?.name || 'Product'}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-zinc-300">
                                  <ShoppingBag className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              {product ? (
                                <Link
                                  href={`/product/${product.slug}`}
                                  className="font-medium hover:text-primary"
                                >
                                  {product.name}
                                </Link>
                              ) : (
                                <p className="font-medium text-muted-foreground">
                                  Product not available
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × ₾{item.price}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
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
                      <h4 className="font-medium mb-2">Shipping Address</h4>
                      <div className="text-sm text-muted-foreground">
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
