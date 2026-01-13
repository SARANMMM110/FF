
CREATE TABLE focus_distractions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  session_id INTEGER,
  distraction_type TEXT NOT NULL,
  duration_seconds INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_focus_distractions_user_id ON focus_distractions(user_id);
CREATE INDEX idx_focus_distractions_session_id ON focus_distractions(session_id);
CREATE INDEX idx_focus_distractions_timestamp ON focus_distractions(timestamp);
