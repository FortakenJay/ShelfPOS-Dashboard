-- =============================================================================
-- ShelfPOS Supabase schema (idempotent — safe to re-run in SQL Editor)
--
-- Does NOT truncate mirror data. Safe on existing projects.
--
-- Sections:
--   1. Extensions + tables
--   2. Column patches (upgrades)
--   3. Indexes
--   4. Functions & RPCs
--   5. Row Level Security (explicit ENABLE + policies — source of truth)
--   6. Grants
--   7. Legacy migration (store_claim_codes → store_pairings)
--   8. Cleanup: drop leftover auto-RLS event triggers (ensure_rls /
--      rls_auto_enable_trigger) and rls_auto_enable(). Does not disable
--      table RLS from section 5.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stores (
  store_id text NOT NULL,
  display_name text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  pos_last_seen_at text,
  stock_threshold_default integer NOT NULL DEFAULT 5,
  iva_rate_standard numeric NOT NULL DEFAULT 13,
  billing_email text,
  billing_interval text CHECK (
    billing_interval IS NULL
    OR billing_interval = ANY (ARRAY['weekly'::text, 'monthly'::text, 'annual'::text])
  ),
  next_payment_at timestamptz,
  billing_paid boolean NOT NULL DEFAULT false,
  billing_reminder_week_for date,
  billing_reminder_due_for date,
  CONSTRAINT stores_pkey PRIMARY KEY (store_id)
);

CREATE TABLE IF NOT EXISTS public.store_access (
  user_id uuid NOT NULL,
  store_id text NOT NULL,
  role text NOT NULL DEFAULT 'owner'::text CHECK (role = ANY (ARRAY['owner'::text, 'viewer'::text])),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT store_access_pkey PRIMARY KEY (user_id, store_id),
  CONSTRAINT store_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
  CONSTRAINT store_access_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores (store_id)
);

CREATE TABLE IF NOT EXISTS public.store_pairings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pairing_code text NOT NULL UNIQUE CHECK (pairing_code ~ '^[A-Z0-9]{8}$'::text),
  label text,
  linked_store_id text,
  expires_at timestamptz NOT NULL,
  linked_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT store_pairings_pkey PRIMARY KEY (id),
  CONSTRAINT store_pairings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
  CONSTRAINT store_pairings_linked_store_id_fkey FOREIGN KEY (linked_store_id) REFERENCES public.stores (store_id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id bigint NOT NULL,
  store_id text NOT NULL,
  barcode text,
  name text,
  price real,
  price2 real,
  price3 real,
  cost_price real,
  category text,
  stock integer,
  stock_threshold integer,
  tax_category text,
  bulk_qty integer,
  bulk_price real,
  factura_negativo integer,
  deleted_at text,
  created_at text,
  updated_at text,
  stock_provider text,
  CONSTRAINT products_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.customers (
  id bigint NOT NULL,
  store_id text NOT NULL,
  name text NOT NULL,
  phone text,
  id_number text,
  note text,
  balance real NOT NULL DEFAULT 0,
  is_active integer NOT NULL DEFAULT 1,
  created_at text,
  updated_at text,
  deleted_at text,
  CONSTRAINT customers_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.sales (
  id bigint NOT NULL,
  store_id text NOT NULL,
  user_id bigint,
  total real,
  subtotal real,
  discount_total real,
  cart_discount real,
  note text,
  sale_condition text,
  consecutivo text,
  customer_name text,
  customer_id_type text,
  customer_id text,
  customer_phone text,
  customer_email text,
  customer_activity_code text,
  customer_account_id bigint,
  cierre_id bigint,
  created_at text,
  CONSTRAINT sales_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.sale_items (
  id bigint NOT NULL,
  store_id text NOT NULL,
  sale_id bigint,
  product_id bigint,
  product_name_snapshot text,
  quantity integer,
  unit_price real,
  catalog_unit_price real,
  line_total real,
  line_discount real,
  discount real,
  tax_category text,
  barcode_snapshot text,
  CONSTRAINT sale_items_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.sale_payments (
  id bigint NOT NULL,
  store_id text NOT NULL,
  sale_id bigint,
  method text,
  amount real,
  ref text,
  CONSTRAINT sale_payments_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.credit_payments (
  id bigint NOT NULL,
  store_id text NOT NULL,
  customer_id bigint NOT NULL,
  amount real NOT NULL,
  method text NOT NULL,
  ref text,
  note text,
  user_id bigint,
  created_at text,
  cierre_id bigint,
  sale_id bigint,
  CONSTRAINT credit_payments_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.cierres (
  id bigint NOT NULL,
  store_id text NOT NULL,
  opened_at text,
  closed_at text,
  closed_by_user_id bigint,
  closed_by_username text,
  shift_label text,
  total_cash real,
  total_card real,
  total_sinpe real,
  total_credit real NOT NULL DEFAULT 0,
  total_sales real,
  opening_float real,
  cash_in real,
  cash_out real,
  expected_cash real,
  counted_cash real,
  cash_difference real,
  notes text,
  CONSTRAINT cierres_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id bigint NOT NULL,
  store_id text NOT NULL,
  type text,
  amount real,
  reason text,
  user_id bigint,
  created_at text,
  cierre_id bigint,
  CONSTRAINT cash_movements_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigint NOT NULL,
  store_id text NOT NULL,
  user_id bigint,
  username text,
  action text,
  entity text,
  entity_id text,
  detail text,
  created_at text,
  CONSTRAINT audit_log_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.return_items (
  id bigint NOT NULL,
  store_id text NOT NULL,
  sale_id bigint,
  product_id bigint,
  quantity integer,
  restocked integer,
  created_at text,
  processed_by bigint,
  sale_item_id bigint,
  line_total real,
  CONSTRAINT return_items_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.stock_adjustments (
  id bigint NOT NULL,
  store_id text NOT NULL,
  product_id bigint,
  user_id bigint,
  delta integer,
  reason text,
  created_at text,
  CONSTRAINT stock_adjustments_pkey PRIMARY KEY (id, store_id)
);

CREATE TABLE IF NOT EXISTS public.pos_users (
  id bigint NOT NULL,
  store_id text NOT NULL,
  username text,
  role text,
  is_active integer,
  created_at text,
  last_login_at text,
  CONSTRAINT pos_users_pkey PRIMARY KEY (id, store_id)
);

-- -----------------------------------------------------------------------------
-- 2. Column patches (existing deployments)
-- -----------------------------------------------------------------------------

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_provider text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price2 real;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price3 real;
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS barcode_snapshot text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_account_id bigint;
ALTER TABLE public.cierres ADD COLUMN IF NOT EXISTS total_credit real NOT NULL DEFAULT 0;
ALTER TABLE public.credit_payments ADD COLUMN IF NOT EXISTS sale_id bigint;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS sale_item_id bigint;
ALTER TABLE public.return_items ADD COLUMN IF NOT EXISTS line_total real;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS pos_last_seen_at text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS stock_threshold_default integer NOT NULL DEFAULT 5;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS iva_rate_standard numeric NOT NULL DEFAULT 13;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS billing_interval text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS next_payment_at timestamptz;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS billing_paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS billing_reminder_week_for date;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS billing_reminder_due_for date;

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_store_barcode ON public.products (store_id, barcode);
CREATE INDEX IF NOT EXISTS idx_products_store_stock_provider ON public.products (store_id, stock_provider);
CREATE INDEX IF NOT EXISTS idx_customers_store_name ON public.customers (store_id, name);
CREATE INDEX IF NOT EXISTS idx_sales_store_created ON public.sales (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_store_customer ON public.sales (store_id, customer_account_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_store_sale ON public.sale_items (store_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_payments_store_sale ON public.sale_payments (store_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_store_customer ON public.credit_payments (store_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_store_sale ON public.credit_payments (store_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_cierres_store_closed ON public.cierres (store_id, closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_store_created ON public.cash_movements (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_store_created ON public.audit_log (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_return_items_store_sale ON public.return_items (store_id, sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_adjustments_store_product ON public.stock_adjustments (store_id, product_id);
CREATE INDEX IF NOT EXISTS idx_pos_users_store_username ON public.pos_users (store_id, username);
CREATE INDEX IF NOT EXISTS idx_store_access_user ON public.store_access (user_id);
CREATE INDEX IF NOT EXISTS idx_store_pairings_user ON public.store_pairings (user_id);
CREATE INDEX IF NOT EXISTS idx_store_pairings_code ON public.store_pairings (pairing_code);

-- -----------------------------------------------------------------------------
-- 4. Functions & RPCs
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT public.get_my_role() = 'superadmin';
$$;

CREATE OR REPLACE FUNCTION public.can_access_store(p_store_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_superadmin()
    OR EXISTS (
      SELECT 1
      FROM public.store_access sa
      WHERE sa.user_id = auth.uid()
        AND sa.store_id = p_store_id
    );
$$;

CREATE OR REPLACE FUNCTION public.create_store_pairing(p_label text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_label text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_label := nullif(trim(p_label), '');
  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.store_pairings (user_id, pairing_code, label, expires_at)
  VALUES (auth.uid(), v_code, v_label, now() + interval '24 hours');

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_store_pairing()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT p.pairing_code
  INTO v_code
  FROM public.store_pairings p
  WHERE p.user_id = auth.uid()
    AND p.linked_at IS NULL
    AND p.expires_at > now()
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  RETURN public.create_store_pairing(NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_pending_pairings()
RETURNS TABLE (
  pairing_code text,
  label text,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.pairing_code, p.label, p.expires_at
  FROM public.store_pairings p
  WHERE p.user_id = auth.uid()
    AND p.linked_at IS NULL
    AND p.expires_at > now()
  ORDER BY p.created_at DESC;
$$;

-- Legacy dashboard aliases (older clients)
CREATE OR REPLACE FUNCTION public.create_store_claim()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.create_store_pairing(NULL);
$$;

CREATE OR REPLACE FUNCTION public.ensure_store_claim()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.ensure_store_pairing();
$$;

-- Service-role only: links a POS store_id to the pairing-code owner.
CREATE OR REPLACE FUNCTION public.claim_store_sync(
  p_claim_code text,
  p_store_id text,
  p_display_name text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_pairing_id uuid;
  v_role text;
  v_display text;
  v_owner_email text;
BEGIN
  v_role := COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'role',
    ''
  );
  IF v_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_store_id IS NULL OR length(trim(p_store_id)) = 0 THEN
    RAISE EXCEPTION 'store_id required';
  END IF;

  v_display := nullif(trim(p_display_name), '');

  SELECT p.id, p.user_id
  INTO v_pairing_id, v_user_id
  FROM public.store_pairings p
  WHERE p.pairing_code = upper(trim(p_claim_code))
    AND p.linked_at IS NULL
    AND p.expires_at > now()
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid or expired pairing code';
  END IF;

  SELECT u.email
  INTO v_owner_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  IF EXISTS (
    SELECT 1
    FROM public.store_access sa
    WHERE sa.store_id = p_store_id
      AND sa.user_id <> v_user_id
  ) THEN
    RAISE EXCEPTION 'store already owned by another account';
  END IF;

  INSERT INTO public.stores (store_id, display_name, billing_email)
  VALUES (p_store_id, COALESCE(v_display, p_store_id), v_owner_email)
  ON CONFLICT (store_id) DO UPDATE
  SET display_name = COALESCE(EXCLUDED.display_name, public.stores.display_name),
      billing_email = COALESCE(public.stores.billing_email, EXCLUDED.billing_email);

  INSERT INTO public.store_access (user_id, store_id, role)
  VALUES (v_user_id, p_store_id, 'owner')
  ON CONFLICT (user_id, store_id) DO NOTHING;

  UPDATE public.store_pairings
  SET linked_at = now(),
      linked_store_id = p_store_id
  WHERE id = v_pairing_id;
END;
$$;

-- Legacy 2-arg overload (sync-service callers without display_name)
CREATE OR REPLACE FUNCTION public.claim_store_sync(
  p_claim_code text,
  p_store_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.claim_store_sync(p_claim_code, p_store_id, NULL::text);
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cierres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_pairings ENABLE ROW LEVEL SECURITY;

-- Mirror tables: tenant read + block authenticated writes
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'products', 'customers', 'sales', 'sale_items', 'sale_payments', 'credit_payments',
    'cierres', 'cash_movements', 'audit_log', 'return_items',
    'stock_adjustments', 'pos_users'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'tenant read ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_access_store(store_id))',
      'tenant read ' || t,
      t
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'block dashboard writes to ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (false) WITH CHECK (false)',
      'block dashboard writes to ' || t,
      t
    );
  END LOOP;
END $$;

-- stores registry
DROP POLICY IF EXISTS "admin read stores" ON public.stores;
CREATE POLICY "admin read stores"
  ON public.stores
  FOR SELECT
  TO authenticated
  USING (public.can_access_store(store_id));

DROP POLICY IF EXISTS "block dashboard writes to stores" ON public.stores;
CREATE POLICY "block dashboard writes to stores"
  ON public.stores
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- store_access
DROP POLICY IF EXISTS "read own store_access" ON public.store_access;
CREATE POLICY "read own store_access"
  ON public.store_access
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS "block store_access writes" ON public.store_access;
CREATE POLICY "block store_access writes"
  ON public.store_access
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- store_pairings
DROP POLICY IF EXISTS "read own pairings" ON public.store_pairings;
CREATE POLICY "read own pairings"
  ON public.store_pairings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS "block pairing writes" ON public.store_pairings;
CREATE POLICY "block pairing writes"
  ON public.store_pairings
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Drop legacy superadmin-wide stores policies if present
DROP POLICY IF EXISTS stores_select_superadmin ON public.stores;
DROP POLICY IF EXISTS stores_superadmin_select ON public.stores;

-- -----------------------------------------------------------------------------
-- 6. Grants
-- -----------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.claim_store_sync(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_store_sync(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_store_sync(text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_store_sync(text, text, text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_store_sync(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_store_sync(text, text, text) TO service_role;

GRANT EXECUTE ON FUNCTION public.create_store_pairing(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_store_pairing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_pairings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_store_claim() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_store_claim() TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_store(text) TO authenticated;

-- -----------------------------------------------------------------------------
-- 7. Legacy migration: store_claim_codes → store_pairings
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.store_claim_codes') IS NOT NULL THEN
    INSERT INTO public.store_pairings (
      user_id,
      pairing_code,
      label,
      linked_store_id,
      expires_at,
      linked_at,
      created_at
    )
    SELECT
      c.user_id,
      upper(trim(c.claim_code)),
      NULL,
      c.store_id,
      c.expires_at,
      c.used_at,
      COALESCE(c.created_at, now())
    FROM public.store_claim_codes c
    WHERE c.claim_code IS NOT NULL
      AND upper(trim(c.claim_code)) ~ '^[A-Z0-9]{8}$'
    ON CONFLICT (pairing_code) DO NOTHING;

    DROP TABLE public.store_claim_codes;
  END IF;
END $$;

-- Drop the auto-enable-RLS event trigger from earlier revisions of this file.
-- Historical names differ across environments (`rls_auto_enable_trigger`,
-- `ensure_rls`). Drop every known trigger first, then the function.
-- New tables must explicitly ENABLE ROW LEVEL SECURITY (see section 5 above).
DROP EVENT TRIGGER IF EXISTS rls_auto_enable_trigger;
DROP EVENT TRIGGER IF EXISTS ensure_rls;
DROP FUNCTION IF EXISTS public.rls_auto_enable();
