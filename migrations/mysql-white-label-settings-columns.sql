-- PM2 / MySQL: add branding & pricing columns to white_label_settings if your table
-- was created before migrations 27–30 (fixes ER_BAD_FIELD_ERROR / Unknown column).
-- Run once against your app database, e.g.:
--   mysql -u USER -p DATABASE < migrations/mysql-white-label-settings-columns.sql
-- Skip any line that errors with "Duplicate column name".

ALTER TABLE white_label_settings ADD COLUMN enterprise_contact_email TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN enterprise_price_display TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN pricing_free_label TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN pricing_pro_label TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN pro_contact_email TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN payment_pro_url TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN payment_enterprise_url TEXT NULL;
ALTER TABLE white_label_settings ADD COLUMN logo_display_mode VARCHAR(64) NULL DEFAULT 'icon_plus_name';
