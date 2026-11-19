'use server'

import { revalidatePath } from 'next/cache'
import { calculateOrderTotal } from '@/lib/money'
import { isSameCheckoutRequest } from '@/lib/checkout-idempotency'
import { reserveInventory } from '@/lib/inventory'
import prisma from '@/lib/db'
import { getAuthUser, requireAuth } from '@/lib/auth'
import { revalidateAdminCache, revalidateProductCache } from '@/lib/cache'
import {
  createOrderSchema,
  createReviewSchema,
  updateProfileSchema,
  uuidSchema,
  wishlistItemSchema,
} from '@/lib/validations'

// =====================================================
// PROFILE ACTIONS
// =====================================================

/**
 * Update user profile after registration.
 * Can be called by authenticated user for their own profile.
 * Creates the profile if it doesn't exist (for new signups).
 */
export async function updateProfile(data: {
  fullName?: string
  phone?: string | null
  address?: string | null
}) {
  const authUser = await getAuthUser()
  if (!authUser) {
    throw new Error('Not authenticated')
  }

  const validated = updateProfileSchema.parse(data)

  // Use upsert to create profile if it doesn't exist (handles new signups)
  const profile = await prisma.profile.upsert({
    where: { id: authUser.id },
    update: {
      fullName: validated.fullName,
      phone: validated.phone,
      address: validated.address,
    },
    create: {
      id: authUser.id,
      email: authUser.email,
      fullName: validated.fullName,
      phone: validated.phone,
      address: validated.address,
      role: 'user',
    },
  })

  revalidatePath('/account')
  return profile
}

// =====================================================
// WISHLIST ACTIONS
// =====================================================

export async function getWishlist() {
  const authUser = await getAuthUser()
  if (!authUser) {
    return []
  }

  return prisma.wishlist.findMany({
    where: { userId: authUser.id },
    include: {
      product: {
        include: {
          images: { take: 1 },
        },
      },
    },
  })
}

export async function addToWishlist(productId: string) {
  const authUser = await requireAuth()
  const validated = wishlistItemSchema.parse({ productId })

  const item = await prisma.wishlist.upsert({
    where: {
      userId_productId: {
        userId: authUser.id,
        productId: validated.productId,
      },
    },
    create: {
      userId: authUser.id,
      productId: validated.productId,
    },
    update: {},
  })

  revalidatePath('/wishlist')
  return item
}

export async function removeFromWishlist(productId: string) {
  const authUser = await requireAuth()
  const validated = wishlistItemSchema.parse({ productId })

  await prisma.wishlist.deleteMany({
    where: {
      userId: authUser.id,
      productId: validated.productId,
    },
  })

  revalidatePath('/wishlist')
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const authUser = await getAuthUser()
  if (!authUser) {
    return false
  }
  const validated = wishlistItemSchema.parse({ productId })

  const item = await prisma.wishlist.findFirst({
    where: {
      userId: authUser.id,
      productId: validated.productId,
    },
  })

  return !!item
}

// =====================================================
// REVIEW ACTIONS (User)
// =====================================================

export async function createReview(data: {
  productId: string
  rating: number
  comment?: string
}) {
  const authUser = await requireAuth()

  // Validate input
  const validated = createReviewSchema.parse(data)

  // Check if user already reviewed this product
  const existing = await prisma.review.findFirst({
    where: {
      userId: authUser.id,
      productId: validated.productId,
    },
  })

  if (existing) {
    throw new Error('You have already reviewed this product')
  }

  let review
  try {
    review = await prisma.review.create({
      data: {
        userId: authUser.id,
        productId: validated.productId,
        rating: validated.rating,
        comment: validated.comment,
        isApproved: false, // Requires admin approval
      },
    })
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2002') throw new Error('You have already reviewed this product')
    throw error
  }

  revalidatePath('/admin/reviews')
  return review
}

// =====================================================
// ORDER ACTIONS (User)
// =====================================================

export async function getUserOrders() {
  const authUser = await requireAuth()

  return prisma.order.findMany({
    where: { userId: authUser.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: { take: 1 },
            },
          },
        },
      },
    },
  })
}

export async function createOrder(data: {
  items: Array<{
    productId: string
    variantId?: string | null
    quantity: number
  }>
  shippingAddress: {
    firstName: string
    lastName: string
    email: string
    address: string
    city: string
    postalCode?: string
    phone: string
    locationUrl?: string
  }
  notes?: string
  checkoutRequestId: string
}) {
  // Server actions are public entry points: runtime payloads need validation even
  // when TypeScript callers promise a well-formed cart.
  const hasInvalidCartIds = Array.isArray(data?.items) && data.items.some((item) => {
    if (!item || typeof item !== 'object') return true
    const productIdOk = uuidSchema.safeParse(item.productId).success
    const variantIdOk = item.variantId ? uuidSchema.safeParse(item.variantId).success : true
    return !productIdOk || !variantIdOk
  })

  if (hasInvalidCartIds) {
    throw new Error('Your cart contains stale items. Remove them and add current catalog products again.')
  }

  const validated = createOrderSchema.parse(data)
  const authUser = await getAuthUser()

  const existingOrder = await prisma.order.findUnique({
    where: { checkoutRequestId: validated.checkoutRequestId },
    select: { id: true, userId: true, shippingAddress: true, notes: true, items: { select: { productId: true, variantId: true, quantity: true } } },
  })
  if (existingOrder) {
    if (!isSameCheckoutRequest(existingOrder, validated, authUser?.id ?? null)) throw new Error('Checkout request does not match existing order')
    return { id: existingOrder.id }
  }

  let order: { id: string }
  try {
    order = await prisma.$transaction(async (tx) => {
      const productIds = [...new Set(validated.items.map((item) => item.productId))]
      const variantIds = [
        ...new Set(
          validated.items
            .map((item) => item.variantId)
            .filter((variantId): variantId is string => Boolean(variantId))
        ),
      ]
  
      const [products, variants] = await Promise.all([
        tx.product.findMany({
          where: {
            id: { in: productIds },
            isActive: true,
          },
          select: {
            id: true,
            slug: true,
            price: true,
            salePrice: true,
            stock: true,
          },
        }),
        tx.productVariant.findMany({
          where: {
            id: { in: variantIds },
            isActive: true,
          },
          select: {
            id: true,
            productId: true,
            price: true,
            stock: true,
          },
        }),
      ])
  
      const productsById = new Map(products.map((product) => [product.id, product]))
      const variantsById = new Map(variants.map((variant) => [variant.id, variant]))
      const pricedItems = validated.items.map((item) => {
        const product = productsById.get(item.productId)
        const variant = item.variantId ? variantsById.get(item.variantId) : null
  
        if (!product || (item.variantId && !variant)) {
          throw new Error('One or more products are unavailable.')
        }
  
        if (variant && variant.productId !== item.productId) {
          throw new Error('Invalid product variant selected.')
        }
  
        const stock = variant?.stock ?? product.stock
        if (stock < item.quantity) {
          throw new Error('One or more products do not have enough stock.')
        }
  
        return {
          ...item,
          price: variant?.price ?? product.salePrice ?? product.price,
        }
      })
  
      const total = calculateOrderTotal(pricedItems)
  
      const order = await tx.order.create({
        data: {
          userId: authUser?.id ?? null,
          checkoutRequestId: validated.checkoutRequestId,
          status: 'pending',
          total,
          shippingAddress: validated.shippingAddress,
          notes: validated.notes,
        },
      })
  
      await tx.orderItem.createMany({
        data: pricedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      })
  
      for (const item of pricedItems) {
        await reserveInventory(tx, item)
      }

      return { id: order.id }
    })
  } catch (error) {
    if ((error as { code?: string })?.code !== 'P2002') throw error
    // Another request with this idempotency key committed first.
    const prior = await prisma.order.findUnique({
      where: { checkoutRequestId: validated.checkoutRequestId },
      select: { id: true, userId: true, shippingAddress: true, notes: true, items: { select: { productId: true, variantId: true, quantity: true } } },
    })
    if (!prior) throw error
    if (!isSameCheckoutRequest(prior, validated, authUser?.id ?? null)) throw new Error('Checkout request does not match existing order')
    return { id: prior.id }
  }

  const orderedProducts = await prisma.product.findMany({
    where: { id: { in: [...new Set(validated.items.map((item) => item.productId))] } },
    select: { id: true, slug: true },
  })
  for (const product of orderedProducts) {
    revalidateProductCache(product)
  }

  revalidateAdminCache()
  revalidatePath('/admin')
  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { id: order.id }
}
