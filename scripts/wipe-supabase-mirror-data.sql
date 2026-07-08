-- =============================================================================
-- ShelfPOS — production reset: wipe all mirrored POS data from Supabase
-- =============================================================================
--
-- Use when moving from alpha/testing to a clean production cloud mirror.
-- Schema, RLS, RPCs, and auth.users are kept; all tenant/mirror rows are removed.
--
-- SQL Editor role (top-right): **postgres** (or "Run as service role").
-- authenticated / anon → DELETE/TRUNCATE affects 0 rows (RLS).
--
-- BEFORE running (every register / test machine):
--   1. Confirm this is the **production** Supabase project (URL matches Vercel + sync.env).
--   2. Apply latest schema if needed: DASHBOARD/SUPA.sql (idempotent).
--   3. Close ShelfPOS on all PCs.
--   4. Stop ShelfPOSSync on all PCs (services.msc → ShelfPOSSync → Stop).
--      If sync keeps running, data will re-upsert from local shelf.db.
--   5. Optional on test PCs only: delete %APPDATA%\shelfpos\shelf.db and re-run Setup.
--
-- KEEPS: auth.users (dashboard logins), schema, indexes, RLS, RPCs, operator superadmin
-- DELETES: all mirror rows, stores registry, store_access, store_pairings (billing flags too)
--
-- AFTER running:
--   1. Verify AFTER counts below are all 0.
--   2. Optionally remove test owner accounts (see OPTIONAL block at bottom).
--   3. Prod owners sign up / log in on production dashboard URL.
--   4. Each shop: /link-pos → new pairing code → Install-ShelfPOS or POS /sync-setup.
--   5. Do NOT run sync backfill unless you intentionally want to push old local SQLite → cloud.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Row counts BEFORE (save this result)
-- -----------------------------------------------------------------------------
SELECT 'BEFORE' AS phase, tbl, rows
FROM (
  SELECT 'return_items'      AS tbl, COUNT(*)::bigint AS rows FROM public.return_items
  UNION ALL SELECT 'sale_items',       COUNT(*)::bigint FROM public.sale_items
  UNION ALL SELECT 'sale_payments',    COUNT(*)::bigint FROM public.sale_payments
  UNION ALL SELECT 'sales',            COUNT(*)::bigint FROM public.sales
  UNION ALL SELECT 'cash_movements',   COUNT(*)::bigint FROM public.cash_movements
  UNION ALL SELECT 'cierres',          COUNT(*)::bigint FROM public.cierres
  UNION ALL SELECT 'audit_log',        COUNT(*)::bigint FROM public.audit_log
  UNION ALL SELECT 'stock_adjustments', COUNT(*)::bigint FROM public.stock_adjustments
  UNION ALL SELECT 'pos_users',        COUNT(*)::bigint FROM public.pos_users
  UNION ALL SELECT 'products',         COUNT(*)::bigint FROM public.products
  UNION ALL SELECT 'store_pairings',   COUNT(*)::bigint FROM public.store_pairings
  UNION ALL SELECT 'store_access',     COUNT(*)::bigint FROM public.store_access
  UNION ALL SELECT 'stores',           COUNT(*)::bigint FROM public.stores
) x
ORDER BY tbl;

BEGIN;

SET LOCAL row_security = off;

-- Drop legacy table if an old deployment still has it (SUPA.sql migrates then drops).
DROP TABLE IF EXISTS public.store_claim_codes CASCADE;

TRUNCATE TABLE
  public.return_items,
  public.sale_items,
  public.sale_payments,
  public.sales,
  public.cash_movements,
  public.cierres,
  public.audit_log,
  public.stock_adjustments,
  public.pos_users,
  public.products,
  public.store_pairings,
  public.store_access,
  public.stores
RESTART IDENTITY CASCADE;

COMMIT;

-- -----------------------------------------------------------------------------
-- Row counts AFTER (every tbl must be 0)
-- -----------------------------------------------------------------------------
SELECT 'AFTER' AS phase, tbl, rows
FROM (
  SELECT 'return_items'      AS tbl, COUNT(*)::bigint AS rows FROM public.return_items
  UNION ALL SELECT 'sale_items',       COUNT(*)::bigint FROM public.sale_items
  UNION ALL SELECT 'sale_payments',    COUNT(*)::bigint FROM public.sale_payments
  UNION ALL SELECT 'sales',            COUNT(*)::bigint FROM public.sales
  UNION ALL SELECT 'cash_movements',   COUNT(*)::bigint FROM public.cash_movements
  UNION ALL SELECT 'cierres',          COUNT(*)::bigint FROM public.cierres
  UNION ALL SELECT 'audit_log',        COUNT(*)::bigint FROM public.audit_log
  UNION ALL SELECT 'stock_adjustments', COUNT(*)::bigint FROM public.stock_adjustments
  UNION ALL SELECT 'pos_users',        COUNT(*)::bigint FROM public.pos_users
  UNION ALL SELECT 'products',         COUNT(*)::bigint FROM public.products
  UNION ALL SELECT 'store_pairings',   COUNT(*)::bigint FROM public.store_pairings
  UNION ALL SELECT 'store_access',     COUNT(*)::bigint FROM public.store_access
  UNION ALL SELECT 'stores',           COUNT(*)::bigint FROM public.stores
) x
ORDER BY tbl;

-- Single OK/FAIL line (expect status = 'OK')
SELECT
  CASE WHEN SUM(rows) = 0 THEN 'OK — cloud mirror is empty'
       ELSE 'FAIL — rows remain; check SQL Editor role and sync service'
  END AS status,
  SUM(rows)::bigint AS total_rows_remaining
FROM (
  SELECT COUNT(*)::bigint AS rows FROM public.return_items
  UNION ALL SELECT COUNT(*)::bigint FROM public.sale_items
  UNION ALL SELECT COUNT(*)::bigint FROM public.sale_payments
  UNION ALL SELECT COUNT(*)::bigint FROM public.sales
  UNION ALL SELECT COUNT(*)::bigint FROM public.cash_movements
  UNION ALL SELECT COUNT(*)::bigint FROM public.cierres
  UNION ALL SELECT COUNT(*)::bigint FROM public.audit_log
  UNION ALL SELECT COUNT(*)::bigint FROM public.stock_adjustments
  UNION ALL SELECT COUNT(*)::bigint FROM public.pos_users
  UNION ALL SELECT COUNT(*)::bigint FROM public.products
  UNION ALL SELECT COUNT(*)::bigint FROM public.store_pairings
  UNION ALL SELECT COUNT(*)::bigint FROM public.store_access
  UNION ALL SELECT COUNT(*)::bigint FROM public.stores
) counts;

-- =============================================================================
-- Troubleshooting
-- =============================================================================
-- | Symptom                         | Fix                                              |
-- |---------------------------------|--------------------------------------------------|
-- | AFTER still shows rows          | SQL Editor role → postgres; stop ShelfPOSSync    |
-- | Data returns after wipe         | Sync still running; wipe local shelf.db or reset |
-- | POS linked, dashboard empty     | Re-pair: new code on /link-pos → /sync-setup     |
-- | Wrong project                   | Dashboard VITE_SUPABASE_URL ≠ sync SUPABASE_URL    |
-- | Stale sync_owner_claimed=1      | POS Admin → sync setup after new pairing code    |
--
-- =============================================================================
-- OPTIONAL — remove test dashboard accounts (keeps superadmin operator)
-- Uncomment ONLY if you want auth.users empty except platform operators.
-- Re-invite prod owners after this (operator portal or /create-account).
-- =============================================================================
/*
BEGIN;
SET LOCAL row_security = off;

DELETE FROM auth.users
WHERE COALESCE(raw_app_meta_data->>'role', '') <> 'superadmin';

COMMIT;

SELECT COUNT(*) AS auth_users_remaining FROM auth.users;
*/

-- =============================================================================
-- OPTIONAL — wipe one store only (leave other tenants untouched)
-- Comment out the TRUNCATE block above and use this instead.
-- =============================================================================
/*
BEGIN;
SET LOCAL row_security = off;

DELETE FROM public.return_items          WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.sale_items            WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.sale_payments         WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.sales                 WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.cash_movements        WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.cierres               WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.audit_log             WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.stock_adjustments     WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.pos_users             WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.products              WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.store_pairings        WHERE linked_store_id = 'store_REPLACE_ME';
DELETE FROM public.store_access          WHERE store_id = 'store_REPLACE_ME';
DELETE FROM public.stores                WHERE store_id = 'store_REPLACE_ME';

COMMIT;
*/
