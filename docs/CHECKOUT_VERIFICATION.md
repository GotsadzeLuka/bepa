# Checkout and order lifecycle

- **Server pricing.** The transaction reads active catalog records, validates product-to-variant ownership, and calculates totals using decimal arithmetic before it creates order lines.
- **Retries.** A transaction-scoped PostgreSQL lock serializes one attempt ID. Guest callers present a separate random token. The attempt UUID is derived from that token with SHA-256, and only the UUID is persisted. Replays also match the buyer, cart and shipping payload. A retry from the same form can return the original order after its final item sells.
- **Stock and cancellation.** Checkout and cancellation lock parent product rows in a consistent order. Cancellation compares the current order state before restocking. Retired variants referenced by orders keep their IDs.
- **Scope.** BEPA records an order for offline confirmation. The browser keeps its attempt token while the checkout page is open. An open guest form loaded before this change needs a fresh checkout attempt after deployment.

The [PostgreSQL suite](../tests/integration/checkout.test.ts) calls the same checkout and fulfillment services as the application. [Run the suite locally](POSTGRESQL_TESTING.md).
