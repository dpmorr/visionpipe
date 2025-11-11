-- Create waste_audits table for manual waste audits
CREATE TABLE IF NOT EXISTS waste_audits (
    id SERIAL PRIMARY KEY,
    waste_point_id INTEGER NOT NULL REFERENCES waste_points(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    auditor TEXT NOT NULL,
    waste_type TEXT NOT NULL,
    volume NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by waste_point_id
CREATE INDEX IF NOT EXISTS idx_waste_audits_waste_point_id ON waste_audits(waste_point_id); 