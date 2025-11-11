CREATE TABLE data_models (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  organization_id INTEGER REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
); 