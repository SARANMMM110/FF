-- MySQL doesn't allow DEFAULT values for TEXT columns
-- Run these commands one at a time

USE frankimsocial_ff;

-- Add columns without DEFAULT (MySQL doesn't support DEFAULT for TEXT)
ALTER TABLE tasks ADD COLUMN `repeat` TEXT;
ALTER TABLE tasks ADD COLUMN repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN next_occurrence_date DATE;

-- Verify columns were added
DESCRIBE tasks;

