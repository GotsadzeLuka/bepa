# BEPA Storefront

BEPA is a Next.js auto-parts storefront with a database-backed catalog, cart, real checkout, account pages, and a Supabase-backed admin area for products, categories, orders, and news.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS and local shadcn-style UI components
- Supabase Auth, Row Level Security, Storage, and PostgreSQL
- Prisma ORM with the PostgreSQL adapter

## Local Setup

1. Install dependencies:

```bash
npm install
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

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

`NEXT_PUBLIC_APP_URL` is the public app URL used for local and deployed links.

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configure browser-safe Supabase access.

`SUPABASE_SERVICE_ROLE_KEY` is server-only. It is required for the seed script and admin Storage upload/delete actions and must never be exposed to client components.

`NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` or `SUPABASE_STORAGE_BUCKET` names the public bucket used for catalog, category, news, and admin images. The default is `BePa-PublicStorage`.

`DATABASE_URL` is used by the app runtime and seed script. `DIRECT_URL` is used by the schema bootstrap command when set. For Supabase projects on IPv4-only networks, use the Supavisor session pooler URL on port `5432` for these values.

`BEPA_STOREFRONT_MODE=database` makes storefront database read failures throw instead of returning empty results. Runtime mock catalog data is not used.

## Database And Storage

The Supabase SQL bootstrap is in `supabase/schema.sql`. `npm run db:push` applies that SQL directly because the database intentionally references Supabase-managed `auth.users`; Prisma Client is still generated from `prisma/schema.prisma` and used for application queries.

The storefront reads active categories/products, product images, variants, published news, and approved reviews from Postgres through Prisma. Header and footer navigation categories are fetched server-side and passed into client components.

Create one public Supabase Storage bucket matching `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`. The seed script uploads generated PNG images under:

- `seed/products/`
- `seed/categories/`
- `seed/news/`

Admin uploads are generated server-side under `admin/products/`, `admin/categories/`, and `admin/news/`. Uploaded files are validated server-side as JPEG, PNG, WebP, or AVIF and limited to 5 MB.

Useful commands:

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm run db:counts
npm run security:check
npm run db:studio
```

## Security Notes

- Storefront DB access uses Prisma query builders, not unsafe raw SQL.
- User/admin input is validated with Zod before writes.
- Checkout rejects stale non-UUID cart IDs, re-fetches prices and stock server-side, verifies variant ownership, and decrements stock in a transaction.
- Admin product, category, and news mutations are server actions guarded by `requireAdmin()`.
- Rendering uses React text nodes; rich HTML rendering is not used.
- Security headers, including CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, are set in the proxy.
- Supabase RLS should remain enabled. Public policies should expose active catalog data and published news only; users should manage only their own profiles, wishlist, reviews, and orders; admin policies stay role-gated by `profiles.role = 'admin'`.

## Quality Checks

```bash
npm run lint
npm run build
```

The build script runs `prisma generate` before `next build`.
