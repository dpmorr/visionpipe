import { sql } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export async function up(db: any) {
  // Create a transaction to ensure all operations succeed or fail together
  await db.execute(sql`
    BEGIN;
    
    -- Drop the foreign key constraint from images table
    ALTER TABLE images DROP CONSTRAINT IF EXISTS images_device_id_fkey;
    
    -- Drop the unique constraint from devices table
    ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_id_key;
    
    -- Add the organization_id column
    ALTER TABLE devices 
    ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
    
    -- Update existing devices with organization ID from their users
    UPDATE devices d
    SET organization_id = u.organization_id
    FROM users u
    WHERE d.user_id = u.id
    AND d.organization_id IS NULL;
    
    -- Re-add the unique constraint
    ALTER TABLE devices 
    ADD CONSTRAINT devices_device_id_key UNIQUE (device_id);
    
    -- Re-add the foreign key constraint
    ALTER TABLE images
    ADD CONSTRAINT images_device_id_fkey 
    FOREIGN KEY (device_id) 
    REFERENCES devices(device_id);
    
    COMMIT;
  `);
}

export async function down(db: any) {
  await db.execute(sql`
    BEGIN;
    
    -- Drop the foreign key constraint from images table
    ALTER TABLE images DROP CONSTRAINT IF EXISTS images_device_id_fkey;
    
    -- Drop the unique constraint from devices table
    ALTER TABLE devices DROP CONSTRAINT IF EXISTS devices_device_id_key;
    
    -- Drop the organization_id column
    ALTER TABLE devices DROP COLUMN IF EXISTS organization_id;
    
    -- Re-add the unique constraint
    ALTER TABLE devices 
    ADD CONSTRAINT devices_device_id_key UNIQUE (device_id);
    
    -- Re-add the foreign key constraint
    ALTER TABLE images
    ADD CONSTRAINT images_device_id_fkey 
    FOREIGN KEY (device_id) 
    REFERENCES devices(device_id);
    
    COMMIT;
  `);
} 