# Variant history preservation

Before this change, the administrative `syncProductVariants` action used `deleteMany` followed by `createMany`, deleting order-linked variant identifiers. Because `order_items.variant_id` uses `ON DELETE SET NULL`, a later cancellation could no longer restore the original variant's inventory.

The `reconcileProductVariants` transactional helper now updates existing variants by SKU (falling back to a name match for older records), inserts new ones, deletes unused removed variants, and **deactivates** removed variants that are referenced in order history. Product row locking serializes concurrent admin edits. Historical variants stay non-purchasable yet available for restock by the authoritative cancellation service.

The admin input contract is unchanged. Renaming both SKU and name at once cannot be inferred as the same variant; in that case an ordered old variant is preserved inactive and a new variant is created. The returned ordering of retained variants is unchanged.

Real PostgreSQL integration tests are in `tests/integration/variants.test.ts`; they have not been independently executed until CI has runner capacity.

## Stable identity against SKU-name collisions

Incoming variants with an explicit SKU now match existing variants only by that same SKU, or by a *legacy no-SKU* name when an unambiguous migration is possible. An old variant with a different non-empty SKU is never reidentified solely because its display name matches. Ambiguous old rows fail closed. The synthetic PostgreSQL integration suite includes an order-linked SKU-change case that protects cancellation restock from silently moving to a newly created SKU.
