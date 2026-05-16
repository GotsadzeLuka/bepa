'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Loader2, Eye, Package } from 'lucide-react'

interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode?: string
}

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: number
  product?: {
    name_en: string
    name_ka: string
  }
}

interface Order {
  id: string
  user_id: string | null
  status: string
  total: number
  shipping_address: ShippingAddress
  notes: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

export default function OrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(name_en, name_ka)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to fetch orders')
      console.error(error)
    } else {
      setOrders((data as unknown as Order[]) || [])
    }
    setLoading(false)
  }

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to update status')
    } else {
      toast.success('Order status updated')
      fetchOrders()
    }
  }

  const viewOrder = (order: Order) => {
    setSelectedOrder(order)
    setDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getOrderNumber = (id: string) => {
    return id.slice(0, 8).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="text-zinc-400">Manage customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
          <p className="text-zinc-400">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Order ID</TableHead>
                <TableHead className="text-zinc-400">Customer</TableHead>
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400">Total</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-900">
                  <TableCell className="font-mono text-white">
                    {getOrderNumber(order.id)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white">
                        {order.shipping_address?.firstName} {order.shipping_address?.lastName}
                      </p>
                      <p className="text-xs text-zinc-400">{order.shipping_address?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatDate(order.created_at)}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    ₾{order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={order.status}
                      onValueChange={(value) => updateStatus(order.id, value)}
                    >
                      <SelectTrigger className={`w-32 ${statusColors[order.status] || ''} border-none`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => viewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>
              Order {selectedOrder && getOrderNumber(selectedOrder.id)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Customer</h4>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-white">
                    {selectedOrder.shipping_address?.firstName} {selectedOrder.shipping_address?.lastName}
                  </p>
                  <p className="text-zinc-400">{selectedOrder.shipping_address?.email}</p>
                  <p className="text-zinc-400">{selectedOrder.shipping_address?.phone}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Shipping Address</h4>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-white">{selectedOrder.shipping_address?.address}</p>
                  <p className="text-zinc-400">
                    {selectedOrder.shipping_address?.city}
                    {selectedOrder.shipping_address?.postalCode && 
                      `, ${selectedOrder.shipping_address.postalCode}`}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Notes</h4>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-300">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Items</h4>
                <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-4 flex justify-between">
                      <div>
                        <p className="text-white">
                          {item.product?.name_en || 'Product'}
                        </p>
                        <p className="text-sm text-zinc-400">
                          Qty: {item.quantity} × ₾{item.price}
                        </p>
                      </div>
                      <p className="text-white font-medium">
                        ₾{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between font-bold">
                    <span>Total</span>
                    <span>₾{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
