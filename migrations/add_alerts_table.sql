-- Create alerts table for configurable system alerts
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    target_type TEXT NOT NULL, -- 'sensor' or 'waste_point'
    target_id INTEGER, -- FK to devices or waste_points (nullable for org-wide alerts)
    condition TEXT NOT NULL,
    threshold TEXT NOT NULL,
    notification_method TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_target_id ON alerts(target_id); 