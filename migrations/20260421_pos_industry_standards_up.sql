-- UP MIGRATION: Table Sessions and POS Industry Standards
-- This script adds the missing columns and indexes to upgrade the database schema.
-- It supports the new Dual-Mode (Takeaway & Dine-in) architecture seamlessly.

BEGIN;

-- 1. Extend Tables table for Session Tracking
ALTER TABLE public.tables
  ADD COLUMN IF NOT EXISTS active_session_id UUID NULL,
  ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS zone_name TEXT DEFAULT 'Main',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update tables status constraint to include 'paying'
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE public.tables ADD CONSTRAINT tables_status_check CHECK (status IN ('available', 'occupied', 'dirty', 'paying'));

-- 2. Extend Orders table for Session Linking & Analytics
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS session_id UUID NULL,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS guest_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS applied_promo_code TEXT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- NOTE: Instead of updating the constraints or ENUM for `status` (received -> preparing -> ready -> served -> completed),
-- we handle the insertion of 'served' string via application logic to maintain high backwards compatibility with older static records.

-- 3. Extend Order_Items table for Menu Connection Analytics & Customizations
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS menu_item_id UUID NULL,
  ADD COLUMN IF NOT EXISTS customizations JSONB DEFAULT '[]'::jsonb;

-- 4. Create trigger to automatically update updated_at parameter
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tables_updated_at ON public.tables;
CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. Create Performance Indexes for Multi-Tenancy Lookups
CREATE INDEX IF NOT EXISTS idx_orders_tenant_session ON public.orders(tenant_id, session_id);
CREATE INDEX IF NOT EXISTS idx_tables_tenant_table ON public.tables(tenant_id, table_number);

-- 6. Enable Realtime Subscriptions
-- Ensure tables are in the realtime publication
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tables') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;

-- 7. Set REPLICA IDENTITY FULL for detailed broadcasts
ALTER TABLE public.tables REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

COMMIT;
