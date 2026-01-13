
CREATE TABLE email_signups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  signup_source TEXT NOT NULL DEFAULT 'website',
  marketing_consent BOOLEAN DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  tags TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_signups_email ON email_signups(email);
CREATE INDEX idx_email_signups_status ON email_signups(status);
CREATE INDEX idx_email_signups_source ON email_signups(signup_source);

CREATE TABLE payment_customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  email TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start DATETIME,
  current_period_end DATETIME,
  trial_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_customers_user_id ON payment_customers(user_id);
CREATE INDEX idx_payment_customers_stripe_id ON payment_customers(stripe_customer_id);
CREATE INDEX idx_payment_subscriptions_customer_id ON payment_subscriptions(customer_id);
CREATE INDEX idx_payment_subscriptions_stripe_id ON payment_subscriptions(stripe_subscription_id);
