'use client'

import { useCallback, useEffect, useState } from 'react'
import { getOrdersAdmin, updateOrderStatus } from '@/app/admin/actions'
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
import { Eye, MapPin, Package } from 'lucide-react'
import { AdminTableSkeleton } from '@/components/admin/TableSkeleton'
import { isGoogleMapsUrl } from '@/lib/location'
import { getAllowedOrderStatuses } from '@/lib/order-status'
import { useLocale, useTranslations } from 'next-intl'

interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode?: string
  locationUrl?: string
}

type Order = Awaited<ReturnType<typeof getOrdersAdmin>>[number] & {
  shipping_address: ShippingAddress
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
  const t = useTranslations('admin.orders')
  const common = useTranslations('admin.common')
  const statusT = useTranslations('admin.status')
  const toastText = useTranslations('admin.toast')
  const locale = useLocale()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrdersAdmin()
      setOrders(data as Order[])
    } catch (error) {
      toast.error(toastText('fetchOrdersFailed'))
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [toastText])

  useEffect(() => {
    void Promise.resolve().then(fetchOrders)
  }, [fetchOrders])

  const updateStatus = async (orderId: string, status: Order['status']) => {
    const previousOrders = orders
    // Optimistic update so the select reflects the change immediately.
    setOrders((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    )

    try {
      await updateOrderStatus(orderId, status)
      toast.success(toastText('orderStatusUpdated'))
    } catch {
      setOrders(previousOrders)
      toast.error(toastText('updateStatusFailed'))
    }
  }

  const viewOrder = (order: Order) => {
    setSelectedOrder(order)
    setDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
          <p className="text-zinc-400">{t('subtitle')}</p>
        </div>
        <AdminTableSkeleton rows={6} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">{t('title')}</h1>
        <p className="text-zinc-400">{t('subtitle')}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">{t('noOrders')}</h3>
          <p className="text-zinc-400">{t('emptyCopy')}</p>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{t('orderId')}</TableHead>
                <TableHead className="text-zinc-400">{common('customer')}</TableHead>
                <TableHead className="text-zinc-400">{common('date')}</TableHead>
                <TableHead className="text-zinc-400">{common('total')}</TableHead>
                <TableHead className="text-zinc-400">{common('status')}</TableHead>
                <TableHead className="text-zinc-400 text-right">{common('actions')}</TableHead>
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
                      disabled={getAllowedOrderStatuses(order.status).length === 0}
                      value={order.status}
                      onValueChange={(value) => updateStatus(order.id, value as Order['status'])}
                    >
                      <SelectTrigger className={`w-32 ${statusColors[order.status] || ''} border-none`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-800 text-white">
                        {([order.status, ...getAllowedOrderStatuses(order.status)] as const).map((status) => (
                          <SelectItem key={status} value={status}>{statusT(status)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white"
                      aria-label={t('viewOrder', { id: getOrderNumber(order.id) })}
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
              {t('orderTitle', { id: selectedOrder ? getOrderNumber(selectedOrder.id) : '' })}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">{common('customer')}</h4>
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
                <h4 className="text-sm font-medium text-zinc-400 mb-2">{t('shippingAddress')}</h4>
                <div className="bg-zinc-800 rounded-lg p-4">
                  <p className="text-white">{selectedOrder.shipping_address?.address}</p>
                  <p className="text-zinc-400">
                    {selectedOrder.shipping_address?.city}
                    {selectedOrder.shipping_address?.postalCode &&
                      `, ${selectedOrder.shipping_address.postalCode}`}
                  </p>
                  {selectedOrder.shipping_address?.locationUrl &&
                    isGoogleMapsUrl(selectedOrder.shipping_address.locationUrl) && (
                    <a
                      href={selectedOrder.shipping_address.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      <MapPin className="h-4 w-4" />
                      {t('viewOnMap')}
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">{t('notes')}</h4>
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-300">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">{t('items')}</h4>
                <div className="bg-zinc-800 rounded-lg divide-y divide-zinc-700">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-4 flex justify-between">
                      <div>
                        <p className="text-white">
                          {item.product ? (locale === 'ka' ? item.product.name_ka : item.product.name_en) : common('product')}
                          {item.variant?.name_en && (
                            <span className="ml-2 text-sm text-zinc-400">({locale === 'ka' ? item.variant.name_ka : item.variant.name_en})</span>
                          )}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {t('qtyPrice', { quantity: item.quantity, price: item.price })}
                        </p>
                      </div>
                      <p className="text-white font-medium">
                        ₾{(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="p-4 flex justify-between font-bold">
                    <span>{common('total')}</span>
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
