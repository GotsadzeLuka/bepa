'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/db'
import { getAuthUser, requireAuth } from '@/lib/auth'
import { createReviewSchema, shippingAddressSchema } from '@/lib/validations'

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

  // Use upsert to create profile if it doesn't exist (handles new signups)
  const profile = await prisma.profile.upsert({
    where: { id: authUser.id },
    update: {
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
    },
    create: {
      id: authUser.id,
      email: authUser.email,
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
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
    where: { profileId: authUser.id },
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

  // Check if already in wishlist
  const existing = await prisma.wishlist.findFirst({
    where: {
      profileId: authUser.id,
      productId,
    },
  })

  if (existing) {
    return existing
  }

  const item = await prisma.wishlist.create({
    data: {
      profileId: authUser.id,
      productId,
    },
  })

  revalidatePath('/wishlist')
  return item
}

export async function removeFromWishlist(productId: string) {
  const authUser = await requireAuth()

  await prisma.wishlist.deleteMany({
    where: {
      profileId: authUser.id,
      productId,
    },
  })

  revalidatePath('/wishlist')
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const authUser = await getAuthUser()
  if (!authUser) {
    return false
  }

  const item = await prisma.wishlist.findFirst({
    where: {
      profileId: authUser.id,
      productId,
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
      profileId: authUser.id,
      productId: validated.productId,
    },
  })

  if (existing) {
    throw new Error('You have already reviewed this product')
  }

  const review = await prisma.review.create({
    data: {
      profileId: authUser.id,
      productId: validated.productId,
      rating: validated.rating,
      comment: validated.comment,
      isApproved: false, // Requires admin approval
    },
  })

  return review
}

// =====================================================
// ORDER ACTIONS (User)
// =====================================================

export async function getUserOrders() {
  const authUser = await requireAuth()

  return prisma.order.findMany({
    where: { profileId: authUser.id },
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
    quantity: number
    price: number
  }>
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    postalCode: string
    phone: string
  }
  paymentMethod: string
}) {
  const authUser = await requireAuth()

  // Validate shipping address
  shippingAddressSchema.parse(data.shippingAddress)

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = 0 // Free shipping or calculate based on rules
  const total = subtotal + shippingCost

  // Create order with items in a transaction
  const order = await prisma.$transaction(async (tx: typeof prisma) => {
    const order = await tx.order.create({
      data: {
        profileId: authUser.id,
        status: 'pending',
        subtotal,
        shippingCost,
        total,
        shippingAddress: data.shippingAddress,
        paymentMethod: data.paymentMethod,
      },
    })

    // Create order items
    await tx.orderItem.createMany({
      data: data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    })

    // Update product stock
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    return order
  })

  revalidatePath('/account/orders')
  return order
}
