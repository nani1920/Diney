-- Add last_alert_at to tables to support re-triggering notifications
BEGIN;

ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS last_alert_at TIMESTAMPTZ DEFAULT now();

COMMIT;
