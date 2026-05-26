import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function countRows(table: string, filters: Record<string, string | number | boolean> = {}) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }

  const { count, error } = await query
  if (error) throw new Error(`Count failed for ${table}: ${error.message}`)
  return count ?? 0
}

async function main() {
  const [
    categories,
    products,
    productImages,
    productVariants,
    news,
    reviews,
    orders,
  ] = await Promise.all([
    countRows('categories', { is_active: true }),
    countRows('products', { is_active: true }),
    countRows('product_images'),
    countRows('product_variants', { is_active: true }),
    countRows('news', { is_published: true }),
    countRows('reviews', { is_approved: true }),
    countRows('orders'),
  ])

  console.log(JSON.stringify({
    activeCategories: categories,
    activeProducts: products,
    productImages,
    activeProductVariants: productVariants,
    publishedNews: news,
    approvedReviews: reviews,
    orders,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
