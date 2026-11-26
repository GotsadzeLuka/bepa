# Run BEPA with disposable PostgreSQL

Use Node.js 22, npm, and PostgreSQL 16. For a fresh local instance, Docker can start the test database:

```sh
docker run --rm --name bepa-test-db -p 127.0.0.1:5432:5432 \
  -e POSTGRES_USER=ci -e POSTGRES_PASSWORD=ci -e POSTGRES_DB=bepa -d postgres:16
docker exec bepa-test-db pg_isready -U ci -d bepa
```

Wait until the database reports that it accepts connections. From a clean checkout:

```sh
npm ci
export NODE_ENV=test BEPA_ISOLATED_TEST=1
export DATABASE_URL='postgresql://ci:ci@127.0.0.1:5432/bepa'
export DIRECT_URL="$DATABASE_URL"
npx prisma db push
npm run db:constraints
npm run db:rls:bootstrap
npm run test:integration
```

The suite exercises the actual checkout and cancellation services with concurrent transactions. The role tests apply the checked-in grants and policies to PostgreSQL using a small local model of Supabase's auth roles. Google OAuth, Supabase Storage and hosted rollout have separate configuration and acceptance requirements.

## Open the storefront

With the database above still available:

```sh
npm run db:seed:demo
unset NODE_ENV
npm run dev
```

Open [the demo product](http://localhost:3000/product/demo-tire-gauge) and try guest checkout with synthetic contact details. The offline confirmation flow creates an order and reserves stock. Google sign-in and admin media uploads require a configured Supabase project.

## Checks and rollout

```sh
npm run check
npm audit --audit-level=high
```

The [CI workflow](../.github/workflows/ci.yml) runs the quality checks and provisions disposable PostgreSQL separately. Before applying `supabase/schema.sql` and `supabase/integrity.sql` to an existing installation, review the privilege changes and check existing rows against the new constraints.
