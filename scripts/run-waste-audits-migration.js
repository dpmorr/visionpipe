import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the migration file
const migrationPath = path.join(__dirname, '../migrations/add_waste_audits_table.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Use DATABASE_URL from env, or fallback to the same as run-api-tokens-migration.js
const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:L8pg2iMFVdBf@ep-floral-voice-a5gqtm2b.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running waste audits migration...');
    await client.query(migrationSQL);
    console.log('✅ Waste audits migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration(); 