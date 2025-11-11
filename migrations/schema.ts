import { pgTable, serial, text, integer, timestamp, foreignKey, numeric, unique, boolean, json, index, varchar, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const organizations = pgTable("organizations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	plan: text().default('free').notNull(),
	maxUsers: integer("max_users").default(5).notNull(),
	billingEmail: text("billing_email").notNull(),
	address: text(),
	phone: text(),
	website: text(),
	logo: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const subscriptions = pgTable("subscriptions", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id").notNull(),
	status: text().default('active').notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }).notNull(),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }).notNull(),
	cancelAt: timestamp("cancel_at", { mode: 'string' }),
	canceledAt: timestamp("canceled_at", { mode: 'string' }),
	priceId: text("price_id").notNull(),
	quantity: integer().default(1).notNull(),
	amountPaid: numeric("amount_paid"),
	currency: text().default('usd').notNull(),
	stripeCustomerId: text("stripe_customer_id"),
	stripeSubscriptionId: text("stripe_subscription_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		subscriptionsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "subscriptions_organization_id_fkey"
		}),
	}
});

export const organizationInvites = pgTable("organization_invites", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id").notNull(),
	email: text().notNull(),
	role: text().default('member').notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		organizationInvitesOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_invites_organization_id_fkey"
		}),
	}
});

export const storedLocations = pgTable("stored_locations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	address: text().notNull(),
	placeId: text("place_id").notNull(),
	lat: numeric().notNull(),
	lng: numeric().notNull(),
	organizationId: integer("organization_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		storedLocationsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "stored_locations_organization_id_fkey"
		}),
	}
});

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	username: text(),
	companyName: text("company_name"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	role: text().default('user'),
	phoneNumber: text("phone_number"),
	jobTitle: text("job_title"),
	department: text(),
	profileImage: text("profile_image"),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	organizationId: integer("organization_id"),
	organizationRole: text("organization_role").default('member'),
	vendorId: integer("vendor_id"),
	userType: text("user_type").default('full').notNull(),
	subscriptionPlan: text("subscription_plan"),
	subscriptionStatus: text("subscription_status"),
	subscriptionId: integer("subscription_id"),
}, (table) => {
	return {
		usersOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "users_organization_id_fkey"
		}),
		usersVendorIdFkey: foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "users_vendor_id_fkey"
		}),
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const vendors = pgTable("vendors", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	services: json().notNull(),
	rating: integer().notNull(),
	serviceAreas: json("service_areas").notNull(),
	certificationsAndCompliance: json("certifications_and_compliance").notNull(),
	onTimeRate: integer("on_time_rate").notNull(),
	recyclingEfficiency: integer("recycling_efficiency").notNull(),
	customerSatisfaction: integer("customer_satisfaction").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	connectionStatus: text("connection_status").default('offline').notNull(),
	lastConnected: timestamp("last_connected", { mode: 'string' }),
	status: text().default('pending'),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	profileComplete: boolean("profile_complete").default(false),
	companyLogo: text("company_logo"),
	website: text(),
	primaryContact: text("primary_contact"),
	phone: text(),
	address: text(),
});

export const carbonImpact = pgTable("carbon_impact", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
	wasteReduction: numeric("waste_reduction").notNull(),
	carbonSavings: numeric("carbon_savings").notNull(),
	energySavings: numeric("energy_savings").notNull(),
	costSavings: numeric("cost_savings").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		carbonImpactOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "carbon_impact_organization_id_fkey"
		}),
	}
});

export const sustainabilityMetrics = pgTable("sustainability_metrics", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id").notNull(),
	metricType: varchar("metric_type", { length: 50 }).notNull(),
	value: numeric({ precision: 10, scale:  2 }).notNull(),
	timestamp: timestamp({ withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		idxMetricsTimestampType: index("idx_metrics_timestamp_type").using("btree", table.timestamp.asc().nullsLast(), table.metricType.asc().nullsLast()),
		idxSustainabilityMetricsTimestamp: index("idx_sustainability_metrics_timestamp").using("btree", table.timestamp.asc().nullsLast()),
	}
});

export const milestones = pgTable("milestones", {
	id: serial().primaryKey().notNull(),
	initiativeId: integer("initiative_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	targetDate: timestamp("target_date", { mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		milestonesInitiativeIdInitiativesIdFk: foreignKey({
			columns: [table.initiativeId],
			foreignColumns: [initiatives.id],
			name: "milestones_initiative_id_initiatives_id_fk"
		}),
	}
});

export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	initiativeId: integer("initiative_id").notNull(),
	title: text().notNull(),
	description: text().notNull(),
	status: text().default('todo').notNull(),
	priority: text().default('medium').notNull(),
	progress: integer().default(0).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }),
	dueDate: timestamp("due_date", { mode: 'string' }),
	assignedTo: integer("assigned_to"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		tasksInitiativeIdInitiativesIdFk: foreignKey({
			columns: [table.initiativeId],
			foreignColumns: [initiatives.id],
			name: "tasks_initiative_id_initiatives_id_fk"
		}),
		tasksAssignedToUsersIdFk: foreignKey({
			columns: [table.assignedTo],
			foreignColumns: [users.id],
			name: "tasks_assigned_to_users_id_fk"
		}),
	}
});

export const initiatives = pgTable("initiatives", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	status: text().default('planning').notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	targetDate: timestamp("target_date", { mode: 'string' }).notNull(),
	estimatedImpact: json("estimated_impact").notNull(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		initiativesCreatedByUsersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "initiatives_created_by_users_id_fk"
		}),
	}
});

export const updates = pgTable("updates", {
	id: serial().primaryKey().notNull(),
	initiativeId: integer("initiative_id").notNull(),
	updateType: text("update_type").notNull(),
	content: text().notNull(),
	metrics: json(),
	createdBy: integer("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		updatesInitiativeIdInitiativesIdFk: foreignKey({
			columns: [table.initiativeId],
			foreignColumns: [initiatives.id],
			name: "updates_initiative_id_initiatives_id_fk"
		}),
		updatesCreatedByUsersIdFk: foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "updates_created_by_users_id_fk"
		}),
	}
});

export const wastePoints = pgTable("waste_points", {
	id: serial().primaryKey().notNull(),
	processStep: text("process_step").notNull(),
	wasteType: text("waste_type").notNull(),
	estimatedVolume: numeric("estimated_volume").notNull(),
	unit: text().notNull(),
	vendor: text().notNull(),
	notes: text(),
	organizationId: integer("organization_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	locationData: jsonb("location_data"),
	deviceId: integer("device_id"),
}, (table) => {
	return {
		wastePointsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "waste_points_organization_id_fkey"
		}),
	}
});

export const goals = pgTable("goals", {
	id: serial().primaryKey().notNull(),
	type: text().notNull(),
	description: text().notNull(),
	targetPercentage: integer("target_percentage").notNull(),
	currentPercentage: integer("current_percentage").default(0).notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	status: text().default('in_progress').notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		goalsUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "goals_user_id_fkey"
		}),
	}
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	price: numeric().notNull(),
	category: text().notNull(),
	tags: jsonb().notNull(),
	inStock: boolean("in_stock").default(true).notNull(),
	imageUrl: text("image_url").notNull(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const organizationVendors = pgTable("organization_vendors", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id").notNull(),
	vendorId: integer("vendor_id").notNull(),
	status: text().default('active').notNull(),
	contractStartDate: timestamp("contract_start_date", { mode: 'string' }),
	contractEndDate: timestamp("contract_end_date", { mode: 'string' }),
	contractTerms: text("contract_terms"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		organizationVendorsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_vendors_organization_id_fkey"
		}),
		organizationVendorsVendorIdFkey: foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "organization_vendors_vendor_id_fkey"
		}),
	}
});

export const userCertifications = pgTable("user_certifications", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	certificationId: integer("certification_id").notNull(),
	status: text().default('pending').notNull(),
	applicationDate: timestamp("application_date", { mode: 'string' }).defaultNow(),
	issueDate: timestamp("issue_date", { mode: 'string' }),
	expiryDate: timestamp("expiry_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		userCertificationsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_certifications_user_id_users_id_fk"
		}),
		userCertificationsCertificationIdCertificationsIdFk: foreignKey({
			columns: [table.certificationId],
			foreignColumns: [certifications.id],
			name: "user_certifications_certification_id_certifications_id_fk"
		}),
	}
});

export const certifications = pgTable("certifications", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	requirements: json().notNull(),
	validityPeriod: integer("validity_period").notNull(),
	industry: json().notNull(),
	difficulty: text().notNull(),
	provider: text().notNull(),
	providerUrl: text("provider_url").notNull(),
	estimatedTime: text("estimated_time").notNull(),
	cost: text().notNull(),
	relevance: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const schedules = pgTable("schedules", {
	id: serial().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	waste_types: jsonb("waste_types").notNull(),
	vendor: text().notNull(),
	waste_point_id: integer("waste_point_id").references(() => wastePoints.id),
	status: text().default('pending').notNull(),
	organizationId: integer("organization_id"),
	is_recurring: boolean("is_recurring").default(false).notNull(),
	recurring_interval: integer("recurring_interval"),
	recurring_unit: text("recurring_unit"),
	recurring_group_id: text("recurring_group_id"),
	created_at: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updated_at: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		schedulesOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "schedules_organization_id_fkey"
		}),
		schedulesWastePointIdFkey: foreignKey({
			columns: [table.waste_point_id],
			foreignColumns: [wastePoints.id],
			name: "schedules_waste_point_id_fkey"
		})
	}
});

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNumber: text("invoice_number").notNull(),
	vendorId: integer("vendor_id"),
	customerName: text("customer_name"),
	issueDate: timestamp("issue_date", { mode: 'string' }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	totalAmount: numeric("total_amount").notNull(),
	status: text().default('pending').notNull(),
	notes: text(),
	wastePoints: json("waste_points").default([]).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		invoicesVendorIdFkey: foreignKey({
			columns: [table.vendorId],
			foreignColumns: [vendors.id],
			name: "invoices_vendor_id_fkey"
		}),
	}
});

export const organizationIntegrations = pgTable("organization_integrations", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id").notNull(),
	integrationId: integer("integration_id").notNull(),
	status: text().default('disconnected').notNull(),
	config: jsonb(),
	lastSyncedAt: timestamp("last_synced_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		organizationIntegrationsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_integrations_organization_id_fkey"
		}),
		organizationIntegrationsIntegrationIdFkey: foreignKey({
			columns: [table.integrationId],
			foreignColumns: [integrations.id],
			name: "organization_integrations_integration_id_fkey"
		}),
	}
});

export const integrations = pgTable("integrations", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	icon: text().notNull(),
	features: jsonb().notNull(),
	documentationUrl: text("documentation_url"),
	providerUrl: text("provider_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const wasteStreams = pgTable("waste_streams", {
	id: serial().primaryKey().notNull(),
	wastePointId: integer("waste_point_id"),
	streamType: text("stream_type").notNull(),
	quantity: numeric().notNull(),
	unit: text().notNull(),
	processingPath: text("processing_path").notNull(),
	processingEfficiency: numeric("processing_efficiency"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		wasteStreamsWastePointIdFkey: foreignKey({
			columns: [table.wastePointId],
			foreignColumns: [wastePoints.id],
			name: "waste_streams_waste_point_id_fkey"
		}),
	}
});

export const calculatorConfigs = pgTable("calculator_configs", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	wasteTypes: jsonb("waste_types").notNull(),
	additionalFees: jsonb("additional_fees").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	fields: jsonb(),
	formulas: jsonb(),
});

export const analyticsConfigs = pgTable("analytics_configs", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id"),
	type: text().notNull(),
	name: text().notNull(),
	config: jsonb().notNull(),
	active: boolean().default(true),
	schedule: text(),
	lastRefreshed: timestamp("last_refreshed", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isStandard: boolean("is_standard").default(false),
}, (table) => {
	return {
		analyticsConfigsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "analytics_configs_organization_id_fkey"
		}),
	}
});

export const reportSettings = pgTable("report_settings", {
	id: serial().primaryKey().notNull(),
	organizationId: integer("organization_id").notNull(),
	headerAlignment: text("header_alignment").default('left').notNull(),
	includeTimestamp: boolean("include_timestamp").default(true).notNull(),
	includePagination: boolean("include_pagination").default(true).notNull(),
	watermarkOpacity: numeric("watermark_opacity").default('0.1').notNull(),
	includeWatermark: boolean("include_watermark").default(true).notNull(),
	footerText: text("footer_text"),
	defaultColorScheme: text("default_color_scheme").default('default').notNull(),
	companyName: text("company_name"),
	companyAddress: text("company_address"),
	companyContact: text("company_contact"),
	companyWebsite: text("company_website"),
	companyLogo: text("company_logo"),
	headerStyle: text("header_style").default('standard').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		reportSettingsOrganizationIdFkey: foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "report_settings_organization_id_fkey"
		}),
	}
});

export const images = pgTable("images", {
	id: serial().primaryKey().notNull(),
	imageId: text("image_id").notNull(),
	deviceId: text("device_id").notNull(),
	userId: integer("user_id"),
	imageUrl: text("image_url"),
	roboflowResult: jsonb("roboflow_result"),
	timestamp: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => {
	return {
		imagesDeviceIdFkey: foreignKey({
			columns: [table.deviceId],
			foreignColumns: [devices.deviceId],
			name: "images_device_id_fkey"
		}),
		imagesUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "images_user_id_fkey"
		}),
	}
});

export const devices = pgTable("devices", {
	id: serial().primaryKey().notNull(),
	deviceId: text("device_id").notNull(),
	name: text(),
	type: text(),
	location: text(),
	status: text().default('active'),
	iotStatus: text("iot_status").default('disconnected'),
	lastReading: numeric("last_reading"),
	lastReadingUnit: text("last_reading_unit"),
	batteryLevel: integer("battery_level"),
	nextMaintenance: timestamp("next_maintenance", { mode: 'string' }),
	userId: integer("user_id"),
	hostname: text(),
	ipAddress: text("ip_address"),
	username: text(),
	lastConnected: timestamp("last_connected", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	model: text(),
	serialNumber: text("serial_number"),
	firmwareVersion: text("firmware_version"),
	lastCalibration: timestamp("last_calibration", { mode: 'string' }),
	calibrationDueDate: timestamp("calibration_due_date", { mode: 'string' }),
	maintenanceNotes: text("maintenance_notes"),
	installationDate: timestamp("installation_date", { mode: 'string' }),
	warrantyExpiry: timestamp("warranty_expiry", { mode: 'string' }),
	manufacturer: text(),
	supplier: text(),
	purchaseDate: timestamp("purchase_date", { mode: 'string' }),
	purchasePrice: numeric("purchase_price"),
	notes: text(),
	tags: text().array(),
	isActive: boolean("is_active").default(true),
	alertThresholds: jsonb("alert_thresholds"),
	customFields: jsonb("custom_fields"),
	deviceToken: text("device_token").notNull(),
}, (table) => {
	return {
		devicesUserIdFkey: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "devices_user_id_fkey"
		}),
		devicesDeviceIdKey: unique("devices_device_id_key").on(table.deviceId),
		devicesDeviceTokenUnique: unique("devices_device_token_unique").on(table.deviceToken),
	}
});
