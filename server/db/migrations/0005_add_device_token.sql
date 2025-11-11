-- Add device_token column to devices table
ALTER TABLE devices
    ADD COLUMN device_token TEXT NOT NULL;

-- Add a unique constraint to ensure device tokens are unique
ALTER TABLE devices
    ADD CONSTRAINT devices_device_token_unique UNIQUE (device_token); 