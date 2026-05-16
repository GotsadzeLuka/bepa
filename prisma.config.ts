// Prisma configuration for BEPA e-commerce
// Uses environment variables for database connection
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local (Next.js convention) instead of .env
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Pooled connection for runtime queries (better performance)
    url: process.env["DATABASE_URL"],
    // Direct connection for migrations (bypasses pgbouncer)
    directUrl: process.env["DIRECT_URL"],
  },
});
