-- Add organizationId column to devices table
ALTER TABLE devices ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Update existing devices to use the organization ID from their associated user
UPDATE devices d
SET organization_id = u.organization_id
FROM users u
WHERE d.user_id = u.id;

-- Add foreign key constraint
ALTER TABLE devices ADD CONSTRAINT fk_devices_organization
FOREIGN KEY (organization_id) REFERENCES organizations(id); 