import { NextResponse, type NextRequest } from 'next/server'
import { getCategoryName, getDisplayPrice, getProductName } from '@/lib/catalog'
import { getProductMedia } from '@/lib/storefront-media'
import { storefrontService } from '@/lib/storefront'

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 120
const SEARCH_LIMIT = 6

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const query = (requestUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY_LENGTH)

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ query, total: 0, results: [] })
  }

  const { products, pagination } = await storefrontService.getProducts({
    search: query,
    limit: SEARCH_LIMIT,
  })

  const results = products.map((product) => {
    const media = getProductMedia(product)

    return {
      id: product.id,
      slug: product.slug,
      nameEn: getProductName(product, 'en'),
      nameKa: getProductName(product, 'ka'),
      categoryEn: getCategoryName(product.category, 'en'),
      categoryKa: getCategoryName(product.category, 'ka'),
      price: getDisplayPrice(product),
      stock: product.stock,
      image: media.src,
      imageAlt: media.alt,
      imagePosition: media.objectPosition ?? 'center',
    }
  })

  return NextResponse.json(
    { query, total: pagination.total, results },
    {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      },
    }
  )
}
