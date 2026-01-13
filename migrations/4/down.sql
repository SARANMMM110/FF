
DROP INDEX idx_subtasks_task_id;
DROP TABLE subtasks;

ALTER TABLE tasks DROP COLUMN tags;
ALTER TABLE tasks DROP COLUMN due_date;
ALTER TABLE tasks DROP COLUMN project;
