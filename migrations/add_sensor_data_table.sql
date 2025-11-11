-- Create sensor_data table for storing sensor readings
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id),
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Computer vision data
    items_detected JSONB, -- Array of detected items with confidence and count
    
    -- Fill level data
    fill_level DECIMAL, -- Percentage 0-100
    fill_level_unit TEXT DEFAULT 'percent',
    distance_to_top DECIMAL, -- Distance in cm
    distance_unit TEXT DEFAULT 'cm',
    
    -- Collection data
    last_collected TIMESTAMP,
    collection_frequency TEXT, -- daily, weekly, etc.
    
    -- Additional sensor data
    temperature DECIMAL,
    humidity DECIMAL,
    battery_level INTEGER,
    
    -- Metadata
    image_url TEXT, -- URL to captured image
    processing_time INTEGER, -- Time taken to process in ms
    confidence DECIMAL, -- Overall confidence score
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 