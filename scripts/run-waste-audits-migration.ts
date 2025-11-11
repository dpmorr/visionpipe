// Script to run the add_waste_audits_table.sql migration
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATION_PATH = path.join(__dirname, '../migrations/add_waste_audits_table.sql');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL not set in environment');
  }

  const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Migration completed: waste_audits table created.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration(); 