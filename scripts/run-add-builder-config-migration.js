import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.join(__dirname, '../db/migrations/0004_add_builder_config_to_data_models.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:L8pg2iMFVdBf@ep-floral-voice-a5gqtm2b.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString });

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running add builder_config column migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration(); 