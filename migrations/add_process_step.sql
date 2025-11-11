-- Add process_step and name columns to waste_points table
ALTER TABLE waste_points
ADD COLUMN IF NOT EXISTS process_step TEXT NOT NULL DEFAULT 'Default Process Step',
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default Process Step';

-- Add waste_type column to waste_points table
ALTER TABLE waste_points
ADD COLUMN IF NOT EXISTS waste_type TEXT NOT NULL DEFAULT 'General';

-- Add estimated_volume column to waste_points table
ALTER TABLE waste_points
ADD COLUMN IF NOT EXISTS estimated_volume NUMERIC NOT NULL DEFAULT 0;

-- Add unit column to waste_points table
ALTER TABLE waste_points
ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'kg';

-- Add vendor_id column to waste_points table with foreign key reference
ALTER TABLE waste_points
ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id);

-- Remove the default values after adding the columns
ALTER TABLE waste_points
ALTER COLUMN process_step DROP DEFAULT,
ALTER COLUMN name DROP DEFAULT,
ALTER COLUMN waste_type DROP DEFAULT,
ALTER COLUMN estimated_volume DROP DEFAULT,
ALTER COLUMN unit DROP DEFAULT; 