import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import {
  normalizeCategory,
  normalizeProduct,
  normalizeReview,
  type StoreProductFilters,
  type StoreProductResult,
} from '@/lib/catalog'
import { productFilterSchema, slugSchema, uuidSchema } from '@/lib/validations'

const requireDatabaseStorefront = process.env.BEPA_STOREFRONT_MODE === 'database'
const storefrontDemoMode = process.env.BEPA_STOREFRONT_MODE === 'demo'

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

export const storefrontService = {
  async getHomePageData() {
    if (storefrontDemoMode) {
      console.warn('[storefront] BEPA_STOREFRONT_MODE=demo is set, but bundled runtime mock data is disabled.')
    }

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

  async getCategories() {
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

  async getProducts(filters: StoreProductFilters) {
    const validatedFilters = parseProductFilters(filters)
    if (!validatedFilters) {
      return emptyProductResult(filters)
    }

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

      return {
        products: products.map(normalizeProduct),
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
  },

  async getProductBySlug(slug: string) {
    const validatedSlug = slugSchema.safeParse(slug)
    if (!validatedSlug.success) {
      return null
    }

    try {
      const product = await prisma.product.findFirst({
        where: { slug: validatedSlug.data, isActive: true },
        include: productInclude,
      })

      return product ? normalizeProduct(product) : null
    } catch (error) {
      logStorefrontReadFailure('product detail', error)
      return null
    }
  },

  async getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
    const validatedProductId = uuidSchema.safeParse(productId)
    const validatedCategoryId = categoryId ? uuidSchema.safeParse(categoryId) : null
    const safeLimit = Math.min(Math.max(limit, 1), 12)

    if (!validatedProductId.success || (validatedCategoryId && !validatedCategoryId.success)) {
      return []
    }

    try {
      const relatedProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { not: validatedProductId.data },
          categoryId: validatedCategoryId?.data ?? null,
          category: { isActive: true },
        },
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: productInclude,
      })

      return relatedProducts.map(normalizeProduct)
    } catch (error) {
      logStorefrontReadFailure('related products', error)
      return []
    }
  },

  async getProductReviews(productId: string) {
    const validatedProductId = uuidSchema.safeParse(productId)
    if (!validatedProductId.success) {
      return []
    }

    try {
      const reviews = await prisma.review.findMany({
        where: { productId: validatedProductId.data, isApproved: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true } },
        },
      })

      return reviews.map(normalizeReview)
    } catch (error) {
      logStorefrontReadFailure('product reviews', error)
      return []
    }
  },
}
