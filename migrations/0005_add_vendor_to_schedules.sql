ALTER TABLE schedules
ADD COLUMN vendor text NOT NULL DEFAULT '';

-- Add an index for better query performance
CREATE INDEX idx_schedules_vendor ON schedules(vendor); 