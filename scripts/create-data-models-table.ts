require('dotenv/config');
const { db } = require('../db');
const { sql } = require('drizzle-orm');

async function createDataModelsTable() {
  console.log('Creating data_models table...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS data_models (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        version TEXT NOT NULL,
        status TEXT NOT NULL,
        organization_id INTEGER REFERENCES organizations(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Successfully created data_models table');
  } catch (error) {
    console.error('Error creating data_models table:', error);
  }
}

createDataModelsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 