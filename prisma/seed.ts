import { createHash, randomUUID } from 'crypto'
import { deflateSync } from 'zlib'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })
config({ path: '.env.local', override: true })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const storageBucket =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
  process.env.SUPABASE_STORAGE_BUCKET ??
  'BePa-PublicStorage'

const missingEnv = [
  !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
  !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
].filter(Boolean)

if (missingEnv.length > 0) {
  throw new Error(`Missing seed environment variables: ${missingEnv.join(', ')}`)
}

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const timeoutSignal = AbortSignal.timeout(30_000)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal

  return fetch(input, { ...init, signal })
}

const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: fetchWithTimeout,
  },
})

type CategorySeed = {
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn: string
  descriptionKa: string
  sortOrder: number
}

type VariantSeed = {
  nameEn: string
  nameKa: string
  sku: string
  priceDelta: number
  stock: number
}

type ProductSeed = {
  categorySlug: string
  nameEn: string
  nameKa: string
  slug: string
  descriptionEn: string
  descriptionKa: string
  price: number
  salePrice?: number | null
  sku: string
  stock: number
  isFeatured: boolean
  variants?: VariantSeed[]
}

type NewsSeed = {
  title: string
  slug: string
  excerpt: string
  content: string
}

type SavedCategory = {
  id: string
  slug: string
}

type SavedProduct = {
  id: string
  slug: string
  price: number
  salePrice: number | null
}

const categories: CategorySeed[] = [
  {
    nameEn: 'Lighting',
    nameKa: 'განათება',
    slug: 'lighting',
    descriptionEn: 'LED headlights, fog lamps, bulbs, and visibility upgrades for safer night driving.',
    descriptionKa: 'LED ფარები, ნისლის ფარები და ხილვადობის აქსესუარები უსაფრთხო ღამის მართვისთვის.',
    sortOrder: 10,
  },
  {
    nameEn: 'Batteries',
    nameKa: 'აკუმულატორები',
    slug: 'batteries',
    descriptionEn: 'Reliable AGM, EFB, and maintenance-free batteries for daily drivers and fleet vehicles.',
    descriptionKa: 'სანდო AGM, EFB და მოვლის გარეშე აკუმულატორები ყოველდღიური და ფლოტის ავტომობილებისთვის.',
    sortOrder: 20,
  },
  {
    nameEn: 'Brakes',
    nameKa: 'მუხრუჭები',
    slug: 'brakes',
    descriptionEn: 'Brake pads, rotors, sensors, and service kits tuned for confident stopping power.',
    descriptionKa: 'სამუხრუჭე ხუნდები, დისკები, სენსორები და სერვის კომპლექტები დამაჯერებელი გაჩერებისთვის.',
    sortOrder: 30,
  },
  {
    nameEn: 'Filters',
    nameKa: 'ფილტრები',
    slug: 'filters',
    descriptionEn: 'Air, oil, cabin, and fuel filters selected for clean flow and simple maintenance.',
    descriptionKa: 'ჰაერის, ზეთის, სალონის და საწვავის ფილტრები სუფთა ნაკადისა და მარტივი სერვისისთვის.',
    sortOrder: 40,
  },
  {
    nameEn: 'Oils & Fluids',
    nameKa: 'ზეთები და სითხეები',
    slug: 'oils-fluids',
    descriptionEn: 'Engine oils, coolant, brake fluid, additives, and workshop fluids for scheduled service.',
    descriptionKa: 'ძრავის ზეთები, ანტიფრიზი, სამუხრუჭე სითხე და დანამატები გეგმიური სერვისისთვის.',
    sortOrder: 50,
  },
  {
    nameEn: 'Accessories',
    nameKa: 'აქსესუარები',
    slug: 'accessories',
    descriptionEn: 'Practical cabin, storage, safety, and road-trip accessories for everyday use.',
    descriptionKa: 'სალონის, შენახვის, უსაფრთხოებისა და მოგზაურობის პრაქტიკული აქსესუარები.',
    sortOrder: 60,
  },
  {
    nameEn: 'Tools & Garage',
    nameKa: 'ინსტრუმენტები და გარაჟი',
    slug: 'tools-garage',
    descriptionEn: 'Jacks, socket sets, chargers, cleaners, and garage essentials for home service.',
    descriptionKa: 'დომკრატები, გასაღებების კომპლექტები, დამტენები და გარაჟის საჭირო ნივთები.',
    sortOrder: 70,
  },
  {
    nameEn: 'Wipers & Exterior',
    nameKa: 'მინაწმენდები და ექსტერიერი',
    slug: 'wipers-exterior',
    descriptionEn: 'Wiper blades, trim care, mirrors, and exterior parts that handle changing weather.',
    descriptionKa: 'მინაწმენდები, ექსტერიერის მოვლა, სარკეები და ამინდზე მორგებული დეტალები.',
    sortOrder: 80,
  },
]

const productFamilies = {
  lighting: [
    ['Apex LED Headlight Kit', 'Apex LED ფარების ნაკრები', 'apex-led-headlight-kit', 189, 159],
    ['NightRun Fog Lamp Pair', 'NightRun ნისლის ფარები', 'nightrun-fog-lamp-pair', 112, null],
    ['LumaPro H7 Performance Bulbs', 'LumaPro H7 ნათურები', 'lumapro-h7-performance-bulbs', 42, 35],
    ['SignalClear Tail Light Assembly', 'SignalClear უკანა ფარი', 'signalclear-tail-light-assembly', 96, null],
  ],
  batteries: [
    ['Atlas AGM Battery 70Ah', 'Atlas AGM აკუმულატორი 70Ah', 'atlas-agm-battery-70ah', 328, 299],
    ['VoltEdge EFB Battery 60Ah', 'VoltEdge EFB აკუმულატორი 60Ah', 'voltedge-efb-battery-60ah', 246, null],
    ['ColdStart Battery 80Ah', 'ColdStart აკუმულატორი 80Ah', 'coldstart-battery-80ah', 365, 335],
    ['ChargeMate Smart Maintainer', 'ChargeMate ჭკვიანი დამტენი', 'chargemate-smart-maintainer', 88, null],
  ],
  brakes: [
    ['Torque Ceramic Brake Pad Set', 'Torque კერამიკული ხუნდები', 'torque-ceramic-brake-pad-set', 138, 119],
    ['RoadGrip Front Rotor Pair', 'RoadGrip წინა დისკები', 'roadgrip-front-rotor-pair', 224, null],
    ['StopLine Wear Sensor Kit', 'StopLine ცვეთის სენსორი', 'stopline-wear-sensor-kit', 36, null],
    ['HydraStop Brake Service Kit', 'HydraStop მუხრუჭის სერვის ნაკრები', 'hydrastop-brake-service-kit', 54, 45],
  ],
  filters: [
    ['PureFlow Cabin Filter', 'PureFlow სალონის ფილტრი', 'pureflow-cabin-filter', 28, null],
    ['AirMax Engine Filter', 'AirMax ძრავის ჰაერის ფილტრი', 'airmax-engine-filter', 34, 29],
    ['CleanCore Oil Filter', 'CleanCore ზეთის ფილტრი', 'cleancore-oil-filter', 18, null],
    ['FuelGuard Inline Filter', 'FuelGuard საწვავის ფილტრი', 'fuelguard-inline-filter', 31, null],
  ],
  'oils-fluids': [
    ['Endurance 5W30 Engine Oil', 'Endurance 5W30 ძრავის ზეთი', 'endurance-5w30-engine-oil', 64, 55],
    ['ThermoGuard Coolant Plus', 'ThermoGuard ანტიფრიზი', 'thermoguard-coolant-plus', 24, null],
    ['ClutchLine DOT4 Brake Fluid', 'ClutchLine DOT4 სამუხრუჭე სითხე', 'clutchline-dot4-brake-fluid', 19, null],
    ['TransShift ATF Multi-Vehicle', 'TransShift ATF სითხე', 'transshift-atf-multi-vehicle', 42, 36],
  ],
  accessories: [
    ['UrbanShield Dash Camera', 'UrbanShield ვიდეორეგისტრატორი', 'urbanshield-dash-camera', 178, 149],
    ['CargoFlex Trunk Organizer', 'CargoFlex საბარგულის ორგანიზერი', 'cargoflex-trunk-organizer', 52, null],
    ['SafeRoad Emergency Kit', 'SafeRoad ავარიული ნაკრები', 'saferoad-emergency-kit', 68, 59],
    ['CabinGrip Phone Mount', 'CabinGrip ტელეფონის სამაგრი', 'cabingrip-phone-mount', 29, null],
  ],
  'tools-garage': [
    ['LiftMate Hydraulic Jack', 'LiftMate ჰიდრავლიკური დომკრატი', 'liftmate-hydraulic-jack', 145, 129],
    ['SocketPro 46 Piece Set', 'SocketPro 46 ცალიანი ნაკრები', 'socketpro-46-piece-set', 84, null],
    ['DetailFoam Wash Cannon', 'DetailFoam ქაფის მოწყობილობა', 'detailfoam-wash-cannon', 57, 49],
    ['VoltCheck Battery Tester', 'VoltCheck აკუმულატორის ტესტერი', 'voltcheck-battery-tester', 73, null],
  ],
  'wipers-exterior': [
    ['AeroFlex Wiper Blade Set', 'AeroFlex მინაწმენდები', 'aeroflex-wiper-blade-set', 39, 32],
    ['RainSeal Washer Fluid', 'RainSeal მინის სითხე', 'rainseal-washer-fluid', 12, null],
    ['MirrorBright Side Mirror Glass', 'MirrorBright სარკის მინა', 'mirrorbright-side-mirror-glass', 44, null],
    ['TrimRenew Exterior Care Kit', 'TrimRenew ექსტერიერის მოვლა', 'trimrenew-exterior-care-kit', 63, 54],
  ],
} as const

const products: ProductSeed[] = Object.entries(productFamilies).flatMap(([categorySlug, family], categoryIndex) =>
  family.map(([nameEn, nameKa, slug, price, salePrice], productIndex) => {
    const absoluteIndex = categoryIndex * 4 + productIndex
    const hasVariants = productIndex === 0 || productIndex === 2
    const xssNote = slug === 'apex-led-headlight-kit'
      ? ' QA safety text: <script>alert(1)</script> must display as plain text.'
      : ''

    return {
      categorySlug,
      nameEn,
      nameKa,
      slug,
      descriptionEn: `${nameEn} is a realistic seeded catalog item with fitment-minded copy, clear stock, and Storage-backed artwork.${xssNote}`,
      descriptionKa: `${nameKa} არის რეალისტური სატესტო პროდუქტი სერვისისთვის საჭირო აღწერითა და საწყობის რაოდენობით.`,
      price,
      salePrice,
      sku: `BEPA-${categorySlug.slice(0, 3).toUpperCase()}-${String(productIndex + 1).padStart(3, '0')}`,
      stock: 12 + absoluteIndex * 3,
      isFeatured: absoluteIndex % 3 === 0,
      variants: hasVariants
        ? [
            {
              nameEn: 'Standard fit',
              nameKa: 'სტანდარტული ზომა',
              sku: `BEPA-${categorySlug.slice(0, 3).toUpperCase()}-${productIndex + 1}-STD`,
              priceDelta: 0,
              stock: 10 + productIndex,
            },
            {
              nameEn: 'Premium fit',
              nameKa: 'პრემიუმ ზომა',
              sku: `BEPA-${categorySlug.slice(0, 3).toUpperCase()}-${productIndex + 1}-PRM`,
              priceDelta: Math.round(price * 0.18),
              stock: 7 + productIndex,
            },
          ]
        : [],
    }
  })
)

const newsPosts: NewsSeed[] = [
  {
    title: 'How to Prepare Your Car for Summer Road Trips',
    slug: 'prepare-car-for-summer-road-trips',
    excerpt: 'A practical checklist covering lighting, fluids, filters, tire checks, and emergency gear.',
    content: 'Summer trips are easier when maintenance is handled early.\nCheck coolant, oil level, lights, wipers, and brake feel before the first long drive.\nKeep a compact emergency kit in the trunk and confirm that your battery is charging correctly.',
  },
  {
    title: 'New AGM Battery Range Arrives in Tbilisi',
    slug: 'new-agm-battery-range-tbilisi',
    excerpt: 'BEPA adds high-reserve AGM batteries for vehicles with start-stop systems and extra electronics.',
    content: 'The new AGM range is designed for vehicles with higher electrical loads.\nEach battery is tested before dispatch and paired with guidance for fitment and charging.',
  },
  {
    title: 'Brake Service Signs Drivers Should Not Ignore',
    slug: 'brake-service-signs-drivers-should-not-ignore',
    excerpt: 'Noise, vibration, warning lights, and longer stopping distances are all reasons to book service.',
    content: 'Brake symptoms often start small.\nA pulsing pedal, squeal, grinding noise, or dashboard warning should be checked quickly to avoid rotor damage and unsafe braking.',
  },
  {
    title: 'Choosing the Right Cabin Filter for City Driving',
    slug: 'choosing-right-cabin-filter-city-driving',
    excerpt: 'A comparison of standard, carbon, and premium cabin filters for dusty urban conditions.',
    content: 'Cabin filters protect interior air quality.\nCarbon filters help with odors, while dense premium filters can be useful in dusty city routes and heavy traffic.',
  },
  {
    title: 'Why Server-Checked Stock Matters at Checkout',
    slug: 'why-server-checked-stock-matters-at-checkout',
    excerpt: 'Cart prices and stock can change, so checkout revalidates every product before order creation.',
    content: 'A local cart is only a shopping aid.\nThe final order must use database prices, verify stock, and reject stale product identifiers before saving anything.',
  },
  {
    title: 'BEPA Expands Wiper and Exterior Care Selection',
    slug: 'bepa-expands-wiper-exterior-care-selection',
    excerpt: 'New wiper blades, washer fluids, and trim-care kits are now available from seeded catalog data.',
    content: 'Visibility depends on small parts that are easy to overlook.\nThe expanded exterior selection focuses on wet-weather driving, trim care, and simple seasonal replacement.',
  },
  {
    title: 'Tool Kits for Home Garage Maintenance',
    slug: 'tool-kits-for-home-garage-maintenance',
    excerpt: 'Socket sets, battery testers, jacks, and wash tools for common maintenance tasks.',
    content: 'A basic home garage kit should be compact but dependable.\nStart with safe lifting tools, sockets, a battery tester, gloves, lighting, and cleaning supplies.',
  },
  {
    title: 'Lighting Upgrades and Safe Night Driving',
    slug: 'lighting-upgrades-safe-night-driving',
    excerpt: 'Better bulbs help, but aim, lens clarity, and matching fitment matter just as much.',
    content: 'Lighting upgrades work best when the whole system is healthy.\nClean lenses, correct aiming, and proper bulb fitment all help reduce glare and improve visibility.',
  },
]

const seedUsers = [
  { email: 'mariam.seed@bepa.example', fullName: 'Mariam Kapanadze' },
  { email: 'giorgi.seed@bepa.example', fullName: 'Giorgi Lomidze' },
  { email: 'nino.seed@bepa.example', fullName: 'Nino Beridze' },
  { email: 'levan.seed@bepa.example', fullName: 'Levan Maisuradze' },
]

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
const crcTable = new Uint32Array(256)

for (let n = 0; n < 256; n += 1) {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  crcTable[n] = c >>> 0
}

function crc32(buffer: Buffer) {
  let c = 0xffffffff
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function seededNumber(input: string) {
  return createHash('sha256').update(input).digest().readUInt32BE(0)
}

function makeSeedPng(seed: string, width = 640, height = 480) {
  const seedValue = seededNumber(seed)
  const baseR = 40 + (seedValue % 120)
  const baseG = 60 + ((seedValue >>> 8) % 120)
  const baseB = 90 + ((seedValue >>> 16) % 120)
  const raw = Buffer.alloc((width * 4 + 1) * height)

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1)
    raw[rowStart] = 0

    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4
      const horizontal = x / width
      const vertical = y / height
      const stripe = Math.sin((horizontal * 10 + vertical * 4 + (seedValue % 11)) * Math.PI) * 18
      const inShelf = y > height * 0.58 && y < height * 0.75 && x > width * 0.14 && x < width * 0.86
      const inPart = Math.abs(x - width * 0.5) < width * 0.24 && Math.abs(y - height * 0.48) < height * 0.16
      const inBadge = (x - width * 0.76) ** 2 + (y - height * 0.25) ** 2 < (width * 0.09) ** 2
      const highlight = inPart ? 78 : inShelf ? 46 : inBadge ? 95 : 0

      raw[offset] = Math.min(255, baseR + horizontal * 70 + stripe + highlight)
      raw[offset + 1] = Math.min(255, baseG + vertical * 55 + highlight)
      raw[offset + 2] = Math.min(255, baseB + (1 - horizontal) * 60 + stripe / 2 + highlight)
      raw[offset + 3] = 255
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    pngSignature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

async function ensureStorageBucket() {
  const { error: getError } = await supabase.storage.getBucket(storageBucket)

  if (!getError) return

  const { error: createError } = await supabase.storage.createBucket(storageBucket, {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    fileSizeLimit: 5 * 1024 * 1024,
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(`Storage bucket setup failed: ${createError.message}`)
  }
}

async function uploadSeedImage(path: string, seed: string) {
  const imageBytes = makeSeedPng(seed)

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await supabase.storage.from(storageBucket).upload(path, imageBytes, {
      contentType: 'image/png',
      upsert: true,
      cacheControl: '3600',
    })

    if (!error) {
      const { data } = supabase.storage.from(storageBucket).getPublicUrl(path)
      return data.publicUrl
    }

    if (attempt === 3) {
      throw new Error(`Storage upload failed for ${path}: ${error.message}`)
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 750))
  }

  throw new Error(`Storage upload failed for ${path}`)
}

function requireData<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }

  if (data === null) {
    throw new Error(`${context}: no data returned`)
  }

  return data
}

async function countRows(table: string, filters: Record<string, string | number | boolean> = {}) {
  let query = supabase.from(table).select('id', { count: 'exact', head: true })
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }
  const { count, error } = await query
  if (error) throw new Error(`Count failed for ${table}: ${error.message}`)
  return count ?? 0
}

async function ensureSeedUsers() {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) {
    throw new Error(`Unable to list seed auth users: ${error.message}`)
  }

  const usersByEmail = new Map(data.users.map((user) => [user.email ?? '', user]))
  const profileIds: string[] = []

  for (const seedUser of seedUsers) {
    const existing = usersByEmail.get(seedUser.email)
    const userId = existing?.id ?? (await supabase.auth.admin.createUser({
      email: seedUser.email,
      email_confirm: true,
      password: `${randomUUID()}Aa1!`,
      user_metadata: { full_name: seedUser.fullName },
    })).data.user?.id

    if (!userId) {
      throw new Error(`Unable to create seed auth user for ${seedUser.email}`)
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: seedUser.email,
          full_name: seedUser.fullName,
          role: 'user',
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      throw new Error(`Unable to upsert seed profile: ${profileError.message}`)
    }

    profileIds.push(userId)
  }

  return profileIds
}

async function seedCategories() {
  const categoryBySlug = new Map<string, SavedCategory>()

  for (const category of categories) {
    const imageUrl = await uploadSeedImage(`seed/categories/${category.slug}.png`, category.slug)
    const { data, error } = await supabase
      .from('categories')
      .upsert(
        {
          name_en: category.nameEn,
          name_ka: category.nameKa,
          slug: category.slug,
          description_en: category.descriptionEn,
          description_ka: category.descriptionKa,
          image_url: imageUrl,
          is_active: true,
          sort_order: category.sortOrder,
        },
        { onConflict: 'slug' }
      )
      .select('id, slug')
      .single()

    const saved = requireData<SavedCategory>(data, error, `Unable to upsert category ${category.slug}`)
    categoryBySlug.set(saved.slug, saved)
  }

  return categoryBySlug
}

async function seedProducts(categoryBySlug: Map<string, SavedCategory>) {
  const savedProducts: SavedProduct[] = []

  for (const [index, product] of products.entries()) {
    const category = categoryBySlug.get(product.categorySlug)
    if (!category) {
      throw new Error(`Missing category for ${product.slug}`)
    }

    const { data, error } = await supabase
      .from('products')
      .upsert(
        {
          category_id: category.id,
          name_en: product.nameEn,
          name_ka: product.nameKa,
          slug: product.slug,
          description_en: product.descriptionEn,
          description_ka: product.descriptionKa,
          price: product.price,
          sale_price: product.salePrice ?? null,
          sku: product.sku,
          stock: product.stock,
          is_active: true,
          is_featured: product.isFeatured,
        },
        { onConflict: 'slug' }
      )
      .select('id, slug, price, sale_price')
      .single()

    const saved = requireData<{ id: string; slug: string; price: number | string; sale_price: number | string | null }>(
      data,
      error,
      `Unable to upsert product ${product.slug}`
    )

    const { error: imageDeleteError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', saved.id)
    if (imageDeleteError) throw new Error(`Unable to clear product images: ${imageDeleteError.message}`)

    const { error: variantDeleteError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', saved.id)
    if (variantDeleteError) throw new Error(`Unable to clear product variants: ${variantDeleteError.message}`)

    const imageRows = []
    const imageCount = 1 + (index % 3)
    for (let imageIndex = 0; imageIndex < imageCount; imageIndex += 1) {
      const imageUrl = await uploadSeedImage(
        `seed/products/${product.slug}-${imageIndex + 1}.png`,
        `${product.slug}-${imageIndex}`
      )
      imageRows.push({
        product_id: saved.id,
        url: imageUrl,
        alt_text: `${product.nameEn} image ${imageIndex + 1}`,
        is_primary: imageIndex === 0,
        sort_order: imageIndex,
      })
    }

    const { error: imageInsertError } = await supabase.from('product_images').insert(imageRows)
    if (imageInsertError) throw new Error(`Unable to create product images: ${imageInsertError.message}`)

    if (product.variants?.length) {
      const { error: variantInsertError } = await supabase.from('product_variants').insert(
        product.variants.map((variant) => ({
          product_id: saved.id,
          name_en: variant.nameEn,
          name_ka: variant.nameKa,
          sku: variant.sku,
          price: product.price + variant.priceDelta,
          stock: variant.stock,
          is_active: true,
        }))
      )
      if (variantInsertError) throw new Error(`Unable to create product variants: ${variantInsertError.message}`)
    }

    savedProducts.push({
      id: saved.id,
      slug: saved.slug,
      price: Number(saved.price),
      salePrice: saved.sale_price === null ? null : Number(saved.sale_price),
    })
  }

  return savedProducts
}

async function seedNews() {
  for (const post of newsPosts) {
    const imageUrl = await uploadSeedImage(`seed/news/${post.slug}.png`, post.slug)
    const { error } = await supabase
      .from('news')
      .upsert(
        {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          image_url: imageUrl,
          is_published: true,
        },
        { onConflict: 'slug' }
      )

    if (error) throw new Error(`Unable to upsert news ${post.slug}: ${error.message}`)
  }
}

async function seedReviews(profileIds: string[], savedProducts: SavedProduct[]) {
  const productIds = savedProducts.map((product) => product.id)
  const { error: deleteError } = await supabase
    .from('reviews')
    .delete()
    .in('user_id', profileIds)
    .in('product_id', productIds)

  if (deleteError) throw new Error(`Unable to clear seed reviews: ${deleteError.message}`)

  const comments = [
    'Fitment was clear and the part arrived ready for installation.',
    'Good value for regular maintenance and the product image matched the item.',
    'Support confirmed compatibility before dispatch.',
    'QA comment with harmless text <script>alert(1)</script> rendered as text.',
  ]

  const reviewRows = savedProducts.slice(0, 20).flatMap((product, index) => [
    {
      product_id: product.id,
      user_id: profileIds[index % profileIds.length],
      rating: 5 - (index % 2),
      comment: comments[index % comments.length],
      is_approved: true,
    },
    {
      product_id: product.id,
      user_id: profileIds[(index + 1) % profileIds.length],
      rating: 4,
      comment: comments[(index + 2) % comments.length],
      is_approved: true,
    },
  ])

  const { error } = await supabase.from('reviews').insert(reviewRows)
  if (error) throw new Error(`Unable to create seed reviews: ${error.message}`)
}

async function seedOrders(profileIds: string[], savedProducts: SavedProduct[]) {
  const { error: deleteError } = await supabase
    .from('orders')
    .delete()
    .like('notes', '[seed]%')

  if (deleteError) throw new Error(`Unable to clear seed orders: ${deleteError.message}`)

  const orderSpecs = [
    { userId: profileIds[0], status: 'confirmed', productIndexes: [0, 7, 14] },
    { userId: profileIds[1], status: 'processing', productIndexes: [2, 11] },
    { userId: profileIds[2], status: 'delivered', productIndexes: [5, 19, 23] },
    { userId: null, status: 'pending', productIndexes: [3, 27] },
  ]

  for (const spec of orderSpecs) {
    const items = spec.productIndexes.map((productIndex, lineIndex) => {
      const product = savedProducts[productIndex % savedProducts.length]
      return {
        product_id: product.id,
        quantity: lineIndex + 1,
        price: product.salePrice ?? product.price,
      }
    })
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: spec.userId,
        status: spec.status,
        total,
        shipping_address: {
          firstName: spec.userId ? 'Seed' : 'Guest',
          lastName: 'Customer',
          email: 'orders.seed@bepa.example',
          phone: '+995 555 123 456',
          address: '12 Seed Avenue',
          city: 'Tbilisi',
        },
        notes: `[seed] ${spec.status} fake order for local development`,
      })
      .select('id')
      .single()

    const savedOrder = requireData<{ id: string }>(order, orderError, 'Unable to create seed order')

    const { error: itemError } = await supabase.from('order_items').insert(
      items.map((item) => ({
        order_id: savedOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }))
    )

    if (itemError) throw new Error(`Unable to create seed order items: ${itemError.message}`)
  }
}

async function main() {
  console.log('Seed: ensuring storage bucket')
  await ensureStorageBucket()
  console.log('Seed: ensuring auth profiles')
  const profileIds = await ensureSeedUsers()
  console.log('Seed: upserting categories')
  const categoryBySlug = await seedCategories()
  console.log('Seed: upserting products, images, and variants')
  const savedProducts = await seedProducts(categoryBySlug)
  console.log('Seed: upserting news')
  await seedNews()
  console.log('Seed: recreating reviews')
  await seedReviews(profileIds, savedProducts)
  console.log('Seed: recreating orders')
  await seedOrders(profileIds, savedProducts)

  console.log('Seed: counting rows')
  const [
    categoryCount,
    productCount,
    imageCount,
    variantCount,
    newsCount,
    reviewCount,
    orderCount,
  ] = await Promise.all([
    countRows('categories'),
    countRows('products'),
    countRows('product_images'),
    countRows('product_variants'),
    countRows('news', { is_published: true }),
    countRows('reviews', { is_approved: true }),
    countRows('orders'),
  ])

  console.log(
    `Seed complete: ${categoryCount} categories, ${productCount} products, ${imageCount} images, ${variantCount} variants, ${newsCount} published news posts, ${reviewCount} approved reviews, ${orderCount} orders.`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
