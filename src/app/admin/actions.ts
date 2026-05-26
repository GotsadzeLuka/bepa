'use server'

import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'
import type { Category, News, Order, OrderItem, Product, ProductImage, ProductVariant, Profile, Review } from '@prisma/client'
import prisma from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { supabaseStorageBucket } from '@/lib/supabase/config'
import {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createNewsSchema,
  updateNewsSchema,
  updateOrderStatusSchema,
  uuidSchema,
  productImageInputSchema,
  productVariantInputSchema,
} from '@/lib/validations'

const MAX_ADMIN_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ADMIN_IMAGE_MIME_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
])
const ADMIN_STORAGE_FOLDERS = ['products', 'categories', 'news'] as const

type AdminStorageFolder = typeof ADMIN_STORAGE_FOLDERS[number]

function serializeCategory(category: Category) {
  return {
    id: category.id,
    name_en: category.nameEn,
    name_ka: category.nameKa,
    slug: category.slug,
    image_url: category.imageUrl,
    description_en: category.descriptionEn,
    description_ka: category.descriptionKa,
    is_active: category.isActive,
    sort_order: category.sortOrder,
    created_at: category.createdAt.toISOString(),
    updated_at: category.updatedAt.toISOString(),
  }
}

function serializeProductImage(image: ProductImage) {
  return {
    id: image.id,
    product_id: image.productId,
    url: image.url,
    alt_text: image.altText,
    is_primary: image.isPrimary,
    sort_order: image.sortOrder,
    created_at: image.createdAt.toISOString(),
  }
}

function serializeProductVariant(variant: ProductVariant) {
  return {
    id: variant.id,
    product_id: variant.productId,
    name_en: variant.nameEn,
    name_ka: variant.nameKa,
    sku: variant.sku,
    price: Number(variant.price),
    stock: variant.stock,
    is_active: variant.isActive,
    created_at: variant.createdAt.toISOString(),
    updated_at: variant.updatedAt.toISOString(),
  }
}

function serializeProduct(
  product: Product & {
    category: Category | null
    images: ProductImage[]
    variants: ProductVariant[]
  }
) {
  return {
    id: product.id,
    category_id: product.categoryId,
    name_en: product.nameEn,
    name_ka: product.nameKa,
    slug: product.slug,
    description_en: product.descriptionEn,
    description_ka: product.descriptionKa,
    price: Number(product.price),
    sale_price: product.salePrice === null ? null : Number(product.salePrice),
    sku: product.sku,
    stock: product.stock,
    is_active: product.isActive,
    is_featured: product.isFeatured,
    created_at: product.createdAt.toISOString(),
    updated_at: product.updatedAt.toISOString(),
    category: product.category ? serializeCategory(product.category) : null,
    images: product.images.map(serializeProductImage),
    variants: product.variants.map(serializeProductVariant),
  }
}

function serializeNews(news: News) {
  return {
    id: news.id,
    title: news.title,
    slug: news.slug,
    excerpt: news.excerpt,
    content: news.content,
    image_url: news.imageUrl,
    is_published: news.isPublished,
    created_at: news.createdAt.toISOString(),
    updated_at: news.updatedAt.toISOString(),
  }
}

function serializeProfile(profile: Profile) {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    phone: profile.phone,
    address: profile.address,
    role: profile.role,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  }
}

function serializeOrderItem(
  item: OrderItem & {
    product: Product | null
    variant?: ProductVariant | null
  }
) {
  return {
    id: item.id,
    order_id: item.orderId,
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
    price: Number(item.price),
    created_at: item.createdAt.toISOString(),
    product: item.product
      ? {
          id: item.product.id,
          name_en: item.product.nameEn,
          name_ka: item.product.nameKa,
          slug: item.product.slug,
        }
      : null,
    variant: item.variant
      ? {
          id: item.variant.id,
          name_en: item.variant.nameEn,
          name_ka: item.variant.nameKa,
          sku: item.variant.sku,
        }
      : null,
  }
}

function serializeOrder(
  order: Order & {
    items: Array<OrderItem & { product: Product | null; variant?: ProductVariant | null }>
    user: Profile | null
  }
) {
  return {
    id: order.id,
    user_id: order.userId,
    status: order.status,
    total: Number(order.total),
    shipping_address: order.shippingAddress,
    notes: order.notes,
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
    user: order.user ? serializeProfile(order.user) : null,
    items: order.items.map(serializeOrderItem),
  }
}

function serializeReview(
  review: Review & {
    product: Product
    user: Profile
  }
) {
  return {
    id: review.id,
    product_id: review.productId,
    user_id: review.userId,
    rating: review.rating,
    comment: review.comment,
    is_approved: review.isApproved,
    created_at: review.createdAt.toISOString(),
    updated_at: review.updatedAt.toISOString(),
    product: {
      id: review.product.id,
      name_en: review.product.nameEn,
      name_ka: review.product.nameKa,
      slug: review.product.slug,
    },
    user: {
      id: review.user.id,
      email: review.user.email,
      full_name: review.user.fullName,
    },
  }
}

function assertAdminStorageFolder(folder: string): asserts folder is AdminStorageFolder {
  if (!ADMIN_STORAGE_FOLDERS.includes(folder as AdminStorageFolder)) {
    throw new Error('Invalid storage folder')
  }
}

function getValidatedImageExtension(file: File) {
  const extension = ADMIN_IMAGE_MIME_TYPES.get(file.type)
  if (!extension) {
    throw new Error('Unsupported image type. Use JPEG, PNG, WebP, or AVIF.')
  }

  if (file.size <= 0 || file.size > MAX_ADMIN_IMAGE_SIZE_BYTES) {
    throw new Error('Image must be smaller than 5 MB.')
  }

  return extension
}

async function uploadImageToStorage(folder: AdminStorageFolder, file: File) {
  const extension = getValidatedImageExtension(file)
  const storagePath = `admin/${folder}/${randomUUID()}.${extension}`
  const bytes = Buffer.from(await file.arrayBuffer())
  const supabase = await createAdminClient()

  const { error } = await supabase.storage
    .from(supabaseStorageBucket)
    .upload(storagePath, bytes, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from(supabaseStorageBucket).getPublicUrl(storagePath)

  return {
    path: storagePath,
    publicUrl: data.publicUrl,
  }
}

function getStoragePathFromPublicUrl(publicUrl: string | null | undefined) {
  if (!publicUrl) return null

  try {
    const url = new URL(publicUrl)
    const marker = `/storage/v1/object/public/${supabaseStorageBucket}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

async function deleteStorageObjectByPublicUrl(publicUrl: string | null | undefined) {
  const storagePath = getStoragePathFromPublicUrl(publicUrl)
  if (!storagePath) return

  try {
    const supabase = await createAdminClient()
    await supabase.storage.from(supabaseStorageBucket).remove([storagePath])
  } catch (error) {
    console.warn('[admin] Unable to delete storage object for removed image.')
    if (process.env.NODE_ENV === 'development') {
      console.error(error)
    }
  }
}

function revalidateStorefrontProduct(product: Pick<Product, 'slug'>) {
  revalidatePath('/admin/products')
  revalidatePath('/products')
  revalidatePath(`/product/${product.slug}`)
  revalidatePath('/')
}

// =====================================================
// STORAGE ACTIONS
// =====================================================

export async function uploadAdminImage(folder: AdminStorageFolder, file: File) {
  await requireAdmin()
  assertAdminStorageFolder(folder)
  return uploadImageToStorage(folder, file)
}

// =====================================================
// PRODUCT ACTIONS
// =====================================================

export async function getProductsAdmin() {
  await requireAdmin()

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { createdAt: 'asc' } },
    },
  })

  return products.map(serializeProduct)
}

export async function createProduct(data: {
  categoryId: string | null
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn?: string | null
  descriptionKa?: string | null
  price: number
  salePrice?: number | null
  sku?: string | null
  stock: number
  isActive: boolean
  isFeatured: boolean
}) {
  await requireAdmin()
  const validated = createProductSchema.parse(data)

  const product = await prisma.product.create({
    data: {
      ...validated,
      sku: validated.sku || null,
      descriptionEn: validated.descriptionEn || null,
      descriptionKa: validated.descriptionKa || null,
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { createdAt: 'asc' } },
    },
  })

  revalidateStorefrontProduct(product)
  return serializeProduct(product)
}

export async function updateProduct(
  id: string,
  data: {
    categoryId?: string | null
    nameEn?: string
    nameKa?: string
    slug?: string
    descriptionEn?: string | null
    descriptionKa?: string | null
    price?: number
    salePrice?: number | null
    sku?: string | null
    stock?: number
    isActive?: boolean
    isFeatured?: boolean
  }
) {
  await requireAdmin()
  const productId = uuidSchema.parse(id)
  const validated = updateProductSchema.parse(data)
  const existing = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } })

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      ...validated,
      sku: validated.sku === undefined ? undefined : validated.sku || null,
      descriptionEn:
        validated.descriptionEn === undefined ? undefined : validated.descriptionEn || null,
      descriptionKa:
        validated.descriptionKa === undefined ? undefined : validated.descriptionKa || null,
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { orderBy: { createdAt: 'asc' } },
    },
  })

  revalidateStorefrontProduct(product)
  if (existing?.slug && existing.slug !== product.slug) {
    revalidatePath(`/product/${existing.slug}`)
  }

  return serializeProduct(product)
}

export async function deleteProduct(id: string) {
  await requireAdmin()
  const productId = uuidSchema.parse(id)
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  })

  if (!product) return

  await prisma.product.delete({ where: { id: productId } })
  await Promise.all(product.images.map((image) => deleteStorageObjectByPublicUrl(image.url)))

  revalidateStorefrontProduct(product)
}

export async function createProductImage(data: {
  productId: string
  url: string
  altText?: string | null
  sortOrder?: number
}) {
  await requireAdmin()
  const validated = productImageInputSchema.parse(data)

  const image = await prisma.productImage.create({
    data: {
      productId: validated.productId,
      url: validated.url,
      altText: validated.altText || null,
      sortOrder: validated.sortOrder ?? 0,
    },
  })
  const product = await prisma.product.findUnique({ where: { id: validated.productId }, select: { slug: true } })
  if (product) revalidateStorefrontProduct(product)

  return serializeProductImage(image)
}

export async function uploadProductImages(productId: string, files: File[]) {
  await requireAdmin()
  const validatedProductId = uuidSchema.parse(productId)
  const product = await prisma.product.findUnique({
    where: { id: validatedProductId },
    include: { images: { orderBy: { sortOrder: 'desc' }, take: 1 } },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  const createdImages: ProductImage[] = []
  let sortOrder = (product.images[0]?.sortOrder ?? -1) + 1

  for (const file of files) {
    const uploaded = await uploadImageToStorage('products', file)
    const image = await prisma.productImage.create({
      data: {
        productId: validatedProductId,
        url: uploaded.publicUrl,
        altText: product.nameEn,
        sortOrder,
        isPrimary: sortOrder === 0,
      },
    })
    createdImages.push(image)
    sortOrder += 1
  }

  revalidateStorefrontProduct(product)
  return createdImages.map(serializeProductImage)
}

export async function deleteProductImage(id: string) {
  await requireAdmin()
  const imageId = uuidSchema.parse(id)
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    include: { product: { select: { slug: true } } },
  })

  if (!image) return

  await prisma.productImage.delete({ where: { id: imageId } })
  await deleteStorageObjectByPublicUrl(image.url)

  revalidateStorefrontProduct(image.product)
}

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
  const validatedVariants = variants.map((variant) => productVariantInputSchema.parse(variant))
  const product = await prisma.product.findUnique({ where: { id: validatedProductId }, select: { slug: true } })

  if (!product) {
    throw new Error('Product not found')
  }

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: validatedProductId } })

    if (validatedVariants.length > 0) {
      await tx.productVariant.createMany({
        data: validatedVariants.map((variant) => ({
          productId: validatedProductId,
          nameEn: variant.nameEn,
          nameKa: variant.nameKa,
          sku: variant.sku || null,
          price: variant.price,
          stock: variant.stock,
          isActive: variant.isActive,
        })),
      })
    }
  })

  revalidateStorefrontProduct(product)
}

// =====================================================
// CATEGORY ACTIONS
// =====================================================

export async function getCategoriesAdmin() {
  await requireAdmin()

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
  })

  return categories.map(serializeCategory)
}

export async function createCategory(data: {
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn?: string
  descriptionKa?: string
  imageUrl?: string | null
  sortOrder?: number
  isActive: boolean
}) {
  await requireAdmin()
  const validated = createCategorySchema.parse(data)

  const category = await prisma.category.create({
    data: {
      ...validated,
      descriptionEn: validated.descriptionEn || null,
      descriptionKa: validated.descriptionKa || null,
    },
  })

  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')

  return serializeCategory(category)
}

export async function updateCategory(
  id: string,
  data: {
    nameEn?: string
    nameKa?: string
    slug?: string
    descriptionEn?: string | null
    descriptionKa?: string | null
    imageUrl?: string | null
    sortOrder?: number
    isActive?: boolean
  }
) {
  await requireAdmin()
  const categoryId = uuidSchema.parse(id)
  const validated = updateCategorySchema.parse(data)
  const existing = await prisma.category.findUnique({ where: { id: categoryId } })

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...validated,
      descriptionEn:
        validated.descriptionEn === undefined ? undefined : validated.descriptionEn || null,
      descriptionKa:
        validated.descriptionKa === undefined ? undefined : validated.descriptionKa || null,
    },
  })

  if (existing?.imageUrl && validated.imageUrl !== undefined && existing.imageUrl !== validated.imageUrl) {
    await deleteStorageObjectByPublicUrl(existing.imageUrl)
  }

  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')

  return serializeCategory(category)
}

export async function deleteCategory(id: string) {
  await requireAdmin()
  const categoryId = uuidSchema.parse(id)
  const category = await prisma.category.findUnique({ where: { id: categoryId } })

  if (!category) return

  await prisma.category.delete({ where: { id: categoryId } })
  await deleteStorageObjectByPublicUrl(category.imageUrl)

  revalidatePath('/admin/categories')
  revalidatePath('/products')
  revalidatePath('/')
}

// =====================================================
// NEWS ACTIONS
// =====================================================

export async function getNewsAdmin() {
  await requireAdmin()

  const news = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return news.map(serializeNews)
}

export async function createNews(data: {
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  imageUrl?: string | null
  isPublished: boolean
}) {
  await requireAdmin()
  const validated = createNewsSchema.parse(data)

  const news = await prisma.news.create({
    data: {
      ...validated,
      excerpt: validated.excerpt || null,
      content: validated.content || null,
    },
  })

  revalidatePath('/admin/news')
  revalidatePath('/news')

  return serializeNews(news)
}

export async function updateNews(
  id: string,
  data: {
    title?: string
    slug?: string
    excerpt?: string | null
    content?: string | null
    imageUrl?: string | null
    isPublished?: boolean
  }
) {
  await requireAdmin()
  const newsId = uuidSchema.parse(id)
  const validated = updateNewsSchema.parse(data)
  const existing = await prisma.news.findUnique({ where: { id: newsId } })

  const news = await prisma.news.update({
    where: { id: newsId },
    data: {
      ...validated,
      excerpt: validated.excerpt === undefined ? undefined : validated.excerpt || null,
      content: validated.content === undefined ? undefined : validated.content || null,
    },
  })

  if (existing?.imageUrl && validated.imageUrl !== undefined && existing.imageUrl !== validated.imageUrl) {
    await deleteStorageObjectByPublicUrl(existing.imageUrl)
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
  revalidatePath(`/news/${news.slug}`)
  if (existing?.slug && existing.slug !== news.slug) {
    revalidatePath(`/news/${existing.slug}`)
  }

  return serializeNews(news)
}

export async function deleteNews(id: string) {
  await requireAdmin()
  const newsId = uuidSchema.parse(id)
  const news = await prisma.news.findUnique({ where: { id: newsId } })

  if (!news) return

  await prisma.news.delete({ where: { id: newsId } })
  await deleteStorageObjectByPublicUrl(news.imageUrl)

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

// =====================================================
// ORDER ACTIONS
// =====================================================

export async function getOrdersAdmin() {
  await requireAdmin()

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: true,
    },
  })

  return orders.map(serializeOrder)
}

export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
) {
  await requireAdmin()
  const orderId = uuidSchema.parse(id)
  const validated = updateOrderStatusSchema.parse({ status })

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: validated.status },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: true,
    },
  })

  revalidatePath('/admin/orders')

  return serializeOrder(order)
}

// =====================================================
// REVIEW ACTIONS
// =====================================================

export async function getReviewsAdmin() {
  await requireAdmin()

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: true,
      user: true,
    },
  })

  return reviews.map(serializeReview)
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

// =====================================================
// CUSTOMER ACTIONS
// =====================================================

export async function getCustomersAdmin() {
  await requireAdmin()

  const customers = await prisma.profile.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return customers.map(serializeProfile)
}
