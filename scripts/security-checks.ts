import { productFilterSchema, slugSchema, uuidSchema } from '../src/lib/validations'
import { getSafeImageSrc } from '../src/lib/storefront-media'

const checks = [
  {
    name: 'hostile product search remains valid filter text',
    pass: productFilterSchema.safeParse({ search: "' OR 1=1 --", page: 1, limit: 12 }).success,
  },
  {
    name: 'SQL-looking slug is rejected',
    pass: !slugSchema.safeParse('foo;drop-table-products').success,
  },
  {
    name: 'invalid UUID is rejected',
    pass: !uuidSchema.safeParse('not-a-database-id').success,
  },
  {
    name: 'oversized pagination is rejected',
    pass: !productFilterSchema.safeParse({ page: 1, limit: 100000 }).success,
  },
  {
    name: 'javascript image URL is rejected',
    pass: getSafeImageSrc('javascript:alert(1)') === null,
  },
]

const failed = checks.filter((check) => !check.pass)

if (failed.length > 0) {
  for (const check of failed) {
    console.error(`FAILED: ${check.name}`)
  }
  process.exitCode = 1
} else {
  console.log(`Security checks passed (${checks.length}).`)
}
