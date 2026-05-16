import { prisma } from '@/lib/db'
import {
  normalizeCategory,
  normalizeProduct,
  normalizeReview,
  type StoreProductFilters,
} from '@/lib/catalog'
import {
  getMockCategories,
  getMockFeaturedProducts,
  getMockLatestProducts,
  getMockProductBySlug,
  getMockProductReviews,
  getMockProducts,
  getMockRelatedProducts,
  getMockSaleProducts,
} from '@/lib/mock-data'

const preferredStorefrontMode = process.env.BEPA_STOREFRONT_MODE
let storefrontMode: 'unknown' | 'database' | 'demo' =
  preferredStorefrontMode === 'database'
    ? 'unknown'
    : preferredStorefrontMode === 'demo' || process.env.NODE_ENV === 'development'
      ? 'demo'
      : 'unknown'

function activateDemoMode(reason: string, error?: unknown) {
  if (storefrontMode !== 'demo') {
    console.warn(`[storefront] Using demo catalog: ${reason}`)
  }

  if (error) {
    console.error(error)
  }

  storefrontMode = 'demo'
}

async function runWithDemoFallback<T>(
  query: () => Promise<T>,
  fallback: () => T,
  isEmpty: (value: T) => boolean
) {
  if (storefrontMode === 'demo') {
    return fallback()
  }

  try {
    const result = await query()

    if (isEmpty(result)) {
      activateDemoMode('database returned no storefront content')
      return fallback()
    }

    storefrontMode = 'database'
    return result
  } catch (error) {
    activateDemoMode('database request failed', error)
    return fallback()
  }
}

export const storefrontService = {
  async getHomePageData() {
    return runWithDemoFallback(
      async () => {
        const [categories, featuredProducts, saleProducts, latestProducts] = await Promise.all([
          prisma.category.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          }),
          prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
              category: true,
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true } },
            },
          }),
          prisma.product.findMany({
            where: { isActive: true, salePrice: { not: null } },
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
              category: true,
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true } },
            },
          }),
          prisma.product.findMany({
            where: { isActive: true },
            take: 8,
            orderBy: { createdAt: 'desc' },
            include: {
              category: true,
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true } },
            },
          }),
        ])

        return {
          categories: categories.map(normalizeCategory),
          featuredProducts: featuredProducts.map(normalizeProduct),
          saleProducts: saleProducts.map(normalizeProduct),
          latestProducts: latestProducts.map(normalizeProduct),
        }
      },
      () => ({
        categories: getMockCategories(),
        featuredProducts: getMockFeaturedProducts(8),
        saleProducts: getMockSaleProducts(8),
        latestProducts: getMockLatestProducts(8),
      }),
      (result) => result.categories.length === 0 || result.latestProducts.length === 0
    )
  },

  async getCategories() {
    return runWithDemoFallback(
      async () => {
        const categories = await prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        })

        return categories.map(normalizeCategory)
      },
      getMockCategories,
      (categories) => categories.length === 0
    )
  },

  async getProducts(filters: StoreProductFilters) {
    return runWithDemoFallback(
      async () => {
        const page = filters.page ?? 1
        const limit = filters.limit ?? 12
        const skip = (page - 1) * limit
        const where: Record<string, unknown> = { isActive: true }

        if (filters.category) {
          where.category = { slug: filters.category }
        }

        if (filters.search) {
          where.OR = [
            { nameEn: { contains: filters.search, mode: 'insensitive' } },
            { nameKa: { contains: filters.search, mode: 'insensitive' } },
            { descriptionEn: { contains: filters.search, mode: 'insensitive' } },
          ]
        }

        if (filters.featured) {
          where.isFeatured = true
        }

        if (filters.sale) {
          where.salePrice = { not: null }
        }

        let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }

        switch (filters.sort) {
          case 'price-asc':
            orderBy = { price: 'asc' }
            break
          case 'price-desc':
            orderBy = { price: 'desc' }
            break
          case 'name':
            orderBy = { nameEn: 'asc' }
            break
          default:
            orderBy = { createdAt: 'desc' }
            break
        }

        const [products, total] = await Promise.all([
          prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: {
              category: true,
              images: { orderBy: { sortOrder: 'asc' } },
              variants: { where: { isActive: true } },
            },
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
      },
      () => getMockProducts(filters),
      (result) => result.products.length === 0
    )
  },

  async getProductBySlug(slug: string) {
    return runWithDemoFallback(
      async () => {
        const product = await prisma.product.findFirst({
          where: { slug, isActive: true },
          include: {
            category: true,
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { where: { isActive: true } },
          },
        })

        return product ? normalizeProduct(product) : null
      },
      () => getMockProductBySlug(slug),
      (product) => product === null
    )
  },

  async getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
    return runWithDemoFallback(
      async () => {
        const relatedProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            id: { not: productId },
            categoryId,
          },
          take: limit,
          include: {
            category: true,
            images: { orderBy: { sortOrder: 'asc' } },
            variants: { where: { isActive: true } },
          },
        })

        return relatedProducts.map(normalizeProduct)
      },
      () => getMockRelatedProducts(productId, categoryId, limit),
      (products) => products.length === 0
    )
  },

  async getProductReviews(productId: string) {
    return runWithDemoFallback(
      async () => {
        const reviews = await prisma.review.findMany({
          where: { productId, isApproved: true },
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { fullName: true } },
          },
        })

        return reviews.map(normalizeReview)
      },
      () => getMockProductReviews(productId),
      () => false
    )
  },
}
