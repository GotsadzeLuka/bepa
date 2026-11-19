# BEPA security boundary and deployment checklist

## Database access

The Supabase browser roles `anon` and `authenticated` have read-only access to application tables, with RLS governing visible rows. Server actions use Prisma over a trusted PostgreSQL connection for mutations. Admin server actions also call `requireAdmin()`.

## Required rollout for existing deployments

1. Back up the database and verify application clients do not depend on direct PostgREST writes.
2. Execute the updated `supabase/schema.sql` with an authorized database administrator. Resolve any pre-existing duplicate reviews before applying the new `(user_id, product_id)` unique index. **This explicitly revokes old grants.** Committing this SQL alone does not change live Supabase permissions.
3. From both anonymous and authenticated Supabase clients, verify role elevation, review self-approval and direct order insertion fail. Confirm legitimate user/admin workflows still work through server actions.
4. Run `npm run check` and validate Google OAuth redirects, admin storage uploads, profile updates, checkout, and wishlist writes in staging.
5. Inspect Git history for secrets; rotate credentials if any were exposed. Deploy the database policy before promoting the application change.

## Further verification required

- Real database integration tests for RLS, permission grants and concurrent inventory updates
- Integration verification of idempotency and cancellation/restocking under concurrent requests; API abuse controls
- End-to-end image decoding and Storage bucket permission verification
- Dependency auditing, production monitoring, performance tests and backup restore drills

Checkout creates orders for offline confirmation; online card payment processing is not implemented.

## Read-only permission audit

With the database configured, run `npm run db:permissions`. This checks whether either Supabase browser-facing role retains table-level `INSERT`, `UPDATE` or `DELETE` privileges. It does not itself test RLS policy decisions or write to data.


## Data API write boundary (2026-11 hardening)

The browser Data API receives `SELECT` privileges subject to RLS, but not `INSERT`, `UPDATE`, or `DELETE` on business tables. The bootstrap schema removes legacy permissive insert/update RLS policies for profiles, checkout orders, order lines, and reviews so a future accidental privilege grant cannot immediately enable unsafe mutation paths. All catalog/checkout/review/profile writes must pass through server actions, their Zod validation, and the server's authorization logic. In particular, a user must never be able to set `profiles.role=admin` or `reviews.is_approved=true` through an ordinary authenticated Data API request.

Existing production installations need a reviewed migration to apply the updated policies and privileges; this PR does not execute SQL against a deployed Supabase project.
