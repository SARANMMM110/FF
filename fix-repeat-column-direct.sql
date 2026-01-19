-- Run these commands directly in MySQL client (no escaping needed)
-- Just copy and paste each line

USE frankimsocial_ff;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;

-- Verify the columns were added
DESCRIBE tasks;

