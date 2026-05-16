/**
 * Input Validation Schemas
 * 
 * All user input MUST be validated through these Zod schemas before
 * being used in database operations. This prevents injection attacks
 * and ensures data integrity.
 * 
 * SECURITY: Never pass user input directly to Prisma without validation!
 */

import { z } from 'zod'

// =====================================================
// COMMON SCHEMAS
// =====================================================

export const uuidSchema = z.string().uuid('Invalid ID format')

export const slugSchema = z.string()
  .min(1, 'Slug is required')
  .max(200, 'Slug too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')

export const emailSchema = z.string().email('Invalid email address')

// Georgian phone number validation
// Accepts: +995 5XX XXX XXX, 995 5XXXXXXXX, 5XX XXX XXX, 5XXXXXXXX
// Mobile numbers start with 5, landlines with area codes (32 for Tbilisi, etc.)
export const georgianPhoneRegex = /^(\+?995\s?)?(5\d{2}[\s-]?\d{3}[\s-]?\d{3}|5\d{8}|(32|42|43|31|41|34)\d{2}[\s-]?\d{2}[\s-]?\d{2}|(32|42|43|31|41|34)\d{6})$/

export const phoneSchema = z.string()
  .min(9, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(georgianPhoneRegex, 'Invalid Georgian phone number (e.g., 5XX XXX XXX or +995 5XX XXX XXX)')

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// =====================================================
// AUTH SCHEMAS
// =====================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: phoneSchema.optional().nullable(),
  address: z.string().max(500).optional().nullable(),
})

// =====================================================
// PRODUCT SCHEMAS
// =====================================================

export const productFilterSchema = z.object({
  category: slugSchema.optional(),
  search: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
  sale: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'name']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const createProductSchema = z.object({
  nameEn: z.string().min(1).max(200),
  nameKa: z.string().min(1).max(200),
  slug: slugSchema,
  descriptionEn: z.string().max(5000).optional(),
  descriptionKa: z.string().max(5000).optional(),
  price: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().positive().optional().nullable(),
  categoryId: uuidSchema.optional().nullable(),
  sku: z.string().max(50).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
})

export const updateProductSchema = createProductSchema.partial()

// =====================================================
// CATEGORY SCHEMAS
// =====================================================

export const createCategorySchema = z.object({
  nameEn: z.string().min(1).max(100),
  nameKa: z.string().min(1).max(100),
  slug: slugSchema,
  descriptionEn: z.string().max(500).optional(),
  descriptionKa: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
})

export const updateCategorySchema = createCategorySchema.partial()

// =====================================================
// ORDER SCHEMAS
// =====================================================

export const shippingAddressSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  postalCode: z.string().max(20).optional(),
})

export const orderItemSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional().nullable(),
  quantity: z.coerce.number().int().positive().max(100),
})

export const createOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  notes: z.string().max(500).optional(),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
})

// =====================================================
// REVIEW SCHEMAS
// =====================================================

export const createReviewSchema = z.object({
  productId: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})

// =====================================================
// WISHLIST SCHEMAS
// =====================================================

export const wishlistItemSchema = z.object({
  productId: uuidSchema,
})

// =====================================================
// NEWS SCHEMAS
// =====================================================

export const createNewsSchema = z.object({
  title: z.string().min(1).max(200),
  slug: slugSchema,
  excerpt: z.string().max(500).optional(),
  content: z.string().max(50000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  isPublished: z.coerce.boolean().default(false),
})

export const updateNewsSchema = createNewsSchema.partial()

// =====================================================
// CONTACT SCHEMAS
// =====================================================

export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Safely parse and validate input data.
 * Returns validated data or throws a formatted error.
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
    throw new Error(`Validation failed: ${errors.join(', ')}`)
  }
  
  return result.data
}

/**
 * Safely parse input, returning null on failure instead of throwing.
 */
export function safeValidateInput<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data)
  return result.success ? result.data : null
}

// Export types
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ProductFilterInput = z.infer<typeof productFilterSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type WishlistItemInput = z.infer<typeof wishlistItemSchema>
export type CreateNewsInput = z.infer<typeof createNewsSchema>
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
