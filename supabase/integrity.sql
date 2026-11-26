-- Applied to a disposable test schema or to an operator-reviewed Supabase DB.
-- Never silently clean or alter existing bad production records.
-- Constraints are idempotent and fail if preexisting rows violate them.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.products'::regclass AND conname = 'products_stock_nonnegative') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.products'::regclass AND conname = 'products_positive_price') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_positive_price CHECK (price > 0 AND (sale_price IS NULL OR (sale_price > 0 AND sale_price < price)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.product_variants'::regclass AND conname = 'variants_stock_nonnegative') THEN
    ALTER TABLE public.product_variants ADD CONSTRAINT variants_stock_nonnegative CHECK (stock >= 0 AND price > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.orders'::regclass AND conname = 'orders_total_nonnegative') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_total_nonnegative CHECK (total >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.order_items'::regclass AND conname = 'order_items_positive_quantity') THEN
    ALTER TABLE public.order_items ADD CONSTRAINT order_items_positive_quantity CHECK (quantity > 0 AND price > 0);
  END IF;
END $$;
