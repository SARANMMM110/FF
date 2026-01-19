-- Add repeat columns to tasks table (Migration 23)
-- This fixes the "Unknown column 'repeat' in 'field list'" error

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS `repeat` TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence_date DATE;

