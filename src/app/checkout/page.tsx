'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ShoppingBag, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function CheckoutPage() {
  const t = useTranslations('common')
  const supabase = createClient()
  const { items, getTotal, clearCart, hasHydrated } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
  })

  if (!hasHydrated) {
    return <div className="container py-10 sm:py-16 px-6" />
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Get current user (optional)
      const { data: { user } } = await supabase.auth.getUser()

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          status: 'pending',
          total: getTotal(),
          shipping_address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
          },
          notes: formData.notes || null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Success
      setOrderId(order.id)
      setOrderPlaced(true)
      clearCart()
      toast.success('Order placed successfully!')
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Order success screen
  if (orderPlaced) {
    return (
      <div className="container py-10 sm:py-16 text-center max-w-lg mx-auto px-6">
        <CheckCircle2 className="h-14 w-14 sm:h-20 sm:w-20 mx-auto text-green-500 mb-4 sm:mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Order Placed!</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-2">
          Thank you for your order. We&apos;ll contact you shortly to confirm the details.
        </p>
        {orderId && (
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
            Order ID: <span className="font-mono">{orderId.slice(0, 8).toUpperCase()}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto">{t('continueShopping')}</Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="container py-10 sm:py-16 text-center px-6">
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Add some products before checking out.</p>
        <Link href="/products">
          <Button size="lg">{t('continueShopping')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8">
      <Link 
        href="/cart" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">{t('checkout')}</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Contact Information */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Shipping Address</h2>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Order Notes (Optional)</h2>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Any special instructions for your order..."
                rows={3}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-50 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Your Order</h2>

              <div className="space-y-3 sm:space-y-4 max-h-[200px] sm:max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-lg overflow-hidden bg-white shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-300">
                          <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm line-clamp-2">{item.name}</p>
                      {item.variantName && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{item.variantName}</p>
                      )}
                      <p className="text-xs sm:text-sm">
                        {item.quantity} x ₾{item.price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-xs sm:text-sm">₾{(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3 sm:my-4" />

              <div className="space-y-2 sm:space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span>₾{getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
              </div>

              <Separator className="my-3 sm:my-4" />

              <div className="flex justify-between text-base sm:text-lg font-bold mb-4 sm:mb-6">
                <span>{t('total')}</span>
                <span>₾{getTotal().toFixed(2)}</span>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>

              <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-3 sm:mt-4">
                By placing this order, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
