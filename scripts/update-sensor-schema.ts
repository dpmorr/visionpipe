// Update sensor schema script to add accessCode and connectionStatus fields
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function updateSensorSchema() {
  console.log('Starting sensor schema update...');
  
  try {
    // Add accessCode column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE sensors
      ADD COLUMN IF NOT EXISTS access_code text,
      ADD COLUMN IF NOT EXISTS connection_status text DEFAULT 'disconnected'
    `);
    
    console.log('Successfully added accessCode and connectionStatus columns to sensors table');
  } catch (error) {
    console.error('Error updating sensor schema:', error);
  }
}

updateSensorSchema()
  .then(() => {
    console.log('Schema update script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema update script failed:', error);
    process.exit(1);
  });