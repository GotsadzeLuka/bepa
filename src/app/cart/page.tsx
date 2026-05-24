'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore } from '@/store/cart'

export default function CartPage() {
  const t = useTranslations('common')
  const { items, removeItem, updateQuantity, getTotal, clearCart, hasHydrated } = useCartStore()
  const total = getTotal()

  if (!hasHydrated) {
    return (
      <div className="container py-10 sm:py-14">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <Skeleton className="h-80 rounded-[2rem] bg-white/60" />
          <Skeleton className="h-80 rounded-[2rem] bg-white/60" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/82 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950">
            {t('emptyCart')}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
            Add the parts you need and your order summary will appear here.
          </p>
          <Button asChild size="lg" className="mt-7 rounded-full">
            <Link href="/products">
              {t('continueShopping')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {items.length} {t('items')}
          </p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {t('cart')}
          </h1>
        </div>
        <Button asChild variant="ghost" className="w-full rounded-full sm:w-auto">
          <Link href="/products">{t('continueShopping')}</Link>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <section className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.75rem] border border-white/70 bg-white/86 p-4 shadow-[0_18px_56px_-38px_rgba(15,23,42,0.42)] backdrop-blur-xl"
            >
              <div className="grid gap-4 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] bg-slate-100">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 text-base font-semibold text-slate-950">{item.name}</h2>
                      {item.variantName && (
                        <p className="mt-1 text-sm text-slate-500">{item.variantName}</p>
                      )}
                      <p className="mt-2 text-lg font-black text-slate-950">₾{item.price}</p>
                    </div>
                    <p className="text-left text-lg font-black text-slate-950 sm:text-right">
                      ₾{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        aria-label={`Decrease quantity for ${item.name}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-10 px-2 text-center text-sm font-semibold text-slate-800">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        aria-label={`Increase quantity for ${item.name}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/80 bg-white/76"
            onClick={clearCart}
          >
            Clear cart
          </Button>
        </section>

        <aside className="rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_24px_72px_-46px_rgba(15,23,42,0.52)] backdrop-blur-xl lg:sticky lg:top-36">
          <h2 className="font-display text-2xl font-black tracking-tight text-slate-950">
            Order summary
          </h2>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{t('subtotal')}</span>
              <span className="font-semibold text-slate-950">₾{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Delivery</span>
              <span className="font-semibold text-emerald-600">Free</span>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-slate-500">{t('total')}</span>
            <span className="text-3xl font-black tracking-tight text-slate-950">₾{total.toFixed(2)}</span>
          </div>

          <Button asChild size="lg" className="mt-6 w-full rounded-full">
            <Link href="/checkout">
              {t('checkout')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <div className="mt-5 grid gap-3 text-sm text-slate-500">
            <div className="flex gap-3">
              <Truck className="mt-0.5 h-4 w-4 text-primary" />
              <span>Free local delivery confirmation before dispatch.</span>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <span>Secure order review with stock checked at checkout.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
