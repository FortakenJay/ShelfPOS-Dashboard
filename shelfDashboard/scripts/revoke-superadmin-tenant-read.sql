-- Run once in Supabase SQL editor.
-- Superadmin operator tasks use service-role APIs (/api/operator/*), not tenant mirror reads.

CREATE OR REPLACE FUNCTION public.can_access_store(p_store_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_access sa
    WHERE sa.user_id = auth.uid()
      AND sa.store_id = p_store_id
  );
$$;

-- stores registry: membership only (drop superadmin-wide read if present)
DROP POLICY IF EXISTS stores_select_superadmin ON public.stores;
DROP POLICY IF EXISTS stores_superadmin_select ON public.stores;
