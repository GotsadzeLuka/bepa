import type {
  StoreCategory,
  StoreProduct,
  StoreProductFilters,
  StoreProductResult,
  StoreReview,
} from '@/lib/catalog'

const demoBaseDate = new Date('2026-05-01T10:00:00.000Z')

const demoCategorySeeds = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    nameEn: 'Lighting',
    nameKa: 'განათება',
    slug: 'lighting',
    imageUrl: '/storefront/categories/lighting.svg',
    descriptionEn: 'LED headlights, fog lamps, bulbs, and visibility upgrades for safer night driving.',
    descriptionKa: 'LED ფარები, ნისლის ფარები და ხილვადობის აქსესუარები უსაფრთხო ღამის მართვისთვის.',
    isActive: true,
    sortOrder: 10,
  },
  {
    id: '00000000-0000-4000-8000-000000000002',
    nameEn: 'Batteries',
    nameKa: 'აკუმულატორები',
    slug: 'batteries',
    imageUrl: '/storefront/categories/batteries.svg',
    descriptionEn: 'AGM, EFB, and maintenance-free batteries for daily drivers and fleet vehicles.',
    descriptionKa: 'AGM, EFB და მოვლის გარეშე აკუმულატორები ყოველდღიური და ფლოტის ავტომობილებისთვის.',
    isActive: true,
    sortOrder: 20,
  },
  {
    id: '00000000-0000-4000-8000-000000000003',
    nameEn: 'Brakes',
    nameKa: 'მუხრუჭები',
    slug: 'brakes',
    imageUrl: '/storefront/categories/brakes.svg',
    descriptionEn: 'Brake pads, rotors, sensors, and service kits for confident stopping power.',
    descriptionKa: 'სამუხრუჭე ხუნდები, დისკები, სენსორები და სერვის კომპლექტები დამაჯერებელი გაჩერებისთვის.',
    isActive: true,
    sortOrder: 30,
  },
  {
    id: '00000000-0000-4000-8000-000000000004',
    nameEn: 'Filters',
    nameKa: 'ფილტრები',
    slug: 'filters',
    imageUrl: '/storefront/categories/filters.svg',
    descriptionEn: 'Air, oil, cabin, and fuel filters selected for clean flow and simple maintenance.',
    descriptionKa: 'ჰაერის, ზეთის, სალონის და საწვავის ფილტრები სუფთა ნაკადისა და მარტივი სერვისისთვის.',
    isActive: true,
    sortOrder: 40,
  },
  {
    id: '00000000-0000-4000-8000-000000000005',
    nameEn: 'Oils & Fluids',
    nameKa: 'ზეთები და სითხეები',
    slug: 'oils-fluids',
    imageUrl: '/storefront/categories/oils-fluids.svg',
    descriptionEn: 'Engine oils, coolant, brake fluid, additives, and workshop fluids for scheduled service.',
    descriptionKa: 'ძრავის ზეთები, ანტიფრიზი, სამუხრუჭე სითხე და დანამატები გეგმიური სერვისისთვის.',
    isActive: true,
    sortOrder: 50,
  },
  {
    id: '00000000-0000-4000-8000-000000000006',
    nameEn: 'Accessories',
    nameKa: 'აქსესუარები',
    slug: 'accessories',
    imageUrl: '/storefront/categories/accessories.svg',
    descriptionEn: 'Practical cabin, storage, safety, and road-trip accessories for everyday use.',
    descriptionKa: 'სალონის, შენახვის, უსაფრთხოებისა და მოგზაურობის პრაქტიკული აქსესუარები.',
    isActive: true,
    sortOrder: 60,
  },
] satisfies StoreCategory[]

type DemoProductSeed = {
  categorySlug: string
  nameEn: string
  nameKa: string
  slug: string
  price: number
  salePrice: number | null
  sku: string
  stock: number
  isFeatured: boolean
}

const demoProductSeeds: DemoProductSeed[] = [
  {
    categorySlug: 'lighting',
    nameEn: 'Apex LED Headlight Kit',
    nameKa: 'Apex LED ფარების ნაკრები',
    slug: 'apex-led-headlight-kit',
    price: 189,
    salePrice: 159,
    sku: 'BEPA-LIG-001',
    stock: 18,
    isFeatured: true,
  },
  {
    categorySlug: 'lighting',
    nameEn: 'NightRun Fog Lamp Pair',
    nameKa: 'NightRun ნისლის ფარები',
    slug: 'nightrun-fog-lamp-pair',
    price: 112,
    salePrice: null,
    sku: 'BEPA-LIG-002',
    stock: 15,
    isFeatured: false,
  },
  {
    categorySlug: 'batteries',
    nameEn: 'Atlas AGM Battery 70Ah',
    nameKa: 'Atlas AGM აკუმულატორი 70Ah',
    slug: 'atlas-agm-battery-70ah',
    price: 328,
    salePrice: 299,
    sku: 'BEPA-BAT-001',
    stock: 10,
    isFeatured: true,
  },
  {
    categorySlug: 'batteries',
    nameEn: 'ChargeMate Smart Maintainer',
    nameKa: 'ChargeMate ჭკვიანი დამტენი',
    slug: 'chargemate-smart-maintainer',
    price: 88,
    salePrice: null,
    sku: 'BEPA-BAT-004',
    stock: 21,
    isFeatured: false,
  },
  {
    categorySlug: 'brakes',
    nameEn: 'Torque Ceramic Brake Pad Set',
    nameKa: 'Torque კერამიკული ხუნდები',
    slug: 'torque-ceramic-brake-pad-set',
    price: 138,
    salePrice: 119,
    sku: 'BEPA-BRA-001',
    stock: 26,
    isFeatured: true,
  },
  {
    categorySlug: 'brakes',
    nameEn: 'RoadGrip Front Rotor Pair',
    nameKa: 'RoadGrip წინა დისკები',
    slug: 'roadgrip-front-rotor-pair',
    price: 224,
    salePrice: null,
    sku: 'BEPA-BRA-002',
    stock: 14,
    isFeatured: false,
  },
  {
    categorySlug: 'filters',
    nameEn: 'PureFlow Cabin Filter',
    nameKa: 'PureFlow სალონის ფილტრი',
    slug: 'pureflow-cabin-filter',
    price: 28,
    salePrice: null,
    sku: 'BEPA-FIL-001',
    stock: 42,
    isFeatured: false,
  },
  {
    categorySlug: 'filters',
    nameEn: 'AirMax Engine Filter',
    nameKa: 'AirMax ძრავის ჰაერის ფილტრი',
    slug: 'airmax-engine-filter',
    price: 34,
    salePrice: 29,
    sku: 'BEPA-FIL-002',
    stock: 36,
    isFeatured: true,
  },
  {
    categorySlug: 'oils-fluids',
    nameEn: 'Endurance 5W30 Engine Oil',
    nameKa: 'Endurance 5W30 ძრავის ზეთი',
    slug: 'endurance-5w30-engine-oil',
    price: 64,
    salePrice: 55,
    sku: 'BEPA-OIL-001',
    stock: 33,
    isFeatured: true,
  },
  {
    categorySlug: 'oils-fluids',
    nameEn: 'ThermoGuard Coolant Plus',
    nameKa: 'ThermoGuard ანტიფრიზი',
    slug: 'thermoguard-coolant-plus',
    price: 24,
    salePrice: null,
    sku: 'BEPA-OIL-002',
    stock: 50,
    isFeatured: false,
  },
  {
    categorySlug: 'accessories',
    nameEn: 'UrbanShield Dash Camera',
    nameKa: 'UrbanShield ვიდეორეგისტრატორი',
    slug: 'urbanshield-dash-camera',
    price: 178,
    salePrice: 149,
    sku: 'BEPA-ACC-001',
    stock: 11,
    isFeatured: true,
  },
  {
    categorySlug: 'accessories',
    nameEn: 'CargoFlex Trunk Organizer',
    nameKa: 'CargoFlex საბარგულის ორგანიზერი',
    slug: 'cargoflex-trunk-organizer',
    price: 52,
    salePrice: null,
    sku: 'BEPA-ACC-002',
    stock: 29,
    isFeatured: false,
  },
]

const categoriesBySlug = new Map(demoCategorySeeds.map((category) => [category.slug, category]))

function demoUuid(group: '8001' | '8002' | '8003' | '8004', index: number) {
  return `00000000-0000-4000-${group}-${String(index + 1).padStart(12, '0')}`
}

function demoProductDescription(nameEn: string) {
  return `${nameEn} is available in the live preview catalog with stable pricing, visible stock, and quick filter coverage.`
}

function demoProductDescriptionKa(nameKa: string) {
  return `${nameKa} ხელმისაწვდომია წინასწარი კატალოგის რეჟიმში სტაბილური ფასით, მარაგითა და სწრაფი ფილტრებით.`
}

export function canUseDemoCatalog() {
  return process.env.BEPA_STOREFRONT_MODE !== 'database'
}

export function canCheckoutDemoCatalog() {
  return process.env.BEPA_STOREFRONT_MODE === 'demo' || process.env.NODE_ENV === 'development'
}

export const demoCategories = demoCategorySeeds

export const demoProducts: StoreProduct[] = demoProductSeeds.map((product, index) => {
  const category = categoriesBySlug.get(product.categorySlug) ?? null
  const createdAt = new Date(demoBaseDate.getTime() + index * 60 * 60 * 1000)

  return {
    id: demoUuid('8001', index),
    categoryId: category?.id ?? null,
    nameEn: product.nameEn,
    nameKa: product.nameKa,
    slug: product.slug,
    descriptionEn: demoProductDescription(product.nameEn),
    descriptionKa: demoProductDescriptionKa(product.nameKa),
    price: product.price,
    salePrice: product.salePrice,
    sku: product.sku,
    stock: product.stock,
    isActive: true,
    isFeatured: product.isFeatured,
    createdAt,
    updatedAt: createdAt,
    category,
    images: [
      {
        id: demoUuid('8003', index),
        url: category?.imageUrl ?? '/storefront/categories/accessories.svg',
        altText: `${product.nameEn} preview artwork`,
        isPrimary: true,
        sortOrder: 0,
      },
    ],
    variants: index % 3 === 0
      ? [
          {
            id: demoUuid('8002', index * 2),
            nameEn: 'Standard fit',
            nameKa: 'სტანდარტული ზომა',
            sku: `${product.sku}-STD`,
            price: product.price,
            stock: Math.max(4, product.stock - 4),
            isActive: true,
          },
          {
            id: demoUuid('8002', index * 2 + 1),
            nameEn: 'Premium fit',
            nameKa: 'პრემიუმ ზომა',
            sku: `${product.sku}-PRM`,
            price: Math.round(product.price * 1.18),
            stock: Math.max(3, product.stock - 8),
            isActive: true,
          },
        ]
      : [],
  }
})

export function isDemoProductId(productId: string) {
  return demoProducts.some((product) => product.id === productId)
}

export function isDemoVariantId(variantId: string) {
  return demoProducts.some((product) => product.variants.some((variant) => variant.id === variantId))
}

export function getDemoHomePageData() {
  const latestProducts = [...demoProducts].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())

  return {
    categories: demoCategories,
    featuredProducts: demoProducts.filter((product) => product.isFeatured).slice(0, 8),
    saleProducts: demoProducts.filter((product) => product.salePrice !== null).slice(0, 8),
    latestProducts: latestProducts.slice(0, 8),
  }
}

function productMatchesSearch(product: StoreProduct, search: string) {
  const needle = search.trim().toLowerCase()
  if (!needle) return true

  return [
    product.nameEn,
    product.nameKa,
    product.descriptionEn,
    product.descriptionKa,
    product.sku,
    product.category?.nameEn,
    product.category?.nameKa,
  ].some((value) => value?.toLowerCase().includes(needle))
}

function sortDemoProducts(products: StoreProduct[], sort: StoreProductFilters['sort']) {
  const sorted = [...products]

  switch (sort) {
    case 'price-asc':
      return sorted.sort((left, right) => (left.salePrice ?? left.price) - (right.salePrice ?? right.price))
    case 'price-desc':
      return sorted.sort((left, right) => (right.salePrice ?? right.price) - (left.salePrice ?? left.price))
    case 'name':
      return sorted.sort((left, right) => left.nameEn.localeCompare(right.nameEn))
    case 'newest':
    default:
      return sorted.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }
}

export function getDemoProducts(filters: StoreProductFilters): StoreProductResult {
  const page = Math.max(1, filters.page ?? 1)
  const limit = Math.min(Math.max(filters.limit ?? 12, 1), 100)
  const filteredProducts = demoProducts.filter((product) => {
    if (filters.category && product.category?.slug !== filters.category) return false
    if (filters.featured && !product.isFeatured) return false
    if (filters.sale && product.salePrice === null) return false
    if (filters.search && !productMatchesSearch(product, filters.search)) return false
    return true
  })
  const sortedProducts = sortDemoProducts(filteredProducts, filters.sort)
  const total = sortedProducts.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit

  return {
    products: sortedProducts.slice(start, start + limit),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

export function getDemoProductBySlug(slug: string) {
  return demoProducts.find((product) => product.slug === slug) ?? null
}

export function getDemoRelatedProducts(productId: string, categoryId: string | null, limit: number) {
  return demoProducts
    .filter((product) => product.id !== productId && product.categoryId === categoryId)
    .slice(0, limit)
}

export function getDemoProductReviews(productId: string): StoreReview[] {
  const product = demoProducts.find((entry) => entry.id === productId)
  if (!product) return []

  return [
    {
      id: demoUuid('8004', 0),
      productId,
      rating: 5,
      comment: 'Clear fitment notes, fast filtering, and the product card added smoothly to the cart.',
      user: { fullName: 'BEPA preview customer' },
      createdAt: new Date('2026-05-20T09:30:00.000Z'),
    },
    {
      id: demoUuid('8004', 1),
      productId,
      rating: 4,
      comment: 'Useful preview stock and pricing before connecting the full database catalog.',
      user: { fullName: 'Garage operator' },
      createdAt: new Date('2026-05-18T15:15:00.000Z'),
    },
  ]
}

export function createDemoOrder(data: {
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>
  shippingAddress: Record<string, unknown>
  notes?: string
  userId?: string | null
}) {
  const now = new Date()
  const pricedItems = data.items.map((item) => {
    const product = demoProducts.find((entry) => entry.id === item.productId)
    const variant = item.variantId
      ? product?.variants.find((entry) => entry.id === item.variantId)
      : null

    if (!product || (item.variantId && !variant)) {
      throw new Error('One or more preview catalog items are unavailable.')
    }

    const stock = variant?.stock ?? product.stock
    if (stock < item.quantity) {
      throw new Error('One or more preview catalog items do not have enough stock.')
    }

    return {
      price: variant?.price ?? product.salePrice ?? product.price,
      quantity: item.quantity,
    }
  })

  return {
    id: `demo-${now.getTime()}`,
    userId: data.userId ?? null,
    status: 'pending' as const,
    total: pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    shippingAddress: data.shippingAddress,
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }
}
