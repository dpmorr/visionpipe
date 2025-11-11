import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateDataModelsOrg() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Updating data models with organization ID...');
    
    // Update all existing data models to have organization_id = 12
    const result = await client.query(`
      UPDATE data_models 
      SET organization_id = 12 
      WHERE organization_id = 1
    `);
    
    console.log(`✅ Updated ${result.rowCount} data models with organization ID`);
    
    // Show the updated models
    const models = await client.query('SELECT id, name, organization_id FROM data_models');
    console.log('Current data models:');
    models.rows.forEach(model => {
      console.log(`  ID: ${model.id}, Name: ${model.name}, Org ID: ${model.organization_id}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Error updating data models:', error);
  } finally {
    await pool.end();
  }
}

updateDataModelsOrg(); 