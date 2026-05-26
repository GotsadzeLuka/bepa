'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { ProductArtwork } from '@/components/product/ProductArtwork'
import {
  getCategoryName,
  getProductDescription,
  getProductName,
  sortProductImages,
  type StoreProduct,
} from '@/lib/catalog'
import { getProductMedia, getSafeImageSrc } from '@/lib/storefront-media'

interface ProductImagesProps {
  product: StoreProduct
}

export function ProductImages({ product }: ProductImagesProps) {
  const locale = useLocale()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const sortedImages = sortProductImages(product.images)
  const safeImages = sortedImages.flatMap((image) => {
    const url = getSafeImageSrc(image.url)
    return url ? [{ ...image, url }] : []
  })
  const currentImage = safeImages[selectedIndex]?.url ?? null
  const productName = getProductName(product, locale)
  const categoryName = getCategoryName(product.category, locale)
  const fallbackMedia = getProductMedia(product)

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/65 bg-slate-100 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.65)]">
        {currentImage ? (
          <Image
            src={currentImage}
            alt={productName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <ProductArtwork
            title={productName}
            category={categoryName || 'BEPA'}
            subtitle={getProductDescription(product, locale)}
            tone={product.category?.slug}
            imageSrc={fallbackMedia.src}
            imageAlt={fallbackMedia.alt}
            objectPosition={fallbackMedia.objectPosition}
          />
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {safeImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl border transition-all sm:h-20 sm:w-20 ${
                index === selectedIndex
                  ? 'border-primary shadow-[0_14px_40px_-20px_rgba(249,115,22,0.8)]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Image
                src={image.url}
                alt={`${productName} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
