'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { 
  createProductSchema, 
  updateProductSchema, 
  createCategorySchema,
  createNewsSchema
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
  
  // Validate input
  const validated = updateProductSchema.parse(data)
  
  const product = await prisma.product.update({
    where: { id },
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
  
  // Delete related records first (cascade would handle this normally)
  await prisma.productImage.deleteMany({ where: { productId: id } })
  await prisma.productVariant.deleteMany({ where: { productId: id } })
  
  await prisma.product.delete({ where: { id } })
  
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
  
  const image = await prisma.productImage.create({
    data,
  })
  
  revalidatePath('/admin/products')
  
  return image
}

export async function deleteProductImage(id: string) {
  await requireAdmin()
  
  await prisma.productImage.delete({ where: { id } })
  
  revalidatePath('/admin/products')
}

// Product Variants
export async function syncProductVariants(
  productId: string,
  variants: Array<{
    nameEn: string
    nameKa: string
    value: string
    priceAdjustment?: number
    stockAdjustment?: number
  }>
) {
  await requireAdmin()
  
  // Delete all existing variants and create new ones
  await prisma.productVariant.deleteMany({ where: { productId } })
  
  if (variants.length > 0) {
    await prisma.productVariant.createMany({
      data: variants.map(v => ({
        ...v,
        productId,
        priceAdjustment: v.priceAdjustment ?? 0,
        stockAdjustment: v.stockAdjustment ?? 0,
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
  
  const category = await prisma.category.update({
    where: { id },
    data,
  })
  
  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')
  
  return category
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  
  await prisma.category.delete({ where: { id } })
  
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
  
  const news = await prisma.news.update({
    where: { id },
    data,
  })
  
  revalidatePath('/admin/news')
  revalidatePath('/news')
  revalidatePath(`/news/${news.slug}`)
  
  return news
}

export async function deleteNews(id: string) {
  await requireAdmin()
  
  await prisma.news.delete({ where: { id } })
  
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
      profile: true,
    },
  })
}

export async function updateOrderStatus(id: string, status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled') {
  await requireAdmin()
  
  const order = await prisma.order.update({
    where: { id },
    data: { status },
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
      profile: true,
    },
  })
}

export async function approveReview(id: string) {
  await requireAdmin()
  
  await prisma.review.update({
    where: { id },
    data: { isApproved: true },
  })
  
  revalidatePath('/admin/reviews')
}

export async function deleteReview(id: string) {
  await requireAdmin()
  
  await prisma.review.delete({ where: { id } })
  
  revalidatePath('/admin/reviews')
}
