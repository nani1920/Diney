-- UP MIGRATION: Dual-Mode Architecture Expansion
-- This script adds the necessary tables and fields to support Table Service, Staff Management, and Financial Settings.
-- It is designed to be fully backward compatible with existing "Stall-only" tenants.

BEGIN;

-- 1. Extend `tenants` table with service modes and financial settings
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS service_mode TEXT DEFAULT 'STALL' CHECK (service_mode IN ('STALL', 'TABLE', 'HYBRID')),
  ADD COLUMN IF NOT EXISTS tax_percent NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS service_charge_percent NUMERIC(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';

-- 2. Create `tables` infrastructure (for Dine-in service)
CREATE TABLE IF NOT EXISTS public.tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    qr_code_url TEXT,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'dirty', 'paying', 'service_requested')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, table_number)
);

-- Note: In a true Supabase setup, you might want to add RLS policies here for public.tables
-- ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON public.tables FOR SELECT USING (true);
-- CREATE POLICY "Enable write access for tenant owners" ON public.tables FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.tenants WHERE id = tenant_id));

-- 3. Create `tenant_staff` for Waiter / Management RBAC
CREATE TABLE IF NOT EXISTS public.tenant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    waiter_id TEXT NOT NULL,          -- e.g., 'W01', 'ALEX_01'
    pin_hash TEXT NOT NULL,           -- Hashed PIN for secure login (waiters don't need full auth accounts)
    role TEXT DEFAULT 'waiter' CHECK (role IN ('manager', 'waiter', 'chef')),
    assigned_tables TEXT[] DEFAULT '{}', -- Array of table numbers this staff member manages
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, waiter_id)
);

-- 4. Extend `orders` table to track Table Service and Financials
-- IMPORTANT: We rename `type` to `order_type` to avoid SQL keyword conflicts
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'TAKEAWAY' CHECK (order_type IN ('TAKEAWAY', 'DINE_IN')),
  ADD COLUMN IF NOT EXISTS table_number TEXT NULL,
  ADD COLUMN IF NOT EXISTS total_tax NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_service_charge NUMERIC(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS staff_id UUID NULL REFERENCES public.tenant_staff(id) ON DELETE SET NULL;

-- 5. Enable Realtime Replication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

COMMIT;
