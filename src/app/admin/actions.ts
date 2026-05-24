'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { 
  createProductSchema, 
  updateProductSchema, 
  createCategorySchema,
  updateCategorySchema,
  createNewsSchema,
  updateNewsSchema,
  updateOrderStatusSchema,
  uuidSchema,
} from '@/lib/validations'

// =====================================================
// PRODUCT ACTIONS
// =====================================================

export async function getProductsAdmin() {
  await requireAdmin()
  
  return prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
    },
  })
}

export async function createProduct(data: {
  categoryId: string
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn?: string
  descriptionKa?: string
  price: number
  salePrice?: number | null
  sku?: string
  stock: number
  isActive: boolean
  isFeatured: boolean
}) {
  await requireAdmin()
  
  // Validate input
  const validated = createProductSchema.parse(data)
  
  const product = await prisma.product.create({
    data: validated,
  })
  
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
  
  return product
}

export async function updateProduct(
  id: string,
  data: {
    categoryId?: string
    nameEn?: string
    nameKa?: string
    slug?: string
    descriptionEn?: string
    descriptionKa?: string
    price?: number
    salePrice?: number | null
    sku?: string
    stock?: number
    isActive?: boolean
    isFeatured?: boolean
  }
) {
  await requireAdmin()
  const productId = uuidSchema.parse(id)
  
  // Validate input
  const validated = updateProductSchema.parse(data)
  
  const product = await prisma.product.update({
    where: { id: productId },
    data: validated,
  })
  
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath(`/product/${product.slug}`)
  revalidatePath('/')
  
  return product
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  const productId = uuidSchema.parse(id)
  
  // Delete related records first (cascade would handle this normally)
  await prisma.productImage.deleteMany({ where: { productId } })
  await prisma.productVariant.deleteMany({ where: { productId } })
  
  await prisma.product.delete({ where: { id: productId } })
  
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath('/')
}

// Product Images
export async function createProductImage(data: {
  productId: string
  url: string
  altText?: string
  sortOrder?: number
}) {
  await requireAdmin()
  const productId = uuidSchema.parse(data.productId)
  
  const image = await prisma.productImage.create({
    data: {
      ...data,
      productId,
    },
  })
  
  revalidatePath('/admin/products')
  
  return image
}

export async function deleteProductImage(id: string) {
  await requireAdmin()
  const imageId = uuidSchema.parse(id)
  
  await prisma.productImage.delete({ where: { id: imageId } })
  
  revalidatePath('/admin/products')
}

// Product Variants
export async function syncProductVariants(
  productId: string,
  variants: Array<{
    nameEn: string
    nameKa: string
    sku?: string | null
    price: number
    stock: number
    isActive?: boolean
  }>
) {
  await requireAdmin()
  const validatedProductId = uuidSchema.parse(productId)
  
  // Delete all existing variants and create new ones
  await prisma.productVariant.deleteMany({ where: { productId: validatedProductId } })
  
  if (variants.length > 0) {
    await prisma.productVariant.createMany({
      data: variants.map(v => ({
        productId: validatedProductId,
        nameEn: v.nameEn,
        nameKa: v.nameKa,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        isActive: v.isActive ?? true,
      })),
    })
  }
  
  revalidatePath('/admin/products')
}

// =====================================================
// CATEGORY ACTIONS
// =====================================================

export async function getCategoriesAdmin() {
  await requireAdmin()
  
  return prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  })
}

export async function createCategory(data: {
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn?: string
  descriptionKa?: string
  imageUrl?: string
  sortOrder?: number
  isActive: boolean
}) {
  await requireAdmin()
  
  // Validate input
  const validated = createCategorySchema.parse(data)
  
  const category = await prisma.category.create({
    data: validated,
  })
  
  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')
  
  return category
}

export async function updateCategory(
  id: string,
  data: {
    nameEn?: string
    nameKa?: string
    slug?: string
    descriptionEn?: string
    descriptionKa?: string
    imageUrl?: string
    sortOrder?: number
    isActive?: boolean
  }
) {
  await requireAdmin()
  const categoryId = uuidSchema.parse(id)
  const validated = updateCategorySchema.parse(data)
  
  const category = await prisma.category.update({
    where: { id: categoryId },
    data: validated,
  })
  
  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')
  
  return category
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const categoryId = uuidSchema.parse(id)
  
  await prisma.category.delete({ where: { id: categoryId } })
  
  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')
}

// =====================================================
// NEWS ACTIONS
// =====================================================

export async function getNewsAdmin() {
  await requireAdmin()
  
  return prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function createNews(data: {
  title: string
  slug: string
  excerpt?: string
  content: string
  imageUrl?: string
  isPublished: boolean
}) {
  await requireAdmin()
  
  // Validate input
  const validated = createNewsSchema.parse(data)
  
  const news = await prisma.news.create({
    data: validated,
  })
  
  revalidatePath('/admin/news')
  revalidatePath('/news')
  
  return news
}

export async function updateNews(
  id: string,
  data: {
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    imageUrl?: string
    isPublished?: boolean
  }
) {
  await requireAdmin()
  const newsId = uuidSchema.parse(id)
  const validated = updateNewsSchema.parse(data)
  
  const news = await prisma.news.update({
    where: { id: newsId },
    data: validated,
  })
  
  revalidatePath('/admin/news')
  revalidatePath('/news')
  revalidatePath(`/news/${news.slug}`)
  
  return news
}

export async function deleteNews(id: string) {
  await requireAdmin()
  const newsId = uuidSchema.parse(id)
  
  await prisma.news.delete({ where: { id: newsId } })
  
  revalidatePath('/admin/news')
  revalidatePath('/news')
}

// =====================================================
// ORDER ACTIONS
// =====================================================

export async function getOrdersAdmin() {
  await requireAdmin()
  
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  })
}

export async function updateOrderStatus(id: string, status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled') {
  await requireAdmin()
  const orderId = uuidSchema.parse(id)
  const validated = updateOrderStatusSchema.parse({ status })
  
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: validated.status },
  })
  
  revalidatePath('/admin/orders')
  
  return order
}

// =====================================================
// REVIEW ACTIONS
// =====================================================

export async function getReviewsAdmin() {
  await requireAdmin()
  
  return prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: true,
      user: true,
    },
  })
}

export async function approveReview(id: string) {
  await requireAdmin()
  const reviewId = uuidSchema.parse(id)
  
  await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: true },
  })
  
  revalidatePath('/admin/reviews')
}

export async function deleteReview(id: string) {
  await requireAdmin()
  const reviewId = uuidSchema.parse(id)
  
  await prisma.review.delete({ where: { id: reviewId } })
  
  revalidatePath('/admin/reviews')
}
