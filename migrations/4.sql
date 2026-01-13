
-- Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN project TEXT;
ALTER TABLE tasks ADD COLUMN due_date DATETIME;
ALTER TABLE tasks ADD COLUMN tags TEXT;

-- Create subtasks table
CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  estimated_minutes INTEGER,
  is_completed BOOLEAN DEFAULT 0,
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
