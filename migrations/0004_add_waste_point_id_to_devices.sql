-- Add waste_point_id column to devices table
ALTER TABLE devices ADD COLUMN waste_point_id INTEGER REFERENCES waste_points(id);

-- Update existing devices to link with waste points
UPDATE devices d
SET waste_point_id = wp.id
FROM waste_points wp
WHERE d.id = wp.device_id; 