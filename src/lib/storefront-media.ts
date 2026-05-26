import type { StoreCategory, StoreProduct, StoreProductImage } from '@/lib/catalog'

type MediaDescriptor = {
  src: string | null
  alt: string
  objectPosition?: string
}

const PRODUCT_MEDIA: Record<string, Partial<MediaDescriptor>> = {
  'apex-led-headlight-kit': { objectPosition: '60% center' },
  'nightrun-fog-lamp-pair': { objectPosition: '54% center' },
  'atlas-agm-battery-70ah': { objectPosition: 'center' },
  'torque-ceramic-brake-pad-set': { objectPosition: 'center' },
  'urbanshield-dash-camera': { objectPosition: '56% center' },
  'pureflow-cabin-filter': { objectPosition: 'center' },
  'endurance-5w30-engine-oil': { objectPosition: '44% center' },
  'aeroflex-wiper-blade-set': { objectPosition: '62% center' },
  'thermoguard-coolant-plus': { objectPosition: '46% center' },
}

function sortProductImages(images: StoreProductImage[]) {
  return [...images].sort((left, right) => left.sortOrder - right.sortOrder)
}

export function getSafeImageSrc(value: string | null | undefined) {
  if (!value) return null

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

export function getCategoryMedia(category?: Pick<StoreCategory, 'slug' | 'nameEn' | 'imageUrl'> | string | null) {
  const name = typeof category === 'string' ? category : category?.nameEn
  const src = typeof category === 'string' ? null : getSafeImageSrc(category?.imageUrl)

  return {
    alt: name ? `${name} category image` : 'Automotive category image',
    objectPosition: 'center',
    src,
  } satisfies MediaDescriptor
}

export function getProductMedia(
  product: Pick<StoreProduct, 'slug' | 'nameEn' | 'images' | 'category'>
) {
  const categoryMedia = getCategoryMedia(product.category)
  const primaryImage = getSafeImageSrc(sortProductImages(product.images)[0]?.url)

  return {
    ...categoryMedia,
    ...(PRODUCT_MEDIA[product.slug] ?? {}),
    alt: product.nameEn || categoryMedia.alt,
    src: primaryImage ?? categoryMedia.src,
  } satisfies MediaDescriptor
}
