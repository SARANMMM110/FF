-- Checkout URLs for paid plans (Stripe, Paddle, etc.)
ALTER TABLE white_label_settings ADD COLUMN payment_pro_url TEXT;
ALTER TABLE white_label_settings ADD COLUMN payment_enterprise_url TEXT;
