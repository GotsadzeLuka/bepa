'use client'

import { useLoadOnMount } from '@/lib/use-load-on-mount'
import { removeFromWishlist } from '@/app/actions'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Heart, ShoppingBag, Trash2, ShoppingCart } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { SafeImage } from '@/components/ui/SafeImage'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cart'
import { toast } from 'sonner'

interface WishlistItem {
  id: string
  product: {
    id: string
    name_en: string
    slug: string
    price: number
    sale_price: number | null
    images: { url: string; is_primary: boolean }[]
  }
}

export default function WishlistPage() {
  const t = useTranslations('common')
  const supabase = useMemo(() => createClient(), [])
  const addToCart = useCartStore((state) => state.addItem)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const fetchWishlist = useCallback(async (userId: string, signal?: AbortSignal) => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product:products (
            id,
            name_en,
            slug,
            price,
            sale_price,
            images:product_images (url, is_primary)
          )
        `)
        .eq('user_id', userId)

      if (error) throw error
      if (signal?.aborted) return
      setItems(data as unknown as WishlistItem[])
    } catch (error) {
      if (signal?.aborted) return
      console.error('Error fetching wishlist:', error)
      toast.error('Failed to load wishlist')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [supabase])

  const checkAuth = useCallback(async (signal?: AbortSignal) => {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (signal?.aborted) return
    setUser(user)

    if (user) {
      await fetchWishlist(user.id, signal)
    } else {
      setLoading(false)
    }
  }, [fetchWishlist, supabase])

  useLoadOnMount(checkAuth)

  const removeItem = async (productId: string) => {
    try {
      await removeFromWishlist(productId)
      setItems((current) => current.filter((item) => item.product.id !== productId))
      toast.success('Removed from wishlist')
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove item')
    }
  }

  const handleAddToCart = (item: WishlistItem) => {
    const product = item.product
    const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url

    addToCart({
      productId: product.id,
      name: product.name_en,
      price: product.sale_price || product.price,
      quantity: 1,
      image: primaryImage || undefined,
    })
    toast.success(t('addedToCart'))
  }

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="container py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/86 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950">{t('wishlist')}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">Please login to view your wishlist.</p>
          <Button asChild size="lg" className="mt-7 rounded-full">
            <Link href="/login">{t('login')}</Link>
          </Button>
        </section>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="container py-8 sm:py-10 lg:py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-56 rounded-full bg-white/60" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 rounded-[2rem] bg-white/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Empty wishlist
  if (items.length === 0) {
    return (
      <div className="container py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-[2rem] border border-white/70 bg-white/86 p-8 text-center shadow-[0_24px_72px_-46px_rgba(15,23,42,0.5)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-950">{t('wishlist')}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">{t('emptyWishlist')}</p>
          <Button asChild size="lg" className="mt-7 rounded-full">
            <Link href="/products">{t('continueShopping')}</Link>
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="container py-8 sm:py-10 lg:py-12">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {items.length} {t('items')}
        </p>
        <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          {t('wishlist')}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const product = item.product
          if (!product) return null
          const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url
          const price = product.sale_price || product.price
          const hasDiscount = product.sale_price && product.sale_price < product.price

          return (
            <div
              key={item.id}
              className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/88 shadow-[0_20px_58px_-34px_rgba(15,23,42,0.5)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_32px_90px_-42px_rgba(15,23,42,0.58)]"
            >
              {/* Image */}
              <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
                {primaryImage ? (
                  <SafeImage
                    src={primaryImage}
                    alt={product.name_en}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white/30">
                    <ShoppingBag className="h-12 w-12" />
                  </div>
                )}

                {hasDiscount && (
                  <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    {t('sale')}
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-4 sm:p-5">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="mb-2 line-clamp-2 font-semibold text-slate-950 transition-colors hover:text-primary">
                    {product.name_en}
                  </h3>
                </Link>

                <div className="mb-4 flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-950">₾{price}</span>
                  {hasDiscount && (
                    <span className="text-sm text-slate-400 line-through">
                      ₾{product.price}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-full"
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {t('addToCart')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-slate-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    aria-label={t('removeFromWishlist')}
                    onClick={() => removeItem(item.product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
