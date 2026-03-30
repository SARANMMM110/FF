-- Public pricing labels + Pro sales email
ALTER TABLE white_label_settings ADD COLUMN pricing_free_label TEXT;
ALTER TABLE white_label_settings ADD COLUMN pricing_pro_label TEXT;
ALTER TABLE white_label_settings ADD COLUMN pro_contact_email TEXT;
