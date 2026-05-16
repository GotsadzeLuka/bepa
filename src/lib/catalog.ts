export type StoreSort = 'price-asc' | 'price-desc' | 'name' | 'newest'

export interface StoreCategory {
  id: string
  nameEn: string
  nameKa: string
  slug: string
  imageUrl: string | null
  descriptionEn: string | null
  descriptionKa: string | null
  isActive: boolean
  sortOrder: number
}

export interface StoreProductImage {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
  sortOrder: number
}

export interface StoreProductVariant {
  id: string
  nameEn: string
  nameKa: string
  sku: string | null
  price: number
  stock: number
  isActive: boolean
}

export interface StoreReview {
  id: string
  productId: string
  rating: number
  comment: string | null
  user: {
    fullName: string | null
  } | null
  createdAt: Date
}

export interface StoreProduct {
  id: string
  categoryId: string | null
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn: string | null
  descriptionKa: string | null
  price: number
  salePrice: number | null
  sku: string | null
  stock: number
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  category: StoreCategory | null
  images: StoreProductImage[]
  variants: StoreProductVariant[]
}

export interface StoreProductFilters {
  category?: string
  search?: string
  featured?: boolean
  sale?: boolean
  sort?: StoreSort
  page?: number
  limit?: number
}

export interface StoreProductResult {
  products: StoreProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

export function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function asDate(value: unknown) {
  if (value instanceof Date) return value

  const parsed = new Date(typeof value === 'string' ? value : Date.now())
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export function normalizeCategory(category: unknown): StoreCategory {
  const record = asRecord(category)

  return {
    id: asString(record.id),
    nameEn: asString(record.nameEn ?? record.name_en),
    nameKa: asString(record.nameKa ?? record.name_ka),
    slug: asString(record.slug),
    imageUrl: asOptionalString(record.imageUrl ?? record.image_url),
    descriptionEn: asOptionalString(record.descriptionEn ?? record.description_en),
    descriptionKa: asOptionalString(record.descriptionKa ?? record.description_ka),
    isActive: asBoolean(record.isActive ?? record.is_active, true),
    sortOrder: asNumber(record.sortOrder ?? record.sort_order),
  }
}

export function normalizeProductImage(image: unknown): StoreProductImage {
  const record = asRecord(image)

  return {
    id: asString(record.id),
    url: asString(record.url),
    altText: asOptionalString(record.altText ?? record.alt_text),
    isPrimary: asBoolean(record.isPrimary ?? record.is_primary),
    sortOrder: asNumber(record.sortOrder ?? record.sort_order),
  }
}

export function normalizeVariant(variant: unknown): StoreProductVariant {
  const record = asRecord(variant)

  return {
    id: asString(record.id),
    nameEn: asString(record.nameEn ?? record.name_en),
    nameKa: asString(record.nameKa ?? record.name_ka),
    sku: asOptionalString(record.sku),
    price: asNumber(record.price),
    stock: asNumber(record.stock),
    isActive: asBoolean(record.isActive ?? record.is_active, true),
  }
}

export function normalizeProduct(product: unknown): StoreProduct {
  const record = asRecord(product)

  return {
    id: asString(record.id),
    categoryId: asOptionalString(record.categoryId ?? record.category_id),
    nameEn: asString(record.nameEn ?? record.name_en),
    nameKa: asString(record.nameKa ?? record.name_ka),
    slug: asString(record.slug),
    descriptionEn: asOptionalString(record.descriptionEn ?? record.description_en),
    descriptionKa: asOptionalString(record.descriptionKa ?? record.description_ka),
    price: asNumber(record.price),
    salePrice:
      record.salePrice === null || record.sale_price === null
        ? null
        : asNumber(record.salePrice ?? record.sale_price),
    sku: asOptionalString(record.sku),
    stock: asNumber(record.stock),
    isActive: asBoolean(record.isActive ?? record.is_active, true),
    isFeatured: asBoolean(record.isFeatured ?? record.is_featured),
    createdAt: asDate(record.createdAt ?? record.created_at),
    updatedAt: asDate(record.updatedAt ?? record.updated_at),
    category: record.category ? normalizeCategory(record.category) : null,
    images: Array.isArray(record.images) ? record.images.map(normalizeProductImage) : [],
    variants: Array.isArray(record.variants) ? record.variants.map(normalizeVariant) : [],
  }
}

export function normalizeReview(review: unknown): StoreReview {
  const record = asRecord(review)
  const user = asRecord(record.user)
  const profile = asRecord(record.profile)

  return {
    id: asString(record.id),
    productId: asString(record.productId ?? record.product_id),
    rating: asNumber(record.rating),
    comment: asOptionalString(record.comment),
    user: record.user || record.profile
      ? {
          fullName: asOptionalString(user.fullName ?? profile.fullName ?? profile.full_name),
        }
      : null,
    createdAt: asDate(record.createdAt ?? record.created_at),
  }
}

export function getCategoryName(category: Pick<StoreCategory, 'nameEn' | 'nameKa'> | null | undefined, locale: string) {
  if (!category) return ''
  return locale === 'ka' ? category.nameKa : category.nameEn
}

export function getProductName(product: Pick<StoreProduct, 'nameEn' | 'nameKa'>, locale: string) {
  return locale === 'ka' ? product.nameKa : product.nameEn
}

export function getVariantName(variant: Pick<StoreProductVariant, 'nameEn' | 'nameKa'>, locale: string) {
  return locale === 'ka' ? variant.nameKa : variant.nameEn
}

export function getProductDescription(product: Pick<StoreProduct, 'descriptionEn' | 'descriptionKa'>, locale: string) {
  return locale === 'ka' ? product.descriptionKa : product.descriptionEn
}

export function sortProductImages(images: StoreProductImage[]) {
  return [...images].sort((left, right) => left.sortOrder - right.sortOrder)
}

export function getPrimaryProductImage(product: Pick<StoreProduct, 'images'>) {
  return sortProductImages(product.images)[0]?.url ?? null
}

export function hasProductDiscount(product: Pick<StoreProduct, 'salePrice' | 'price'>) {
  return product.salePrice !== null && product.salePrice < product.price
}

export function getDisplayPrice(product: Pick<StoreProduct, 'salePrice' | 'price'>) {
  return hasProductDiscount(product) ? product.salePrice ?? product.price : product.price
}
