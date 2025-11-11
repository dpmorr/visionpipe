import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSensorDataMigration() {
  console.log('Running sensor data table migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/add_sensor_data_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('\n--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await db.execute(sql.raw(statement));
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`ℹ️ Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`✗ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Sensor data table migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runSensorDataMigration(); 