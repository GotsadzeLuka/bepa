'use server'

import { revalidatePath } from 'next/cache'
import { CheckoutError, placeCheckout } from '@/lib/checkout'
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
  fullName?: string | null
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
  guestCheckoutToken?: string
}): Promise<{ id: string } | { error: string }> {
  // Server actions are public entry points: runtime payloads need validation even
  // when TypeScript callers promise a well-formed cart.
  const hasInvalidCartIds = Array.isArray(data?.items) && data.items.some((item) => {
    if (!item || typeof item !== 'object') return true
    const productIdOk = uuidSchema.safeParse(item.productId).success
    const variantIdOk = item.variantId ? uuidSchema.safeParse(item.variantId).success : true
    return !productIdOk || !variantIdOk
  })

  if (hasInvalidCartIds) {
    return { error: 'Your cart contains stale items. Remove them and add current catalog products again.' }
  }

  const validated = createOrderSchema.safeParse(data)
  if (!validated.success) return { error: 'Check your contact information and cart, then try again.' }

  const authUser = await getAuthUser()
  let order
  try {
    order = await placeCheckout(prisma, validated.data, authUser?.id ?? null)
  } catch (error) {
    if (error instanceof CheckoutError) {
      if (error.cause) console.error('[checkout] Could not complete the order transaction')
      return { error: error.message }
    }
    throw error
  }

  if (order.products.length > 0) {
    for (const product of order.products) revalidateProductCache(product)
    revalidateAdminCache()
    revalidatePath('/admin')
    revalidatePath('/admin/orders')
    revalidatePath('/account/orders')
  }
  return { id: order.id }
}
