import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function createSensorDataTable() {
  console.log('Creating sensor_data table...');
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sensor_data (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL REFERENCES devices(id),
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        
        -- Computer vision data
        items_detected JSONB,
        
        -- Fill level data
        fill_level DECIMAL,
        fill_level_unit TEXT DEFAULT 'percent',
        distance_to_top DECIMAL,
        distance_unit TEXT DEFAULT 'cm',
        
        -- Collection data
        last_collected TIMESTAMP,
        collection_frequency TEXT,
        
        -- Additional sensor data
        temperature DECIMAL,
        humidity DECIMAL,
        battery_level INTEGER,
        
        -- Metadata
        image_url TEXT,
        processing_time INTEGER,
        confidence DECIMAL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Sensor data table created successfully!');
  } catch (error) {
    console.error('❌ Failed to create sensor data table:', error);
  }
}

createSensorDataTable(); 