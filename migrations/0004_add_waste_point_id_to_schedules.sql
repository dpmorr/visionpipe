-- Add waste_point_id column to schedules table
ALTER TABLE schedules
ADD COLUMN waste_point_id INTEGER REFERENCES waste_points(id);

-- Add an index for better query performance
CREATE INDEX idx_schedules_waste_point_id ON schedules(waste_point_id);

-- Update existing schedules to link to waste point with id 5
UPDATE schedules
SET waste_point_id = 5
WHERE waste_point_id IS NULL; 