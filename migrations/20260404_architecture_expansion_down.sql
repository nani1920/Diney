-- DOWN MIGRATION: Architecture Expansion
BEGIN;

-- 1. Remove replication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.tables;
        ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.orders;
    END IF;
END $$;

-- 2. Drop tables
DROP TABLE IF EXISTS public.tenant_staff CASCADE;
DROP TABLE IF EXISTS public.tables CASCADE;

-- 3. Revert tenant changes
ALTER TABLE public.tenants
  DROP COLUMN IF EXISTS service_mode,
  DROP COLUMN IF EXISTS tax_percent,
  DROP COLUMN IF EXISTS service_charge_percent,
  DROP COLUMN IF EXISTS currency;

-- 4. Revert order changes
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS order_type,
  DROP COLUMN IF EXISTS table_number,
  DROP COLUMN IF EXISTS total_tax,
  DROP COLUMN IF EXISTS total_service_charge,
  DROP COLUMN IF EXISTS staff_id;

COMMIT;
