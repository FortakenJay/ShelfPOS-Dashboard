-- =============================================================================
-- OPTIONAL one-off data cleanup — do NOT include in routine SUPA.sql apply.
-- Run manually after bad eFactura/CSV stock imports.
-- =============================================================================

UPDATE public.products
SET stock = 0
WHERE stock > 10000000;

-- Bad CSV imports can write barcode-sized values into stock_adjustments.delta.
UPDATE public.stock_adjustments
SET delta = 0
WHERE delta > 2147483647 OR delta < -2147483647 OR ABS(delta) > 10000000;
