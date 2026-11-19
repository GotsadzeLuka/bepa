# BEPA — Commerce storefront and order management

**Role showcased:** Full-stack / backend-focused TypeScript engineer

**Problem:** Auto-parts shops need searchable catalog pages, variants and inventory, customer accounts, and a way to accept and manage delivery orders.

**Solution:** Next.js and PostgreSQL application with bilingual English/Georgian catalog data, role-based administration, Google OAuth via Supabase Auth, checkout validation, and order fulfillment tools.

## Technical contributions worth highlighting

1. Built a full-stack catalog with admin product/category/news management.
2. Designed a Prisma/PostgreSQL data model for products, variants, orders, reviews and accounts.
3. Protected business mutations with server-side authentication, schema validation and database authorization boundaries.
4. Prevented price tampering by recalculating totals from database prices; safeguarded stock decrement with conditional updates inside transactions.
5. Added durable checkout request IDs to make network retries idempotent.
6. Added testable order status rules and one-time stock restoration on pre-shipment cancellation.
7. Added automated regression tests, reproducible setup docs, and GitHub Actions CI configuration.

## What to show a potential client

- A short screencast demonstrating catalog -> cart -> submitted order -> admin workflow
- Screenshots of catalog filtering, product details, and the admin dashboard
- A diagram explaining authentication, order transactions, and inventory rules
- Code samples and test cases demonstrating security-conscious backend decisions

## Important scope disclosures

This repository is **not a payment processor**; orders are submitted for offline confirmation. Cloud infrastructure may be intentionally offline. No active-production uptime, traffic or paid transaction metrics are claimed. Deployed database policy verification remains necessary before real customer use.

For technical implementation, see [architecture](ARCHITECTURE.md) and [security](SECURITY.md).
