-- Add subscription_plan column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text;

-- Add comment to explain the column
COMMENT ON COLUMN users.subscription_plan IS 'The subscription plan of the user (starter, pro, enterprise)';
COMMENT ON COLUMN users.subscription_status IS 'The status of the subscription (pending, active, canceled, past_due)'; 