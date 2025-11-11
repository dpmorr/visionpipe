ALTER TABLE device
ADD COLUMN waste_point_id INTEGER REFERENCES waste_point(id),
ADD COLUMN device_token VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX idx_device_waste_point_id ON device(waste_point_id); 