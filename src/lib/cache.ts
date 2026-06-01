import { revalidateTag } from 'next/cache'

export const PUBLIC_CACHE_REVALIDATE_SECONDS = 300
export const REVALIDATE_PROFILE = 'max'

export const cacheTags = {
  storefrontHome: 'storefront:home',
  storefrontCategories: 'storefront:categories',
  storefrontProducts: 'storefront:products',
  storefrontNews: 'storefront:news',
  product: (slug: string) => `storefront:product:${slug}`,
  productReviews: (productId: string) => `storefront:product-reviews:${productId}`,
  newsItem: (slug: string) => `storefront:news:${slug}`,
  adminDashboard: 'admin:dashboard',
} as const

export function revalidateCacheTags(tags: string[]) {
  for (const tag of new Set(tags.filter(Boolean))) {
    revalidateTag(tag, REVALIDATE_PROFILE)
  }
}

export function revalidateProductCache(product?: { id?: string | null; slug?: string | null } | null) {
  revalidateCacheTags([
    cacheTags.storefrontHome,
    cacheTags.storefrontProducts,
    product?.slug ? cacheTags.product(product.slug) : '',
    product?.id ? cacheTags.productReviews(product.id) : '',
  ])
}

export function revalidateCategoryCache() {
  revalidateCacheTags([
    cacheTags.storefrontHome,
    cacheTags.storefrontCategories,
    cacheTags.storefrontProducts,
  ])
}

export function revalidateNewsCache(news?: { slug?: string | null } | null) {
  revalidateCacheTags([
    cacheTags.storefrontNews,
    news?.slug ? cacheTags.newsItem(news.slug) : '',
  ])
}

export function revalidateAdminCache() {
  revalidateCacheTags([cacheTags.adminDashboard])
}
