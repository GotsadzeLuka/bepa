# BEPA Storefront

BEPA is a Next.js auto-parts storefront with a database-backed catalog, cart, server-validated order placement (without online card payments), account pages, and a Supabase-backed admin area for products, categories, orders, and news.

## Portfolio highlights

- **Real commercial workflows:** bilingual catalog, variants, cart, guest checkout, customer accounts, admin inventory and news.
- **Backend reliability:** atomic stock decrements, decimal pricing, idempotent order requests, and transactional cancellation/restocking.
- **Security:** Supabase authentication, server-checked admin roles, Zod input validation, read-only browser database grants, and validated media uploads.
- **Quality:** offline regression tests, type checks, security checks and a GitHub Actions quality workflow.

**Scope:** Orders are placed for offline confirmation; no online payment integration is claimed. The original Vercel/Supabase infrastructure may be intentionally offline. Tests and GitHub documentation are provided independently of hosted services.

[Architecture and tradeoffs](docs/ARCHITECTURE.md) · [Security and rollout](docs/SECURITY.md) · [Portfolio case study](docs/PORTFOLIO_CASE_STUDY.md)


## Review the checkout

The [checkout service](src/lib/checkout.ts) reads catalog prices, reserves inventory, and creates order lines in one PostgreSQL transaction. A per-attempt database lock makes simultaneous retries return one order. Guest retries prove possession of a random token whose derived UUID is stored as the attempt ID. The [fulfillment service](src/lib/order-fulfillment.ts) restores inventory on cancellation, and [variant reconciliation](src/lib/variant-reconciliation.ts) retains the variant IDs that earlier orders reference.

- **Try it locally** with a synthetic catalog and guest checkout. See the [PostgreSQL setup and tests](docs/POSTGRESQL_TESTING.md).
- **Inspect the evidence** in the [checkout integration suite](tests/integration/checkout.test.ts) and [database access tests](tests/integration/rls.test.ts).
- **Review deployment requirements** for Supabase Auth, Storage, database roles and schema changes. See the [security and rollout guide](docs/SECURITY.md).

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS and local shadcn-style UI components
- Supabase Auth, Row Level Security, Storage, and PostgreSQL
- Prisma ORM with the PostgreSQL adapter

## Supabase-backed development

1. Install dependencies (Node.js 22 recommended):

```bash
npm ci
```

2. Create a local environment file and fill in the required values:

```bash
cp .env.example .env.local
```

3. Generate Prisma, push the schema, seed data, and run the app:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Supabase credentials enable Google sign-in, account pages and admin uploads. A disposable local PostgreSQL database supports the public catalog and guest checkout independently.

## Environment Variables

`NEXT_PUBLIC_APP_URL` is the public app URL used for local and deployed links.

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configure browser-safe Supabase access.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It is required for the seed script and admin Storage upload/delete actions and must never be exposed to client components.

`NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` or `SUPABASE_STORAGE_BUCKET` names the public bucket used for catalog, category, news, and admin images. The default is `BePa-PublicStorage`.

`DATABASE_URL` is used by the app runtime and seed script. `DIRECT_URL` is used by the schema bootstrap command when set. For Vercel/serverless deployments, use the Supavisor transaction pooler URL on port `6543` with `sslmode=require&uselibpqcompat=true`. For long-running local development, the session pooler on port `5432` also works.

`DATABASE_POOL_MAX` optionally limits the Postgres pool size. Vercel defaults to `1` to avoid exhausting small Supabase pooler limits.

`BEPA_STOREFRONT_MODE=database` makes storefront database read failures throw instead of returning empty results.

## Database And Storage

The Supabase SQL bootstrap is in `supabase/schema.sql`. `npm run db:push` applies that SQL directly because the database intentionally references Supabase-managed `auth.users`; Prisma Client is still generated from `prisma/schema.prisma` and used for application queries.

The storefront reads active categories/products, product images, variants, published news, and approved reviews from Postgres through Prisma. Header and footer navigation categories are fetched server-side and passed into client components.

Create one public Supabase Storage bucket matching `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`. The seed script uploads generated PNG images under:

- `seed/products/`
- `seed/categories/`
- `seed/news/`

Admin uploads are generated server-side under `admin/products/`, `admin/categories/`, and `admin/news/`. Uploaded files are checked for JPEG, PNG, WebP or AVIF magic bytes, must have an allowlisted MIME type, and are limited to 5 MiB.

Useful commands:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run db:counts
npm run security:check
npm test
npm run check
npm run db:studio
```

## Security Notes

- Storefront DB access uses Prisma query builders, not unsafe raw SQL.
- User/admin input is validated with Zod before writes.
- Checkout rejects stale non-UUID cart IDs, re-fetches prices and stock server-side, verifies variant ownership, and decrements stock in a transaction.
- Admin product, category, and news mutations are server actions guarded by `requireAdmin()`.
- Rendering uses React text nodes; rich HTML rendering is not used.
- Security headers, including CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, are set in the proxy.
- Supabase browser API is read-only for application tables, while Prisma-backed server actions handle mutations. Existing deployments must reapply the SQL schema to revoke previously granted write privileges. See `docs/SECURITY.md`.

## Quality Checks

```bash
npm run check
```

The build script runs `prisma generate` before `next build`. For a configured PostgreSQL environment, run `npm run db:permissions` to verify anonymous and authenticated users cannot perform direct table writes.

**CI verification:** Workflow status must be checked on GitHub. A workflow failure before any job steps is not evidence of a passing or failing test suite.
