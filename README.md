# BEPA Storefront

BEPA is a Next.js auto-parts storefront with a customer catalog, cart, checkout, account pages, and a Supabase-backed admin area for products, categories, orders, and news.

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

2. Create a local environment file:

```bash
cp .env.example .env.local
```

3. Fill in the Supabase and database values in `.env.local`.

4. Generate Prisma client and run the app:

```bash
npm run db:generate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

`NEXT_PUBLIC_APP_URL` is the public app URL used for local and deployed links.

`BEPA_STOREFRONT_MODE` controls catalog behavior:
- `demo`: use bundled demo catalog data.
- `database`: require database-backed catalog data.
- unset: try database first outside development, then fall back to demo data if catalog reads fail.

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` configure browser-safe Supabase access.

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed in client code.

`DATABASE_URL` is used by the app runtime. `DIRECT_URL` is used by Prisma migration and schema commands.

## Database

The Supabase SQL bootstrap is in `supabase/schema.sql`. The Prisma schema in `prisma/schema.prisma` mirrors the same tables and relationships.

Useful commands:

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
```

Create public Supabase Storage buckets named `products`, `categories`, and `news` before using image uploads in the admin area.

## Quality Checks

```bash
npm run lint
npm run build
```

The build script runs `prisma generate` before `next build`.
