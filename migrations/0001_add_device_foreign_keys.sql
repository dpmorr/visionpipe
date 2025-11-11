-- Add foreign key constraints to devices table
ALTER TABLE devices
    ADD CONSTRAINT devices_organization_id_fkey 
    FOREIGN KEY (organization_id) 
    REFERENCES organizations(id) 
    ON DELETE CASCADE;

ALTER TABLE devices
    ADD CONSTRAINT devices_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL; 