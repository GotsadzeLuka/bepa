import type { Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/db'
import { cacheTags, PUBLIC_CACHE_REVALIDATE_SECONDS } from '@/lib/cache'
import {
  normalizeCategory,
  normalizeProduct,
  normalizeReview,
  type StoreProductFilters,
  type StoreProductResult,
} from '@/lib/catalog'
import { productFilterSchema, slugSchema, uuidSchema } from '@/lib/validations'

const requireDatabaseStorefront = process.env.BEPA_STOREFRONT_MODE === 'database'

function logStorefrontReadFailure(context: string, error: unknown) {
  if (requireDatabaseStorefront) {
    throw error
  }

  console.warn(`[storefront] Unable to load ${context} from database.`)
  if (process.env.NODE_ENV === 'development') {
    console.error(error)
  }
}

function emptyProductResult(filters: StoreProductFilters): StoreProductResult {
  return {
    products: [],
    pagination: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
      total: 0,
      totalPages: 1,
    },
  }
}

const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' as const } },
  variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.ProductInclude

function parseProductFilters(filters: StoreProductFilters) {
  const parsed = productFilterSchema.safeParse({
    ...filters,
    limit: filters.limit ?? 12,
    page: filters.page ?? 1,
  })

  return parsed.success ? parsed.data : null
}

function getProductOrderBy(sort: StoreProductFilters['sort']): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case 'price-asc':
      return { price: 'asc' }
    case 'price-desc':
      return { price: 'desc' }
    case 'name':
      return { nameEn: 'asc' }
    case 'newest':
    default:
      return { createdAt: 'desc' }
  }
}

function buildProductWhere(filters: NonNullable<ReturnType<typeof parseProductFilters>>) {
  const where: Prisma.ProductWhereInput = { isActive: true }

  if (filters.category) {
    where.category = { slug: filters.category, isActive: true }
  }

  if (filters.search) {
    where.OR = [
      { nameEn: { contains: filters.search, mode: 'insensitive' } },
      { nameKa: { contains: filters.search, mode: 'insensitive' } },
      { descriptionEn: { contains: filters.search, mode: 'insensitive' } },
      { descriptionKa: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.featured) {
    where.isFeatured = true
  }

  if (filters.sale) {
    where.salePrice = { not: null }
  }

  return where
}

const getCachedHomePageData = unstable_cache(
  async () => {
    try {
      const [categories, featuredProducts, saleProducts, latestProducts] = await Promise.all([
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
        }),
        prisma.product.findMany({
          where: { isActive: true, isFeatured: true },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: productInclude,
        }),
        prisma.product.findMany({
          where: { isActive: true, salePrice: { not: null } },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: productInclude,
        }),
        prisma.product.findMany({
          where: { isActive: true },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: productInclude,
        }),
      ])

      return {
        categories: categories.map(normalizeCategory),
        featuredProducts: featuredProducts.map(normalizeProduct),
        saleProducts: saleProducts.map(normalizeProduct),
        latestProducts: latestProducts.map(normalizeProduct),
      }
    } catch (error) {
      logStorefrontReadFailure('homepage data', error)
      return {
        categories: [],
        featuredProducts: [],
        saleProducts: [],
        latestProducts: [],
      }
    }
  },
  ['storefront-home'],
  {
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    tags: [cacheTags.storefrontHome, cacheTags.storefrontCategories, cacheTags.storefrontProducts],
  }
)

const getCachedCategories = unstable_cache(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
      })

      return categories.map(normalizeCategory)
    } catch (error) {
      logStorefrontReadFailure('categories', error)
      return []
    }
  },
  ['storefront-categories'],
  {
    revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    tags: [cacheTags.storefrontCategories],
  }
)

async function getProductsUncached(validatedFilters: NonNullable<ReturnType<typeof parseProductFilters>>) {
  const page = validatedFilters.page
  const limit = validatedFilters.limit
  const skip = (page - 1) * limit
  const where = buildProductWhere(validatedFilters)

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: getProductOrderBy(validatedFilters.sort),
        skip,
        take: limit,
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ])

    const normalizedProducts = products.map(normalizeProduct)
    return {
      products: normalizedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  } catch (error) {
    logStorefrontReadFailure('products', error)
    return emptyProductResult(validatedFilters)
  }
}

async function getProductBySlugUncached(validatedSlug: string) {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: validatedSlug, isActive: true },
      include: productInclude,
    })

    if (product) {
      return normalizeProduct(product)
    }

    return null
  } catch (error) {
    logStorefrontReadFailure('product detail', error)
    return null
  }
}

async function getRelatedProductsUncached(productId: string, categoryId: string | null, limit: number) {
  try {
    const relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        categoryId,
        category: { isActive: true },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: productInclude,
    })

    const normalizedProducts = relatedProducts.map(normalizeProduct)
    return normalizedProducts
  } catch (error) {
    logStorefrontReadFailure('related products', error)
    return []
  }
}

async function getProductReviewsUncached(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
      },
    })

    const normalizedReviews = reviews.map(normalizeReview)
    return normalizedReviews
  } catch (error) {
    logStorefrontReadFailure('product reviews', error)
    return []
  }
}

export const storefrontService = {
  async getHomePageData() {
    return getCachedHomePageData()
  },

  async getCategories() {
    return getCachedCategories()
  },

  async getProducts(filters: StoreProductFilters) {
    const validatedFilters = parseProductFilters(filters)
    if (!validatedFilters) {
      return emptyProductResult(filters)
    }

    return unstable_cache(
      () => getProductsUncached(validatedFilters),
      ['storefront-products', JSON.stringify(validatedFilters)],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [cacheTags.storefrontProducts, cacheTags.storefrontCategories],
      }
    )()
  },

  async getProductBySlug(slug: string) {
    const validatedSlug = slugSchema.safeParse(slug)
    if (!validatedSlug.success) {
      return null
    }

    return unstable_cache(
      () => getProductBySlugUncached(validatedSlug.data),
      ['storefront-product', validatedSlug.data],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [cacheTags.storefrontProducts, cacheTags.product(validatedSlug.data)],
      }
    )()
  },

  async getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
    const validatedProductId = uuidSchema.safeParse(productId)
    const validatedCategoryId = categoryId ? uuidSchema.safeParse(categoryId) : null
    const safeLimit = Math.min(Math.max(limit, 1), 12)

    if (!validatedProductId.success || (validatedCategoryId && !validatedCategoryId.success)) {
      return []
    }

    return unstable_cache(
      () => getRelatedProductsUncached(validatedProductId.data, validatedCategoryId?.data ?? null, safeLimit),
      ['storefront-related-products', validatedProductId.data, validatedCategoryId?.data ?? 'none', String(safeLimit)],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [cacheTags.storefrontProducts],
      }
    )()
  },

  async getProductReviews(productId: string) {
    const validatedProductId = uuidSchema.safeParse(productId)
    if (!validatedProductId.success) {
      return []
    }

    return unstable_cache(
      () => getProductReviewsUncached(validatedProductId.data),
      ['storefront-product-reviews', validatedProductId.data],
      {
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
        tags: [cacheTags.productReviews(validatedProductId.data)],
      }
    )()
  },
}
