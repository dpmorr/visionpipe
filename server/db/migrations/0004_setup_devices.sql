-- Drop all foreign key constraints first
ALTER TABLE waste_points 
    DROP CONSTRAINT IF EXISTS waste_points_device_id_fkey;

ALTER TABLE images
    DROP CONSTRAINT IF EXISTS images_device_id_fkey;

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS devices;

-- Create the devices table with all necessary columns
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'active',
    iot_status TEXT DEFAULT 'disconnected',
    last_reading DECIMAL,
    last_reading_unit TEXT,
    battery_level INTEGER,
    next_maintenance TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    hostname TEXT,
    ip_address TEXT,
    username TEXT,
    last_connected TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Additional columns for device management
    model TEXT,
    serial_number TEXT,
    firmware_version TEXT,
    last_calibration TIMESTAMP,
    calibration_due_date TIMESTAMP,
    maintenance_notes TEXT,
    installation_date TIMESTAMP,
    warranty_expiry TIMESTAMP,
    manufacturer TEXT,
    supplier TEXT,
    purchase_date TIMESTAMP,
    purchase_price DECIMAL,
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    alert_thresholds JSONB,
    custom_fields JSONB
);

-- Create the images table with the correct foreign key
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    image_id TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL REFERENCES devices(device_id),
    user_id INTEGER REFERENCES users(id),
    image_url TEXT,
    roboflow_result JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update waste_points to reference devices
ALTER TABLE waste_points 
    DROP COLUMN IF EXISTS sensor_id,
    ADD COLUMN IF NOT EXISTS device_id INTEGER REFERENCES devices(id); 