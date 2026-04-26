-- UP MIGRATION: Staff Dashboard Overhaul & Status Decoupling
-- This script separates table occupancy from alerts and adds staff attribution fields.

BEGIN;

-- 1. Rename existing status to occupancy_status
-- This ensures we don't break existing queries that might rely on a 'status' column until we update them.
ALTER TABLE public.tables RENAME COLUMN status TO occupancy_status;

-- 2. Add New Columns for Alerting and Staff Attribution
ALTER TABLE public.tables 
  ADD COLUMN IF NOT EXISTS alert_status TEXT DEFAULT 'none' CHECK (alert_status IN ('none', 'service', 'bill')),
  ADD COLUMN IF NOT EXISTS assigned_staff_id UUID REFERENCES public.tenant_staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS handled_by_staff_id UUID REFERENCES public.tenant_staff(id) ON DELETE SET NULL;

-- 3. Data Migration: Map old combined statuses to new decoupled columns
-- We do this before tightening the constraints.
UPDATE public.tables 
SET 
  alert_status = CASE 
    WHEN occupancy_status = 'service_requested' THEN 'service'
    WHEN occupancy_status = 'paying' THEN 'bill'
    ELSE 'none'
  END,
  occupancy_status = CASE 
    WHEN occupancy_status IN ('service_requested', 'paying', 'occupied') THEN 'occupied'
    WHEN occupancy_status = 'dirty' THEN 'dirty'
    ELSE 'available'
  END;

-- 4. Update Occupancy Constraints
-- Drop the old constraint that included 'paying' and 'service_requested'
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE public.tables ADD CONSTRAINT tables_occupancy_check CHECK (occupancy_status IN ('available', 'occupied', 'dirty'));

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tables_assigned_staff ON public.tables(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_tables_alert_status ON public.tables(alert_status) WHERE alert_status != 'none';

COMMIT;
