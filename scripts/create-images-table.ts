import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function createImagesTable() {
  console.log('Creating images table...');
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS images (
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
    `);
    
    console.log('Successfully created images table');
  } catch (error) {
    console.error('Error creating images table:', error);
  }
}

// Run the migration
createImagesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 