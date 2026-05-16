'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const t = useTranslations('common')
  const { items, removeItem, updateQuantity, getTotal, clearCart, hasHydrated } = useCartStore()

  if (!hasHydrated) {
    return <div className="container py-12 sm:py-16 px-6" />
  }

  if (items.length === 0) {
    return (
      <div className="container py-12 sm:py-16 text-center px-6">
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('emptyCart')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Start shopping to add items to your cart.</p>
        <Link href="/products">
          <Button size="lg">{t('continueShopping')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-4 sm:py-6 md:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">{t('cart')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-zinc-50 rounded-lg"
            >
              <div className="flex gap-3 sm:gap-4">
                {/* Image */}
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden bg-white shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-300">
                      <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base line-clamp-2">{item.name}</h3>
                  {item.variantName && (
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.variantName}</p>
                  )}
                  <p className="font-bold mt-1 text-sm sm:text-base">₾{item.price}</p>
                </div>
              </div>

              {/* Mobile: Quantity & Actions Row */}
              <div className="flex items-center justify-between sm:justify-end gap-4 mt-1 sm:mt-0">
                {/* Quantity */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 sm:w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Total & Delete */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="font-bold text-sm sm:text-base">₾{(item.price * item.quantity).toFixed(2)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={clearCart}>
              Clear Cart
            </Button>
            <Link href="/products">
              <Button variant="ghost" size="sm">{t('continueShopping')}</Button>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-50 rounded-lg p-4 sm:p-6 sticky top-24">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Order Summary</h2>
            
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

            <div className="flex justify-between text-base sm:text-lg font-bold">
              <span>{t('total')}</span>
              <span>₾{getTotal().toFixed(2)}</span>
            </div>

            <Link href="/checkout" className="block mt-4 sm:mt-6">
              <Button className="w-full" size="lg">
                {t('checkout')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
