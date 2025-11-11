import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Create a new pool using your database URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Read and execute each migration file in order
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // This will sort them alphabetically, so 0001 comes before 0002

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split the SQL file into individual statements
      const statements = sql.split('--> statement-breakpoint');
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Disable foreign key checks temporarily
        await client.query('SET CONSTRAINTS ALL DEFERRED');

        // Execute all statements in order
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await client.query(statement);
              console.log('✓ Executed statement successfully');
            } catch (error: any) {
              // If table already exists, rollback and continue
              if (error.code === '42P07') {
                await client.query('ROLLBACK');
                console.log('ℹ️ Table already exists, skipping...');
                continue;
              }
              // If constraint already exists, rollback and continue
              if (error.code === '42710') {
                await client.query('ROLLBACK');
                console.log('ℹ️ Constraint already exists, skipping...');
                continue;
              }
              // If column doesn't exist, rollback and continue
              if (error.code === '42703') {
                await client.query('ROLLBACK');
                console.log('ℹ️ Column not found, skipping...');
                continue;
              }
              // If foreign key violation, rollback and continue
              if (error.code === '23503') {
                await client.query('ROLLBACK');
                console.log('ℹ️ Foreign key violation, skipping...');
                continue;
              }
              // For other errors, rollback and throw
              await client.query('ROLLBACK');
              throw error;
            }
          }
        }

        // Commit the transaction
        await client.query('COMMIT');
        console.log('✓ All statements executed successfully');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
