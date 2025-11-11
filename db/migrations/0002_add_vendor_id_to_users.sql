-- Add vendor_id column to users table
ALTER TABLE users ADD COLUMN vendor_id INTEGER REFERENCES vendors(id); 