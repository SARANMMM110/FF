-- How the header/auth logo is shown: full image vs mark + app name
ALTER TABLE white_label_settings ADD COLUMN logo_display_mode TEXT DEFAULT 'icon_plus_name';
