-- Add interval column to waste_points table
ALTER TABLE waste_points
ADD COLUMN interval TEXT NOT NULL DEFAULT 'weekly';

-- Add constraint to ensure valid interval values
ALTER TABLE waste_points
ADD CONSTRAINT valid_interval CHECK (interval IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')); 