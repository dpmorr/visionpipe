-- ============================================
-- SUPABASE FULL MIGRATION FOR WASTETRAQ
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. ORGANIZATIONS (no dependencies)
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"max_users" integer DEFAULT 5 NOT NULL,
	"billing_email" text NOT NULL,
	"address" text,
	"phone" text,
	"website" text,
	"logo" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);

-- 2. VENDORS (no dependencies)
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"last_login" timestamp,
	"profile_complete" boolean DEFAULT false,
	"company_logo" text,
	"website" text,
	"primary_contact" text,
	"phone" text,
	"address" text,
	"services" json DEFAULT '["General Waste"]'::json NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"service_areas" json DEFAULT '[]'::json NOT NULL,
	"certifications_and_compliance" json DEFAULT '[]'::json NOT NULL,
	"on_time_rate" integer DEFAULT 0 NOT NULL,
	"recycling_efficiency" integer DEFAULT 0 NOT NULL,
	"customer_satisfaction" integer DEFAULT 0 NOT NULL,
	"connection_status" text DEFAULT 'offline' NOT NULL,
	"last_connected" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 3. SUBSCRIPTIONS (depends on organizations)
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at" timestamp,
	"canceled_at" timestamp,
	"price_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 4. USERS (depends on organizations, vendors, subscriptions)
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"username" text,
	"organization_id" integer REFERENCES "organizations"("id"),
	"vendor_id" integer REFERENCES "vendors"("id"),
	"organization_role" text DEFAULT 'member',
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'user',
	"user_type" text DEFAULT 'full' NOT NULL,
	"subscription_plan" text,
	"subscription_status" text,
	"subscription_id" integer REFERENCES "subscriptions"("id"),
	"phone_number" text,
	"job_title" text,
	"department" text,
	"profile_image" text,
	"last_login" timestamp,
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- 5. INTEGRATIONS (no dependencies)
CREATE TABLE IF NOT EXISTS "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"features" json NOT NULL,
	"documentation_url" text,
	"provider_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 6. WASTE POINTS (depends on devices via device_id, organizations)
-- Creating without device FK first, will add after devices table
CREATE TABLE IF NOT EXISTS "waste_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"process_step" text NOT NULL,
	"waste_type" text NOT NULL,
	"estimated_volume" numeric NOT NULL,
	"unit" text NOT NULL,
	"vendor" text NOT NULL,
	"notes" text,
	"interval" text NOT NULL DEFAULT 'weekly',
	"location_data" json,
	"device_id" integer,
	"organization_id" integer REFERENCES "organizations"("id"),
	"name" text,
	"vendor_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add interval constraint
ALTER TABLE waste_points
ADD CONSTRAINT valid_interval CHECK ("interval" IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

-- 7. DEVICES (depends on users, organizations, waste_points)
CREATE TABLE IF NOT EXISTS "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"device_token" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"location" text,
	"status" text DEFAULT 'active',
	"iot_status" text DEFAULT 'disconnected',
	"last_reading" numeric,
	"last_reading_unit" text,
	"battery_level" integer,
	"next_maintenance" timestamp,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"user_id" integer REFERENCES "users"("id"),
	"hostname" text,
	"ip_address" text,
	"username" text,
	"last_connected" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"model" text,
	"serial_number" text,
	"firmware_version" text,
	"last_calibration" timestamp,
	"calibration_due_date" timestamp,
	"maintenance_notes" text,
	"installation_date" timestamp,
	"warranty_expiry" timestamp,
	"manufacturer" text,
	"supplier" text,
	"purchase_date" timestamp,
	"purchase_price" numeric,
	"notes" text,
	"tags" text[],
	"is_active" boolean DEFAULT true,
	"alert_thresholds" jsonb,
	"custom_fields" jsonb,
	"waste_point_id" integer REFERENCES "waste_points"("id"),
	CONSTRAINT "devices_device_id_unique" UNIQUE("device_id"),
	CONSTRAINT "devices_device_token_unique" UNIQUE("device_token")
);

-- Add device FK to waste_points now that devices table exists
ALTER TABLE "waste_points" ADD CONSTRAINT "waste_points_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id");
ALTER TABLE "waste_points" ADD CONSTRAINT "waste_points_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id");

-- 8. IMAGES (depends on devices, users)
CREATE TABLE IF NOT EXISTS "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"device_id" text NOT NULL REFERENCES "devices"("device_id"),
	"user_id" integer REFERENCES "users"("id"),
	"image_url" text,
	"roboflow_result" json,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "images_image_id_unique" UNIQUE("image_id")
);

-- 9. SENSOR DATA (depends on devices, organizations)
CREATE TABLE IF NOT EXISTS "sensor_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" integer NOT NULL REFERENCES "devices"("id"),
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"items_detected" jsonb,
	"fill_level" numeric,
	"fill_level_unit" text DEFAULT 'percent',
	"distance_to_top" numeric,
	"distance_unit" text DEFAULT 'cm',
	"last_collected" timestamp,
	"collection_frequency" text,
	"temperature" numeric,
	"humidity" numeric,
	"battery_level" integer,
	"image_url" text,
	"processing_time" integer,
	"confidence" numeric,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 10. WASTE STREAMS (depends on waste_points)
CREATE TABLE IF NOT EXISTS "waste_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"waste_point_id" integer REFERENCES "waste_points"("id"),
	"stream_type" text NOT NULL,
	"quantity" numeric NOT NULL,
	"unit" text NOT NULL,
	"processing_path" text NOT NULL,
	"processing_efficiency" numeric,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 11. SCHEDULES (depends on waste_points, organizations)
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"waste_types" json NOT NULL,
	"waste_point_id" integer REFERENCES "waste_points"("id"),
	"vendor" text NOT NULL DEFAULT '',
	"status" text DEFAULT 'pending' NOT NULL,
	"organization_id" integer REFERENCES "organizations"("id"),
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_interval" integer,
	"recurring_unit" text,
	"recurring_group_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_waste_point_id ON schedules(waste_point_id);
CREATE INDEX IF NOT EXISTS idx_schedules_vendor ON schedules(vendor);

-- 12. GOALS (depends on users)
CREATE TABLE IF NOT EXISTS "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"target_percentage" integer NOT NULL,
	"current_percentage" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 13. INITIATIVES (depends on users)
CREATE TABLE IF NOT EXISTS "initiatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"start_date" timestamp NOT NULL,
	"target_date" timestamp NOT NULL,
	"estimated_impact" json NOT NULL,
	"created_by" integer REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 14. MILESTONES (depends on initiatives)
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" integer NOT NULL REFERENCES "initiatives"("id"),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 15. TASKS (depends on initiatives, users)
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" integer NOT NULL REFERENCES "initiatives"("id"),
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"due_date" timestamp,
	"assigned_to" integer REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 16. UPDATES (depends on initiatives, users)
CREATE TABLE IF NOT EXISTS "updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" integer NOT NULL REFERENCES "initiatives"("id"),
	"update_type" text NOT NULL,
	"content" text NOT NULL,
	"metrics" json,
	"created_by" integer REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now()
);

-- 17. INVOICES (depends on vendors)
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"vendor_id" integer REFERENCES "vendors"("id"),
	"customer_name" text,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"total_amount" numeric NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"waste_points" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 18. INVOICE ATTACHMENTS (depends on invoices, users)
CREATE TABLE IF NOT EXISTS "invoice_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"uploaded_by" integer REFERENCES "users"("id") ON DELETE SET NULL
);

-- 19. ORGANIZATION INTEGRATIONS (depends on organizations, integrations)
CREATE TABLE IF NOT EXISTS "organization_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"integration_id" integer NOT NULL REFERENCES "integrations"("id"),
	"status" text DEFAULT 'disconnected' NOT NULL,
	"config" json,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 20. ORGANIZATION INVITES (depends on organizations)
CREATE TABLE IF NOT EXISTS "organization_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

-- 21. ORGANIZATION VENDORS (depends on organizations, vendors)
CREATE TABLE IF NOT EXISTS "organization_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"vendor_id" integer NOT NULL REFERENCES "vendors"("id"),
	"status" text DEFAULT 'active' NOT NULL,
	"contract_start_date" timestamp DEFAULT now(),
	"contract_end_date" timestamp,
	"contract_terms" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 22. USER CERTIFICATIONS (depends on users, certifications)
CREATE TABLE IF NOT EXISTS "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"requirements" json NOT NULL,
	"validity_period" integer NOT NULL,
	"industry" json NOT NULL,
	"difficulty" text NOT NULL,
	"provider" text NOT NULL,
	"provider_url" text NOT NULL,
	"estimated_time" text NOT NULL,
	"cost" text NOT NULL,
	"relevance" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"certification_id" integer NOT NULL REFERENCES "certifications"("id"),
	"status" text DEFAULT 'pending' NOT NULL,
	"application_date" timestamp DEFAULT now(),
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 23. PRODUCTS
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" numeric NOT NULL,
	"category" text NOT NULL,
	"tags" json NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"image_url" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 24. ANALYTICS CONFIGS (depends on organizations)
CREATE TABLE IF NOT EXISTS "analytics_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer REFERENCES "organizations"("id"),
	"type" text NOT NULL,
	"name" text NOT NULL,
	"config" json NOT NULL,
	"active" boolean DEFAULT true,
	"schedule" text,
	"last_refreshed" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 25. CALCULATOR CONFIGS
CREATE TABLE IF NOT EXISTS "calculator_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"waste_types" json NOT NULL,
	"additional_fees" json NOT NULL,
	"fields" json,
	"formulas" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 26. CARBON IMPACT (depends on organizations)
CREATE TABLE IF NOT EXISTS "carbon_impact" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer REFERENCES "organizations"("id"),
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"waste_reduction" numeric NOT NULL,
	"carbon_savings" numeric NOT NULL,
	"energy_savings" numeric NOT NULL,
	"cost_savings" numeric NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 27. SUSTAINABILITY METRICS (depends on organizations)
CREATE TABLE IF NOT EXISTS "sustainability_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer REFERENCES "organizations"("id"),
	"metric_type" text NOT NULL,
	"value" numeric NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 28. STORED LOCATIONS (depends on organizations)
CREATE TABLE IF NOT EXISTS "stored_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"place_id" text NOT NULL,
	"lat" numeric NOT NULL,
	"lng" numeric NOT NULL,
	"organization_id" integer REFERENCES "organizations"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 29. REPORT SETTINGS (depends on organizations)
CREATE TABLE IF NOT EXISTS "report_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id"),
	"header_alignment" text DEFAULT 'left' NOT NULL,
	"include_timestamp" boolean DEFAULT true NOT NULL,
	"include_pagination" boolean DEFAULT true NOT NULL,
	"watermark_opacity" numeric DEFAULT '0.1' NOT NULL,
	"include_watermark" boolean DEFAULT true NOT NULL,
	"footer_text" text,
	"default_color_scheme" text DEFAULT 'default' NOT NULL,
	"company_name" text,
	"company_address" text,
	"company_contact" text,
	"company_website" text,
	"company_logo" text,
	"header_style" text DEFAULT 'standard' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 30. ALERTS (depends on organizations)
CREATE TABLE IF NOT EXISTS "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" integer,
	"condition" text NOT NULL,
	"threshold" text NOT NULL,
	"notification_method" text NOT NULL,
	"active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_organization_id ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_target_id ON alerts(target_id);

-- 31. API TOKENS (depends on users, organizations)
CREATE TABLE IF NOT EXISTS "api_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"token" text NOT NULL UNIQUE,
	"permissions" jsonb DEFAULT '[]',
	"last_used" timestamp,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_organization_id ON api_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_tokens_is_active ON api_tokens(is_active);

-- 32. WASTE AUDITS (depends on waste_points)
CREATE TABLE IF NOT EXISTS "waste_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"waste_point_id" integer NOT NULL REFERENCES "waste_points"("id") ON DELETE CASCADE,
	"date" date NOT NULL,
	"auditor" text NOT NULL,
	"waste_type" text NOT NULL,
	"volume" numeric NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_audits_waste_point_id ON waste_audits(waste_point_id);

-- ============================================
-- SEED: Test organization + user
-- Password is hashed using scrypt (same as your app's crypto.hash)
-- Login: test@wastetraq.com / Test1234!
-- ============================================

INSERT INTO "organizations" ("name", "slug", "plan", "max_users", "billing_email")
VALUES ('WasteTraq Demo', 'wastetraq-demo', 'starter', 5, 'test@wastetraq.com')
ON CONFLICT ("slug") DO NOTHING;

-- NOTE: The password hash below won't work because your app uses scrypt with a random salt.
-- Instead, use the /api/register endpoint OR the seed script below to create the user.
-- See: migrations/supabase_seed_user.ts
