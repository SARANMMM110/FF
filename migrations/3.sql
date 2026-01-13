
CREATE TABLE user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  focus_duration_minutes INTEGER DEFAULT 25,
  short_break_minutes INTEGER DEFAULT 5,
  long_break_minutes INTEGER DEFAULT 15,
  cycles_before_long_break INTEGER DEFAULT 4,
  auto_start_breaks BOOLEAN DEFAULT 0,
  auto_start_focus BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
