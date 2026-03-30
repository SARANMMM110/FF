-- Enterprise pricing contact (shown on pricing page + mailto)
ALTER TABLE white_label_settings ADD COLUMN enterprise_contact_email TEXT;
ALTER TABLE white_label_settings ADD COLUMN enterprise_price_display TEXT;
