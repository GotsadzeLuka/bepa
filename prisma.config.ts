import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'
import { requireIsolatedDatabase } from './scripts/isolated-database'

const isolated = process.env.BEPA_ISOLATED_TEST === '1'
if (!isolated) {
  config({ path: '.env' })
  config({ path: '.env.local', override: true })
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: isolated ? requireIsolatedDatabase() : process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
  migrations: {
    path: 'prisma/migrations',
  },
})
