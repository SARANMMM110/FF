
CREATE TABLE registration_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  plan_id TEXT NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at DATETIME,
  is_active INTEGER DEFAULT 1,
  created_by TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_registration_codes_code ON registration_codes(code);
CREATE INDEX idx_registration_codes_active ON registration_codes(is_active);
