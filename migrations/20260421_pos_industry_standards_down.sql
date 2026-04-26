-- DOWN MIGRATION: Safe Rollback for POS Industry Standards
-- This script reverses exactly what the UP script did.
-- Run this if the Table Session architecture introduces critical issues and you need to revert.

BEGIN;

-- 1. DROP Indexes
DROP INDEX IF EXISTS public.idx_orders_tenant_session;
DROP INDEX IF EXISTS public.idx_tables_tenant_table;

-- 2. DROP Triggers and Functions
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_tables_updated_at ON public.tables;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- 3. Remove Columns from order_items
ALTER TABLE public.order_items
  DROP COLUMN IF EXISTS menu_item_id,
  DROP COLUMN IF EXISTS customizations;

-- 4. Remove Columns from orders
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS session_id,
  DROP COLUMN IF EXISTS cancel_reason,
  DROP COLUMN IF EXISTS guest_count,
  DROP COLUMN IF EXISTS discount_amount,
  DROP COLUMN IF EXISTS applied_promo_code,
  DROP COLUMN IF EXISTS updated_at;

-- 5. Remove Columns from tables
ALTER TABLE public.tables
  DROP COLUMN IF EXISTS active_session_id,
  DROP COLUMN IF EXISTS capacity,
  DROP COLUMN IF EXISTS zone_name,
  DROP COLUMN IF EXISTS updated_at;

-- 4. Revert tables status constraint
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE public.tables ADD CONSTRAINT tables_status_check CHECK (status IN ('available', 'occupied', 'dirty'));

-- Revert Realtime Subscriptions
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tables') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.tables;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
    END IF;
END $$;

COMMIT;
