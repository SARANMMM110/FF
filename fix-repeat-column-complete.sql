-- Complete fix for repeat column issue
-- Run these commands in order

-- Step 1: Select the correct database
USE frankimsocial_ff;

-- Step 2: Add the missing columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;

-- Step 3: Verify columns were added
DESCRIBE tasks;

