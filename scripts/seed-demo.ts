import prisma from '../src/lib/db'
import { requireIsolatedDatabase } from './isolated-database'

async function main() {
  requireIsolatedDatabase()
  const category = await prisma.category.upsert({
    where: { slug: 'demo-accessories' },
    update: {},
    create: { slug: 'demo-accessories', nameEn: 'Accessories', nameKa: 'აქსესუარები' },
  })
  await prisma.product.upsert({
    where: { slug: 'demo-tire-gauge' },
    update: {},
    create: {
      categoryId: category.id,
      slug: 'demo-tire-gauge',
      nameEn: 'Tire pressure gauge',
      nameKa: 'საბურავის წნევის საზომი',
      descriptionEn: 'Synthetic catalog item for local checkout testing.',
      descriptionKa: 'ადგილობრივი ტესტისთვის შექმნილი პროდუქტი.',
      price: '14.90',
      stock: 12,
      isFeatured: true,
    },
  })
  console.log('Added a synthetic category and checkout item.')
}

main().catch(() => {
  console.error('Could not seed the disposable database.')
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
