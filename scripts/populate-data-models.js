import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const exampleModels = [
  {
    id: 'w1',
    name: 'General Waste Stream',
    description: 'Standard model for general waste tracking and categorization',
    type: 'waste',
    source: 'internal',
    lastUpdated: '2024-03-15',
    version: '1.2',
    status: 'in progress',
    builderConfig: {
      nodes: [
        {
          id: '1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: { label: 'Waste Input' }
        },
        {
          id: '2',
          type: 'default',
          position: { x: 300, y: 100 },
          data: { label: 'Classification' }
        },
        {
          id: '3',
          type: 'output',
          position: { x: 500, y: 100 },
          data: { label: 'Waste Output' }
        }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
    }
  },
  {
    id: 'w2',
    name: 'Hazardous Waste Model',
    description: 'Specialized model for hazardous waste classification and handling',
    type: 'waste',
    source: 'internal',
    lastUpdated: '2024-03-14',
    version: '2.0',
    status: 'inactive',
    builderConfig: {
      nodes: [
        {
          id: '1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: { label: 'Hazardous Input' }
        },
        {
          id: '2',
          type: 'default',
          position: { x: 300, y: 100 },
          data: { label: 'Safety Check' }
        },
        {
          id: '3',
          type: 'output',
          position: { x: 500, y: 100 },
          data: { label: 'Safe Disposal' }
        }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
    }
  },
  {
    id: 'e1',
    name: 'Ecoinvent Waste Model',
    description: 'Environmental impact data from Ecoinvent database',
    type: 'environmental',
    source: 'ecoinvent',
    lastUpdated: '2024-03-10',
    version: '3.8',
    status: 'in progress',
    builderConfig: {
      nodes: [
        {
          id: '1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: { label: 'Environmental Data' }
        },
        {
          id: '2',
          type: 'default',
          position: { x: 300, y: 100 },
          data: { label: 'Impact Analysis' }
        }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' }
      ]
    }
  },
  {
    id: 'm1',
    name: 'Material Flow Analysis',
    description: 'Comprehensive material flow tracking model',
    type: 'material',
    source: 'internal',
    lastUpdated: '2024-03-12',
    version: '2.1',
    status: 'in progress',
    builderConfig: {
      nodes: [
        {
          id: '1',
          type: 'input',
          position: { x: 100, y: 100 },
          data: { label: 'Material Input' }
        },
        {
          id: '2',
          type: 'default',
          position: { x: 300, y: 100 },
          data: { label: 'Flow Analysis' }
        }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' }
      ]
    }
  }
];

async function populateDataModels() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    console.log('Populating data models...');
    
    for (const model of exampleModels) {
      // Check if model already exists by name
      const existingModel = await client.query(
        'SELECT id FROM data_models WHERE name = $1',
        [model.name]
      );
      
      if (existingModel.rows.length === 0) {
        const result = await client.query(`
          INSERT INTO data_models (
            name, description, type, source, last_updated, version, status, builder_config, organization_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `, [
          model.name,
          model.description,
          model.type,
          model.source,
          model.lastUpdated,
          model.version,
          model.status,
          JSON.stringify(model.builderConfig),
          1 // Default organization ID
        ]);
        console.log(`✅ Added model: ${model.name} with ID: ${result.rows[0].id}`);
      } else {
        console.log(`⏭️  Model already exists: ${model.name}`);
      }
    }
    
    console.log('✅ Data models populated successfully!');
    client.release();
  } catch (error) {
    console.error('❌ Error populating data models:', error);
  } finally {
    await pool.end();
  }
}

populateDataModels(); 