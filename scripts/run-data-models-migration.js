import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '../db/migrations/0003_add_data_models_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Use DATABASE_URL from env, or fallback to your default
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running data models migration...');
    await client.query(migrationSQL);
    console.log('✅ Data models migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration(); 