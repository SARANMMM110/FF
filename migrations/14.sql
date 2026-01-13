
CREATE TABLE stripe_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,
  amount REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(plan_id, billing_period)
);

CREATE INDEX idx_stripe_prices_plan ON stripe_prices(plan_id, billing_period);
