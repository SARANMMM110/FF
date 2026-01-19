-- MySQL doesn't support IF NOT EXISTS in ALTER TABLE
-- Run these commands one at a time
-- If a column already exists, you'll get an error - that's okay, just skip it

USE frankimsocial_ff;

-- Check if columns exist first (optional - just to see current state)
DESCRIBE tasks;

-- Add columns (remove IF NOT EXISTS - MySQL doesn't support it)
ALTER TABLE tasks ADD COLUMN `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN next_occurrence_date DATE;

-- Verify columns were added
DESCRIBE tasks;

