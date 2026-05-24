'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Heart, ShoppingBag, Trash2, ShoppingCart } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
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

  const fetchWishlist = useCallback(async (userId: string) => {
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
      setItems(data as unknown as WishlistItem[])
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Failed to load wishlist')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const checkAuth = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      fetchWishlist(user.id)
    } else {
      setLoading(false)
    }
  }, [fetchWishlist, supabase])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const removeFromWishlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(items.filter((item) => item.id !== id))
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
      <div className="container py-16 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('wishlist')}</h1>
        <p className="text-muted-foreground mb-8">Please login to view your wishlist.</p>
        <Link href="/login">
          <Button size="lg">{t('login')}</Button>
        </Link>
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="container py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-zinc-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Empty wishlist
  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t('wishlist')}</h1>
        <p className="text-muted-foreground mb-8">Your wishlist is empty. Start adding products you love!</p>
        <Link href="/products">
          <Button size="lg">{t('continueShopping')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">
        {t('wishlist')} ({items.length})
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          const product = item.product
          const primaryImage = product.images?.find((img) => img.is_primary)?.url || product.images?.[0]?.url
          const price = product.sale_price || product.price
          const hasDiscount = product.sale_price && product.sale_price < product.price

          return (
            <div key={item.id} className="group bg-white border rounded-lg overflow-hidden">
              {/* Image */}
              <Link href={`/product/${product.slug}`} className="relative block aspect-square">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={product.name_en}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-zinc-100">
                    <ShoppingBag className="h-12 w-12 text-zinc-300" />
                  </div>
                )}

                {hasDiscount && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-4">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="font-medium line-clamp-2 hover:text-primary mb-2">
                    {product.name_en}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-lg">₾{price}</span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₾{product.price}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t('addToCart')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeFromWishlist(item.id)}
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
