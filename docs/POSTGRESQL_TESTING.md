# Reproducible PostgreSQL integration checks

The workflow `.github/workflows/ci.yml` provisions an ephemeral PostgreSQL 16 service for the `integration` job. It never reads the deployed Supabase database.

Local commands (with a disposable PostgreSQL database):
```sh
npm ci
export DATABASE_URL='postgresql://ci:ci@127.0.0.1:5432/bepa'
export DIRECT_URL="$DATABASE_URL"
npx prisma db push
npm run db:constraints
npm run test:integration
```

Use a disposable database only: `prisma db push` is schema synchronization, not a production migration strategy. Tests use synthetic products and user IDs, clean up their fixtures, and must fail loudly without `DATABASE_URL`.

The tests exercise real `reserveInventory` and `transitionOrder` functions, PostgreSQL transaction rollback/uniqueness and constraints, but NOT the full Next.js Server Action and Supabase Auth pathway. Separately validate actions and RLS with a Supabase-compatible isolated environment.

`supabase/integrity.sql` applies additional database CHECK constraints on existing and new rows. It is incorporated in `npm run db:push`, but applying these constraints to a real installation requires an operator-reviewed migration and a preflight audit of historical rows.

Results are **unverified** until an actual Postgres-backed run completes.
