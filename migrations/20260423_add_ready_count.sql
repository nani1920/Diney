-- Add ready_orders_count to tables
ALTER TABLE tables ADD COLUMN IF NOT EXISTS ready_orders_count INTEGER DEFAULT 0;

-- Optional: Update existing tables
UPDATE tables t
SET ready_orders_count = (
    SELECT COUNT(*) 
    FROM orders o 
    WHERE o.session_id = t.active_session_id 
    AND o.status = 'ready'
)
WHERE t.active_session_id IS NOT NULL;
