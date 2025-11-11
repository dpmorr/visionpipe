import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function createDevicesTable() {
  console.log('Creating devices table...');
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS devices (
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
        sensor_id INTEGER REFERENCES sensors(id),
        last_connected TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Successfully created devices table');
  } catch (error) {
    console.error('Error creating devices table:', error);
  }
}

// Run the migration
createDevicesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 