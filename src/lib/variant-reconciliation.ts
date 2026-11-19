import type { Prisma } from '@prisma/client'
import type { ProductVariantInput } from './validations'

/**
 * Preserve variant primary keys referenced by order history. Replacing all
 * variants by deleteMany() previously detached order_items.variant_id, making
 * reliable cancellation restocking impossible.
 *
 * Admin authorization and Zod validation must happen before calling this helper.
 */
export async function reconcileProductVariants(
  tx: Prisma.TransactionClient,
  productId: string,
  incoming: ProductVariantInput[],
): Promise<void> {
  const identifiers = new Set<string>()
  for (const variant of incoming) {
    const sku = variant.sku?.trim() || null
    const key = sku ? 'sku:' + sku : 'name:' + variant.nameEn.trim().toLowerCase()
    if (identifiers.has(key)) throw new Error('Duplicate product variant identifier')
    identifiers.add(key)
  }

  // Serialize concurrent administrator edits to this product.
  const locked = await tx.product.updateMany({
    where: { id: productId },
    data: { updatedAt: new Date() },
  })
  if (locked.count !== 1) throw new Error('Product not found')

  const existing = await tx.productVariant.findMany({ where: { productId } })
  const retained = new Set<string>()

  for (const variant of incoming) {
    const sku = variant.sku?.trim() || null
    // Prefer stable SKUs; name fallback supports preexisting records without SKU.
    const match = existing.find((candidate) => !retained.has(candidate.id) &&
      (sku && candidate.sku === sku ||
        candidate.nameEn.trim().toLowerCase() === variant.nameEn.trim().toLowerCase())
    )
    const data = {
      nameEn: variant.nameEn, nameKa: variant.nameKa,
      sku, price: variant.price, stock: variant.stock, isActive: variant.isActive,
    }
    if (match) {
      await tx.productVariant.update({where:{id:match.id},data})
      retained.add(match.id)
    } else {
      const created = await tx.productVariant.create({data:{productId,...data}})
      retained.add(created.id)
    }
  }

  for (const old of existing) {
    if (retained.has(old.id)) continue
    const historicalUses = await tx.orderItem.count({where:{variantId:old.id}})
    if (historicalUses > 0) {
      // Inactive variants remain for order history and cancellation restocks.
      await tx.productVariant.update({where:{id:old.id},data:{isActive:false}})
    } else {
      await tx.productVariant.delete({where:{id:old.id}})
    }
  }
}
