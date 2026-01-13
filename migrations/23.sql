
ALTER TABLE tasks ADD COLUMN repeat TEXT DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN repeat_detail TEXT;
ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER;
ALTER TABLE tasks ADD COLUMN next_occurrence_date DATE;
