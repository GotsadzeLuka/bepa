# Checkout remediation: scope and evidence

- Guest checkout request UUIDs are not authentication credentials. An existing guest order ID is returned only if the caller provides the matching original shipping address, notes, and cart; authenticated callers additionally require the original account identity.
- The legacy order service status-update method delegates to the transactional state machine, preserving cancellation/restock consistency for callers using this helper.
- These changes are covered by focused source-level regression cases, not by real PostgreSQL concurrency evidence.

## Pending verification gates

Run `npm ci && npm run lint && npm test && npm run typecheck && npm run build`, followed by isolated PostgreSQL integration tests for concurrent checkout, duplicate retries, cancellation races, rollback, review uniqueness, and RLS. Verify all admin action entry points enforce authorization. Hosted CI currently fails before its steps run; this cannot be treated as an application test result.

Do not claim production-ready transactional guarantees until real-database tests and hosted CI have passed.
