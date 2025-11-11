-- Add subscription_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id integer REFERENCES subscriptions(id);

-- Add comment to explain the column
COMMENT ON COLUMN users.subscription_id IS 'Reference to the subscription record in the subscriptions table'; 