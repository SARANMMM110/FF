
CREATE TABLE white_label_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_name TEXT DEFAULT 'FocusFlow',
  app_tagline TEXT DEFAULT 'Master your time, amplify your focus',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#8B5CF6',
  accent_color TEXT DEFAULT '#F59E0B',
  custom_domain TEXT,
  hide_powered_by BOOLEAN DEFAULT 0,
  support_email TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO white_label_settings (id, app_name, app_tagline) VALUES (1, 'FocusFlow', 'Master your time, amplify your focus');
