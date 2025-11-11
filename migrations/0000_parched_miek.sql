CREATE TABLE IF NOT EXISTS "analytics_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"config" json NOT NULL,
	"active" boolean DEFAULT true,
	"schedule" text,
	"last_refreshed" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "carbon_impact" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"waste_reduction" numeric NOT NULL,
	"carbon_savings" numeric NOT NULL,
	"energy_savings" numeric NOT NULL,
	"cost_savings" numeric NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
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
	"organization_id" integer NOT NULL,
	"user_id" integer,
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
	CONSTRAINT "devices_device_id_unique" UNIQUE("device_id"),
	CONSTRAINT "devices_device_token_unique" UNIQUE("device_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"target_percentage" integer NOT NULL,
	"current_percentage" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_id" text NOT NULL,
	"device_id" text NOT NULL,
	"user_id" integer,
	"image_url" text,
	"roboflow_result" json,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "images_image_id_unique" UNIQUE("image_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "initiatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'planning' NOT NULL,
	"start_date" timestamp NOT NULL,
	"target_date" timestamp NOT NULL,
	"estimated_impact" json NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"vendor_id" integer,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"integration_id" integer NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"config" json,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"contract_start_date" timestamp DEFAULT now(),
	"contract_end_date" timestamp,
	"contract_terms" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"waste_types" json NOT NULL,
	"vendor" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"organization_id" integer,
	"is_recurring" boolean DEFAULT false NOT NULL,
	"recurring_interval" integer,
	"recurring_unit" text,
	"recurring_group_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stored_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"place_id" text NOT NULL,
	"lat" numeric NOT NULL,
	"lng" numeric NOT NULL,
	"organization_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sustainability_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer,
	"metric_type" text NOT NULL,
	"value" numeric NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_date" timestamp,
	"due_date" timestamp,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"initiative_id" integer NOT NULL,
	"update_type" text NOT NULL,
	"content" text NOT NULL,
	"metrics" json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"certification_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"application_date" timestamp DEFAULT now(),
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"username" text,
	"organization_id" integer,
	"vendor_id" integer,
	"organization_role" text DEFAULT 'member',
	"first_name" text,
	"last_name" text,
	"role" text DEFAULT 'user',
	"user_type" text DEFAULT 'full' NOT NULL,
	"subscription_plan" text,
	"subscription_status" text,
	"subscription_id" integer,
	"phone_number" text,
	"job_title" text,
	"department" text,
	"profile_image" text,
	"last_login" timestamp,
	"onboarding_completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waste_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"process_step" text NOT NULL,
	"waste_type" text NOT NULL,
	"estimated_volume" numeric NOT NULL,
	"unit" text NOT NULL,
	"vendor" text NOT NULL,
	"notes" text,
	"location_data" json,
	"device_id" integer,
	"organization_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waste_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"waste_point_id" integer,
	"stream_type" text NOT NULL,
	"quantity" numeric NOT NULL,
	"unit" text NOT NULL,
	"processing_path" text NOT NULL,
	"processing_efficiency" numeric,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_configs" ADD CONSTRAINT "analytics_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "carbon_impact" ADD CONSTRAINT "carbon_impact_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_device_id_devices_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("device_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "initiatives" ADD CONSTRAINT "initiatives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "milestones" ADD CONSTRAINT "milestones_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_integrations" ADD CONSTRAINT "organization_integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_integrations" ADD CONSTRAINT "organization_integrations_integration_id_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_vendors" ADD CONSTRAINT "organization_vendors_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_vendors" ADD CONSTRAINT "organization_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "report_settings" ADD CONSTRAINT "report_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stored_locations" ADD CONSTRAINT "stored_locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sustainability_metrics" ADD CONSTRAINT "sustainability_metrics_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "updates" ADD CONSTRAINT "updates_initiative_id_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."initiatives"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "updates" ADD CONSTRAINT "updates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_certifications" ADD CONSTRAINT "user_certifications_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "waste_points" ADD CONSTRAINT "waste_points_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "waste_points" ADD CONSTRAINT "waste_points_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "waste_streams" ADD CONSTRAINT "waste_streams_waste_point_id_waste_points_id_fk" FOREIGN KEY ("waste_point_id") REFERENCES "public"."waste_points"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
