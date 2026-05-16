import type { StoreCategory, StoreProduct, StoreProductImage } from '@/lib/catalog'

type MediaDescriptor = {
  src: string
  alt: string
  objectPosition?: string
}

const CATEGORY_MEDIA: Record<string, MediaDescriptor> = {
  lighting: {
    src: '/storefront/categories/lighting.svg',
    alt: 'Premium automotive lighting components arranged in a night-driving scene.',
    objectPosition: 'center',
  },
  batteries: {
    src: '/storefront/categories/batteries.svg',
    alt: 'Performance battery rendered in a premium green workshop scene.',
    objectPosition: 'center',
  },
  brakes: {
    src: '/storefront/categories/brakes.svg',
    alt: 'Brake rotor and caliper rendered in a premium performance scene.',
    objectPosition: 'center',
  },
  filters: {
    src: '/storefront/categories/filters.svg',
    alt: 'Air and cabin filter rendered in a cool-toned maintenance scene.',
    objectPosition: 'center',
  },
  'oils-fluids': {
    src: '/storefront/categories/oils-fluids.svg',
    alt: 'Engine oil and workshop fluid rendered in a warm service-bay scene.',
    objectPosition: 'center',
  },
  accessories: {
    src: '/storefront/categories/accessories.svg',
    alt: 'Driving accessories and dashboard tech rendered in a premium cockpit scene.',
    objectPosition: 'center',
  },
  default: {
    src: '/storefront/categories/lighting.svg',
    alt: 'Editorial automotive category artwork.',
    objectPosition: 'center',
  },
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

export function getCategoryMedia(category?: Pick<StoreCategory, 'slug' | 'nameEn' | 'imageUrl'> | string | null) {
  if (typeof category === 'string') {
    return CATEGORY_MEDIA[category] ?? CATEGORY_MEDIA.default
  }

  const fallback = CATEGORY_MEDIA[category?.slug ?? ''] ?? CATEGORY_MEDIA.default

  if (!category) {
    return fallback
  }

  return {
    ...fallback,
    alt: category.nameEn ? `${category.nameEn} category artwork` : fallback.alt,
    src: category.imageUrl ?? fallback.src,
  }
}

export function getProductMedia(
  product: Pick<StoreProduct, 'slug' | 'nameEn' | 'images' | 'category'>
) {
  const fallback = {
    ...getCategoryMedia(product.category),
    ...(PRODUCT_MEDIA[product.slug] ?? {}),
  }

  const primaryImage = sortProductImages(product.images)[0]?.url ?? null

  return {
    ...fallback,
    alt: product.nameEn || fallback.alt,
    src: primaryImage ?? fallback.src,
  }
}
