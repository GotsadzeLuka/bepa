/**
 * Database Service Layer
 * 
 * Provides type-safe database operations using Prisma ORM.
 * All queries are parameterized automatically by Prisma, preventing SQL injection.
 * 
 * SECURITY:
 * - All inputs should be validated through Zod schemas before calling these functions
 * - Prisma automatically escapes and parameterizes all queries
 * - No raw SQL queries allowed
 */

import { prisma } from '@/lib/db'
import type { OrderStatus, Prisma } from '@prisma/client'
import { slugSchema } from '@/lib/validations'
import type {
  ProductFilterInput,
  CreateProductInput,
  UpdateProductInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateOrderInput,
  CreateReviewInput,
  CreateNewsInput,
  UpdateNewsInput,
} from '@/lib/validations'

// =====================================================
// PRODUCT QUERIES
// =====================================================

export const productService = {
  /**
   * Get products with filtering, pagination, and sorting.
   */
  async getProducts(filters: ProductFilterInput) {
    const { category, search, featured, sale, minPrice, maxPrice, sort, page, limit } = filters
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      isActive: true,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameKa: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (featured) {
      where.isFeatured = true
    }

    if (sale) {
      where.salePrice = { not: null }
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }

    // Build orderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
    
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'name':
        orderBy = { nameEn: 'asc' }
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
        },
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Get a single product by slug.
   */
  async getProductBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  },

  /**
   * Get product by ID (for admin).
   */
  async getProductById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    })
  },

  /**
   * Create a new product (admin only).
   */
  async createProduct(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        nameEn: data.nameEn,
        nameKa: data.nameKa,
        slug: data.slug,
        descriptionEn: data.descriptionEn,
        descriptionKa: data.descriptionKa,
        price: data.price,
        salePrice: data.salePrice,
        categoryId: data.categoryId,
        sku: data.sku,
        stock: data.stock,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
    })
  },

  /**
   * Update a product (admin only).
   */
  async updateProduct(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete a product (admin only).
   */
  async deleteProduct(id: string) {
    return prisma.product.delete({
      where: { id },
    })
  },

  /**
   * Get featured products for homepage.
   */
  async getFeaturedProducts(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
  },

  /**
   * Get sale products.
   */
  async getSaleProducts(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true, salePrice: { not: null } },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
  },

  /**
   * Get latest products.
   */
  async getLatestProducts(limit = 8) {
    return prisma.product.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
  },

  /**
   * Get related products.
   */
  async getRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        categoryId: categoryId,
      },
      take: limit,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })
  },
}

// =====================================================
// CATEGORY QUERIES
// =====================================================

export const categoryService = {
  /**
   * Get all active categories.
   */
  async getCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  },

  /**
   * Get all categories (admin).
   */
  async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })
  },

  /**
   * Get category by slug.
   */
  async getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
    })
  },

  /**
   * Create category (admin only).
   */
  async createCategory(data: CreateCategoryInput) {
    return prisma.category.create({ data })
  },

  /**
   * Update category (admin only).
   */
  async updateCategory(id: string, data: UpdateCategoryInput) {
    return prisma.category.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete category (admin only).
   */
  async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id },
    })
  },
}

// =====================================================
// ORDER QUERIES
// =====================================================

export const orderService = {
  /**
   * Get orders for a user.
   */
  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { include: { images: { take: 1 } } },
          },
        },
      },
    })
  },

  /**
   * Get all orders (admin).
   */
  async getAllOrders() {
    return prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, fullName: true } },
        items: {
          include: {
            product: { select: { nameEn: true } },
          },
        },
      },
    })
  },

  /**
   * Get order by ID.
   */
  async getOrderById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, fullName: true } },
        items: {
          include: {
            product: { include: { images: { take: 1 } } },
            variant: true,
          },
        },
      },
    })
  },

  /**
   * Create order with items in a transaction.
   */
  async createOrder(userId: string | null, data: CreateOrderInput, itemPrices: Map<string, number>) {
    // Calculate total from validated prices
    let total = 0
    for (const item of data.items) {
      const price = itemPrices.get(item.productId + (item.variantId || ''))
      if (!price) throw new Error('Invalid product price')
      total += price * item.quantity
    }

    // Use transaction for atomic order creation
    return prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          total,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          status: 'pending',
        },
      })

      // Create order items
      await tx.orderItem.createMany({
        data: data.items.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: itemPrices.get(item.productId + (item.variantId || ''))!,
        })),
      })

      // Update product stock
      for (const item of data.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return order
    })
  },

  /**
   * Update order status (admin).
   */
  async updateOrderStatus(id: string, status: string) {
    return prisma.order.update({
      where: { id },
      data: { status: status as OrderStatus },
    })
  },
}

// =====================================================
// REVIEW QUERIES
// =====================================================

export const reviewService = {
  /**
   * Get approved reviews for a product.
   */
  async getProductReviews(productId: string) {
    return prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
      },
    })
  },

  /**
   * Create a review.
   */
  async createReview(userId: string, data: CreateReviewInput) {
    return prisma.review.create({
      data: {
        userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
        isApproved: false,
      },
    })
  },

  /**
   * Get all reviews (admin).
   */
  async getAllReviews() {
    return prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { nameEn: true } },
        user: { select: { email: true, fullName: true } },
      },
    })
  },

  /**
   * Approve review (admin).
   */
  async approveReview(id: string) {
    return prisma.review.update({
      where: { id },
      data: { isApproved: true },
    })
  },

  /**
   * Delete review (admin).
   */
  async deleteReview(id: string) {
    return prisma.review.delete({
      where: { id },
    })
  },
}

// =====================================================
// WISHLIST QUERIES
// =====================================================

export const wishlistService = {
  /**
   * Get user's wishlist.
   */
  async getUserWishlist(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            images: { take: 1 },
          },
        },
      },
    })
  },

  /**
   * Add to wishlist.
   */
  async addToWishlist(userId: string, productId: string) {
    return prisma.wishlist.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    })
  },

  /**
   * Remove from wishlist.
   */
  async removeFromWishlist(userId: string, productId: string) {
    return prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    })
  },

  /**
   * Check if product is in wishlist.
   */
  async isInWishlist(userId: string, productId: string) {
    const item = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    })
    return !!item
  },
}

// =====================================================
// NEWS QUERIES
// =====================================================

export const newsService = {
  /**
   * Get published news.
   */
  async getPublishedNews() {
    try {
      return await prisma.news.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      console.warn('[news] Unable to load published news from database.')
      if (process.env.NODE_ENV === 'development') {
        console.error(error)
      }
      return []
    }
  },

  /**
   * Get all news (admin).
   */
  async getAllNews() {
    return prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
    })
  },

  /**
   * Get news by slug.
   */
  async getNewsBySlug(slug: string) {
    const validatedSlug = slugSchema.safeParse(slug)
    if (!validatedSlug.success) {
      return null
    }

    try {
      return await prisma.news.findFirst({
        where: { slug: validatedSlug.data, isPublished: true },
      })
    } catch (error) {
      console.warn('[news] Unable to load news item from database.')
      if (process.env.NODE_ENV === 'development') {
        console.error(error)
      }
      return null
    }
  },

  /**
   * Create news (admin).
   */
  async createNews(data: CreateNewsInput) {
    return prisma.news.create({ data })
  },

  /**
   * Update news (admin).
   */
  async updateNews(id: string, data: UpdateNewsInput) {
    return prisma.news.update({
      where: { id },
      data,
    })
  },

  /**
   * Delete news (admin).
   */
  async deleteNews(id: string) {
    return prisma.news.delete({
      where: { id },
    })
  },
}

// =====================================================
// PROFILE QUERIES
// =====================================================

export const profileService = {
  /**
   * Get profile by ID.
   */
  async getProfile(id: string) {
    return prisma.profile.findUnique({
      where: { id },
    })
  },

  /**
   * Update profile.
   */
  async updateProfile(id: string, data: { fullName?: string; phone?: string | null; address?: string | null }) {
    return prisma.profile.update({
      where: { id },
      data,
    })
  },
}

// =====================================================
// ADMIN STATS QUERIES
// =====================================================

export const adminStatsService = {
  /**
   * Get dashboard stats.
   */
  async getDashboardStats() {
    try {
      const [productsCount, categoriesCount, ordersCount, customersCount] = await Promise.all([
        prisma.product.count(),
        prisma.category.count(),
        prisma.order.count(),
        prisma.profile.count({ where: { role: 'user' } }),
      ])

      return {
        productsCount,
        categoriesCount,
        ordersCount,
        customersCount,
      }
    } catch (error) {
      console.warn('[admin] Unable to load dashboard stats from database.')
      if (process.env.NODE_ENV === 'development') {
        console.error(error)
      }

      return {
        productsCount: 0,
        categoriesCount: 0,
        ordersCount: 0,
        customersCount: 0,
      }
    }
  },

  /**
   * Get recent orders for admin dashboard.
   */
  async getRecentOrders(limit = 5) {
    try {
      return await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch (error) {
      console.warn('[admin] Unable to load recent orders from database.')
      if (process.env.NODE_ENV === 'development') {
        console.error(error)
      }
      return []
    }
  },
}
