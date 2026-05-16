import type {
  StoreCategory,
  StoreProduct,
  StoreProductFilters,
  StoreProductResult,
  StoreReview,
  StoreSort,
} from '@/lib/catalog'

const now = new Date('2026-05-16T10:00:00.000Z')

export const mockCategories: StoreCategory[] = [
  {
    id: 'cat-lighting',
    nameEn: 'Lighting',
    nameKa: 'განათება',
    slug: 'lighting',
    imageUrl: null,
    descriptionEn: 'LED upgrades, fog lamps, and brighter night driving essentials.',
    descriptionKa: 'LED განახლებები, ნისლის ფარები და ღამის მგზავრობის აქსესუარები.',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'cat-batteries',
    nameEn: 'Batteries',
    nameKa: 'აკუმულატორები',
    slug: 'batteries',
    imageUrl: null,
    descriptionEn: 'AGM batteries, chargers, and power backup tools.',
    descriptionKa: 'AGM აკუმულატორები, დამტენები და ენერგიის მოწყობილობები.',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'cat-brakes',
    nameEn: 'Brakes',
    nameKa: 'მუხრუჭები',
    slug: 'brakes',
    imageUrl: null,
    descriptionEn: 'Ceramic pads, discs, and safer stopping performance.',
    descriptionKa: 'კერამიკული ხუნდები, დისკები და უსაფრთხო გაჩერების სისტემა.',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'cat-filters',
    nameEn: 'Filters',
    nameKa: 'ფილტრები',
    slug: 'filters',
    imageUrl: null,
    descriptionEn: 'Cabin, air, and intake filters for cleaner daily driving.',
    descriptionKa: 'სალონის, ჰაერის და intake ფილტრები სუფთა მოძრაობისთვის.',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'cat-fluids',
    nameEn: 'Oils & Fluids',
    nameKa: 'ზეთები და სითხეები',
    slug: 'oils-fluids',
    imageUrl: null,
    descriptionEn: 'Engine oil, coolant, and workshop-ready maintenance staples.',
    descriptionKa: 'ძრავის ზეთი, ანტიფრიზი და ტექნიკური მოვლის საჭირო სითხეები.',
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'cat-accessories',
    nameEn: 'Accessories',
    nameKa: 'აქსესუარები',
    slug: 'accessories',
    imageUrl: null,
    descriptionEn: 'Dash tech, inflators, and everyday road-trip add-ons.',
    descriptionKa: 'მანქანის ტექნიკა, კომპრესორები და ყოველდღიური აქსესუარები.',
    isActive: true,
    sortOrder: 6,
  },
]

const categoryMap = new Map(mockCategories.map((category) => [category.id, category]))

const baseProducts: Omit<StoreProduct, 'category'>[] = [
  {
    id: 'prod-apex-led-headlight-kit',
    categoryId: 'cat-lighting',
    nameEn: 'Apex LED Headlight Kit',
    nameKa: 'Apex LED ფარების ნაკრები',
    slug: 'apex-led-headlight-kit',
    descriptionEn: 'A focused beam pattern, cool-white output, and quick-install mounting for modern night driving.',
    descriptionKa: 'ზუსტი შუქის კონტური, თეთრი ნათება და სწრაფი მონტაჟი ღამის მგზავრობისთვის.',
    price: 189,
    salePrice: 149,
    sku: 'LGT-ALH-001',
    stock: 14,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [
      { id: 'var-led-h7', nameEn: 'H7 Socket', nameKa: 'H7 სოკეტი', sku: 'LGT-H7', price: 149, stock: 8, isActive: true },
      { id: 'var-led-h11', nameEn: 'H11 Socket', nameKa: 'H11 სოკეტი', sku: 'LGT-H11', price: 159, stock: 6, isActive: true },
    ],
  },
  {
    id: 'prod-nightrun-fog-lamp-pair',
    categoryId: 'cat-lighting',
    nameEn: 'NightRun Fog Lamp Pair',
    nameKa: 'NightRun ნისლის ფარების წყვილი',
    slug: 'nightrun-fog-lamp-pair',
    descriptionEn: 'Compact fog lamps with a warmer cutoff for wet roads, mountain routes, and bad-weather visibility.',
    descriptionKa: 'კომპაქტური ნისლის ფარები თბილი განათებით წვიმიან და რთულ გზებზე.',
    price: 129,
    salePrice: null,
    sku: 'LGT-NFL-004',
    stock: 19,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-13T10:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-atlas-agm-battery-70ah',
    categoryId: 'cat-batteries',
    nameEn: 'Atlas AGM Battery 70Ah',
    nameKa: 'Atlas AGM აკუმულატორი 70Ah',
    slug: 'atlas-agm-battery-70ah',
    descriptionEn: 'Strong cold-start performance with stable reserve capacity for sedans, crossovers, and daily fleets.',
    descriptionKa: 'ძლიერი გაშვება ცივ ამინდში და სტაბილური რესურსი ყოველდღიური გამოყენებისთვის.',
    price: 349,
    salePrice: 319,
    sku: 'BAT-A70-009',
    stock: 7,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-15T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-torque-ceramic-brake-pad-set',
    categoryId: 'cat-brakes',
    nameEn: 'Torque Ceramic Brake Pad Set',
    nameKa: 'Torque კერამიკული ხუნდების ნაკრები',
    slug: 'torque-ceramic-brake-pad-set',
    descriptionEn: 'Low-dust ceramic pads built for quieter city stops and confident pedal feel on longer descents.',
    descriptionKa: 'დაბალი მტვერი, მშვიდი მუშაობა და ძლიერი დამუხრუჭება ქალაქშიც და დაღმართზეც.',
    price: 169,
    salePrice: 139,
    sku: 'BRK-TCB-015',
    stock: 24,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-11T09:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [
      { id: 'var-brake-front', nameEn: 'Front Axle', nameKa: 'წინა ღერძი', sku: 'BRK-FRONT', price: 139, stock: 12, isActive: true },
      { id: 'var-brake-rear', nameEn: 'Rear Axle', nameKa: 'უკანა ღერძი', sku: 'BRK-REAR', price: 129, stock: 12, isActive: true },
    ],
  },
  {
    id: 'prod-urbanshield-dash-camera',
    categoryId: 'cat-accessories',
    nameEn: 'UrbanShield Dash Camera',
    nameKa: 'UrbanShield ვიდეორეგისტრატორი',
    slug: 'urbanshield-dash-camera',
    descriptionEn: 'A wide-angle dash camera with night mode, parking monitoring, and quick windshield mounting.',
    descriptionKa: 'ფართო კუთხის ვიდეორეგისტრატორი ღამის რეჟიმით და პარკირების მონიტორინგით.',
    price: 239,
    salePrice: null,
    sku: 'ACC-UDC-021',
    stock: 11,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-05-16T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-pureflow-cabin-filter',
    categoryId: 'cat-filters',
    nameEn: 'PureFlow Cabin Filter',
    nameKa: 'PureFlow სალონის ფილტრი',
    slug: 'pureflow-cabin-filter',
    descriptionEn: 'Multi-layer cabin filtration designed to reduce dust, odors, and heavy urban pollen.',
    descriptionKa: 'მრავალშრიანი სალონის ფილტრი მტვრის, სუნისა და მტვრის ნაწილაკების შესამცირებლად.',
    price: 49,
    salePrice: null,
    sku: 'FLT-PCF-007',
    stock: 42,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-05-10T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-endurance-5w30-engine-oil',
    categoryId: 'cat-fluids',
    nameEn: 'Endurance 5W-30 Engine Oil',
    nameKa: 'Endurance 5W-30 ძრავის ზეთი',
    slug: 'endurance-5w30-engine-oil',
    descriptionEn: 'Synthetic 5W-30 oil tuned for heat stability, smooth starts, and modern turbocharged engines.',
    descriptionKa: 'სინთეტიკური 5W-30 ზეთი სტაბილური ტემპერატურის და რბილი გაშვებისათვის.',
    price: 79,
    salePrice: 65,
    sku: 'FLD-E53-003',
    stock: 31,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-09T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [
      { id: 'var-oil-4l', nameEn: '4L Bottle', nameKa: '4ლ ბოთლი', sku: 'FLD-4L', price: 65, stock: 18, isActive: true },
      { id: 'var-oil-5l', nameEn: '5L Bottle', nameKa: '5ლ ბოთლი', sku: 'FLD-5L', price: 75, stock: 13, isActive: true },
    ],
  },
  {
    id: 'prod-aeroflex-wiper-blade-set',
    categoryId: 'cat-accessories',
    nameEn: 'AeroFlex Wiper Blade Set',
    nameKa: 'AeroFlex საწმენდი ჯაგრისების ნაკრები',
    slug: 'aeroflex-wiper-blade-set',
    descriptionEn: 'Low-profile blades with even pressure distribution for cleaner city commutes and winter rain.',
    descriptionKa: 'დაბალი პროფილის ჯაგრისები ერთგვაროვანი წნევით სუფთა საქარე მინისათვის.',
    price: 59,
    salePrice: null,
    sku: 'ACC-AWB-013',
    stock: 27,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-05-08T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-thermoguard-coolant-plus',
    categoryId: 'cat-fluids',
    nameEn: 'ThermoGuard Coolant Plus',
    nameKa: 'ThermoGuard ანტიფრიზი Plus',
    slug: 'thermoguard-coolant-plus',
    descriptionEn: 'Long-life coolant built to handle summer traffic, winter mornings, and reliable engine protection.',
    descriptionKa: 'ხანგრძლივი რესურსის ანტიფრიზი ზაფხულის სიცხისა და ზამთრის სიცივისთვის.',
    price: 39,
    salePrice: null,
    sku: 'FLD-TCP-010',
    stock: 33,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-05-12T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-roadsense-tire-inflator',
    categoryId: 'cat-accessories',
    nameEn: 'RoadSense Tire Inflator',
    nameKa: 'RoadSense საბურავის კომპრესორი',
    slug: 'roadsense-tire-inflator',
    descriptionEn: 'Digital inflator with pressure presets and a compact trunk-friendly body for emergency roadside use.',
    descriptionKa: 'ციფრული კომპრესორი წინასწარ დაყენებული წნევის რეჟიმებით და კომპაქტური კორპუსით.',
    price: 119,
    salePrice: 95,
    sku: 'ACC-RTI-018',
    stock: 15,
    isActive: true,
    isFeatured: false,
    createdAt: new Date('2026-05-07T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-carbon-air-intake-filter',
    categoryId: 'cat-filters',
    nameEn: 'Carbon Air Intake Filter',
    nameKa: 'Carbon ჰაერის intake ფილტრი',
    slug: 'carbon-air-intake-filter',
    descriptionEn: 'Performance-minded airflow with improved filtration for responsive acceleration and cleaner intake cycles.',
    descriptionKa: 'გაძლიერებული ჰაერის ნაკადი და ფილტრაცია უკეთესი აჩქარებისა და სისუფთავისთვის.',
    price: 89,
    salePrice: null,
    sku: 'FLT-CAF-019',
    stock: 13,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-06T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
  {
    id: 'prod-streetline-jump-starter',
    categoryId: 'cat-batteries',
    nameEn: 'StreetLine Jump Starter',
    nameKa: 'StreetLine სტარტერის ბუსტერიც',
    slug: 'streetline-jump-starter',
    descriptionEn: 'Portable jump starter with USB output, smart clamps, and enough reserve for road trips and daily use.',
    descriptionKa: 'პორტატული ბუსტერი USB პორტით, ჭკვიანი კლემებით და დიდი რეზერვით გზისთვის.',
    price: 279,
    salePrice: 249,
    sku: 'BAT-SJS-025',
    stock: 9,
    isActive: true,
    isFeatured: true,
    createdAt: new Date('2026-05-05T08:00:00.000Z'),
    updatedAt: now,
    images: [],
    variants: [],
  },
]

export const mockProducts: StoreProduct[] = baseProducts.map((product) => ({
  ...product,
  category: product.categoryId ? categoryMap.get(product.categoryId) ?? null : null,
}))

export const mockReviews: StoreReview[] = [
  {
    id: 'review-1',
    productId: 'prod-apex-led-headlight-kit',
    rating: 5,
    comment: 'Fast install, sharp beam cutoff, and much better visibility on dark roads.',
    user: { fullName: 'Nika Beridze' },
    createdAt: new Date('2026-05-15T12:00:00.000Z'),
  },
  {
    id: 'review-2',
    productId: 'prod-apex-led-headlight-kit',
    rating: 4,
    comment: 'The H11 version fit cleanly and feels premium for the price.',
    user: { fullName: 'Mariam K.' },
    createdAt: new Date('2026-05-15T16:00:00.000Z'),
  },
  {
    id: 'review-3',
    productId: 'prod-torque-ceramic-brake-pad-set',
    rating: 5,
    comment: 'Quiet in traffic and noticeably smoother under harder braking.',
    user: { fullName: 'Giorgi Matcharashvili' },
    createdAt: new Date('2026-05-13T11:00:00.000Z'),
  },
  {
    id: 'review-4',
    productId: 'prod-atlas-agm-battery-70ah',
    rating: 5,
    comment: 'Strong cold start and the store staff helped me match the right size.',
    user: { fullName: 'Elene D.' },
    createdAt: new Date('2026-05-14T09:30:00.000Z'),
  },
]

function sortProducts(products: StoreProduct[], sort: StoreSort = 'newest') {
  const sorted = [...products]

  switch (sort) {
    case 'price-asc':
      sorted.sort((left, right) => left.price - right.price)
      break
    case 'price-desc':
      sorted.sort((left, right) => right.price - left.price)
      break
    case 'name':
      sorted.sort((left, right) => left.nameEn.localeCompare(right.nameEn))
      break
    default:
      sorted.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      break
  }

  return sorted
}

export function getMockCategories() {
  return [...mockCategories]
}

export function getMockFeaturedProducts(limit = 8) {
  return mockProducts.filter((product) => product.isFeatured).slice(0, limit)
}

export function getMockSaleProducts(limit = 8) {
  return mockProducts.filter((product) => product.salePrice !== null).slice(0, limit)
}

export function getMockLatestProducts(limit = 8) {
  return sortProducts(mockProducts, 'newest').slice(0, limit)
}

export function getMockProductBySlug(slug: string) {
  return mockProducts.find((product) => product.slug === slug) ?? null
}

export function getMockRelatedProducts(productId: string, categoryId: string | null, limit = 4) {
  return mockProducts
    .filter((product) => product.id !== productId && (!categoryId || product.categoryId === categoryId))
    .slice(0, limit)
}

export function getMockProductReviews(productId: string) {
  return mockReviews.filter((review) => review.productId === productId)
}

export function getMockProducts(filters: StoreProductFilters): StoreProductResult {
  const page = filters.page ?? 1
  const limit = filters.limit ?? 12

  let filtered = mockProducts.filter((product) => product.isActive)

  if (filters.category) {
    filtered = filtered.filter((product) => product.category?.slug === filters.category)
  }

  if (filters.search) {
    const term = filters.search.toLowerCase()
    filtered = filtered.filter((product) => {
      return [
        product.nameEn,
        product.nameKa,
        product.descriptionEn ?? '',
        product.category?.nameEn ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }

  if (filters.featured) {
    filtered = filtered.filter((product) => product.isFeatured)
  }

  if (filters.sale) {
    filtered = filtered.filter((product) => product.salePrice !== null)
  }

  const sorted = sortProducts(filtered, filters.sort)
  const total = sorted.length
  const start = (page - 1) * limit
  const paginated = sorted.slice(start, start + limit)

  return {
    products: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}
