
DROP INDEX idx_payment_subscriptions_stripe_id;
DROP INDEX idx_payment_subscriptions_customer_id;
DROP INDEX idx_payment_customers_stripe_id;
DROP INDEX idx_payment_customers_user_id;
DROP INDEX idx_email_signups_source;
DROP INDEX idx_email_signups_status;
DROP INDEX idx_email_signups_email;

DROP TABLE payment_subscriptions;
DROP TABLE payment_customers;
DROP TABLE email_signups;
