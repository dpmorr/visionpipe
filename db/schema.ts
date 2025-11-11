import { pgTable, text, serial, integer, timestamp, json, decimal, boolean, jsonb, date as pgDate } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Define devices table for IoT device correlation
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  deviceToken: text("device_token").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  location: text("location"),
  status: text("status").default("active"),
  iotStatus: text("iot_status").default("disconnected"),
  lastReading: decimal("last_reading"),
  lastReadingUnit: text("last_reading_unit"),
  batteryLevel: integer("battery_level"),
  nextMaintenance: timestamp("next_maintenance"),
  hostname: text("hostname"),
  ipAddress: text("ip_address"),
  username: text("username"),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Additional columns for device management
  model: text("model"),
  serialNumber: text("serial_number"),
  firmwareVersion: text("firmware_version"),
  lastCalibration: timestamp("last_calibration"),
  calibrationDueDate: timestamp("calibration_due_date"),
  maintenanceNotes: text("maintenance_notes"),
  installationDate: timestamp("installation_date"),
  warrantyExpiry: timestamp("warranty_expiry"),
  manufacturer: text("manufacturer"),
  supplier: text("supplier"),
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: decimal("purchase_price"),
  notes: text("notes"),
  tags: jsonb("tags").array(),
  isActive: boolean("is_active").default(true),
  alertThresholds: jsonb("alert_thresholds"),
  customFields: jsonb("custom_fields"),
  wastePointId: integer("waste_point_id").references(() => wastePoints.id)
});

// Define images table for device image analysis
export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  imageId: text("image_id").notNull().unique(), // UUID stored as text
  deviceId: text("device_id").notNull().references(() => devices.deviceId),
  userId: integer("user_id").references(() => users.id),
  imageUrl: text("image_url"),
  roboflowResult: json("roboflow_result").$type<Record<string, any>>(),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Define sensor data table for storing sensor readings
export const sensorData = pgTable("sensor_data", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  
  // Computer vision data
  itemsDetected: jsonb("items_detected").$type<{
    item: string;
    confidence: number;
    count: number;
  }[]>(),
  
  // Fill level data
  fillLevel: decimal("fill_level"), // Percentage 0-100
  fillLevelUnit: text("fill_level_unit").default("percent"),
  distanceToTop: decimal("distance_to_top"), // Distance in cm
  distanceUnit: text("distance_unit").default("cm"),
  
  // Collection data
  lastCollected: timestamp("last_collected"),
  collectionFrequency: text("collection_frequency"), // daily, weekly, etc.
  
  // Additional sensor data
  temperature: decimal("temperature"),
  humidity: decimal("humidity"),
  batteryLevel: integer("battery_level"),
  
  // Metadata
  imageUrl: text("image_url"), // URL to captured image
  processingTime: integer("processing_time"), // Time taken to process in ms
  confidence: decimal("confidence"), // Overall confidence score
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Then define waste points that reference sensors
export const wastePoints = pgTable("waste_points", {
  id: serial("id").primaryKey(),
  process_step: text("process_step").notNull(),
  wasteType: text("waste_type").notNull(),
  estimatedVolume: decimal("estimated_volume").notNull(),
  unit: text("unit").notNull(),
  vendor: text("vendor").notNull(),
  notes: text("notes"),
  interval: text("interval").notNull().default('weekly'),
  locationData: jsonb("location_data").$type<{
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  }>(),
  deviceId: integer("device_id").references(() => devices.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Add after the wastePoints table definition
export const wastePointsRelations = relations(wastePoints, ({ one, many }) => ({
  device: one(devices, {
    fields: [wastePoints.deviceId],
    references: [devices.id],
  }),
  wasteAudits: many(wasteAudits),
}));

// Add after the wastePoints table definition and before the schedules table
export const wasteStreams = pgTable("waste_streams", {
  id: serial("id").primaryKey(),
  wastePointId: integer("waste_point_id").references(() => wastePoints.id),
  streamType: text("stream_type").notNull(), // 'plastics', 'metals', 'paper', 'organic', 'comingled', 'other'
  quantity: decimal("quantity").notNull(),
  unit: text("unit").notNull(),
  processingPath: text("processing_path").notNull(), // 'recycling', 'landfill', 'energy_recovery', 'composting'
  processingEfficiency: decimal("processing_efficiency"), // Percentage of successful processing
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Define schedules after waste points
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  wasteTypes: jsonb("waste_types").$type<string[]>().notNull(),
  wastePointId: integer("waste_point_id").references(() => wastePoints.id).notNull(),
  vendor: text("vendor").notNull(),
  status: text("status").default("pending").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringInterval: integer("recurring_interval"),
  recurringUnit: text("recurring_unit"),
  recurringGroupId: text("recurring_group_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  plan: text("plan").default("starter").notNull(),
  maxUsers: integer("max_users").default(5).notNull(),
  billingEmail: text("billing_email").notNull(),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  status: text("status").default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAt: timestamp("cancel_at"),
  canceledAt: timestamp("canceled_at"),
  priceId: text("price_id").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Add after the subscriptions table and before the organization invites table
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  icon: text("icon").notNull(),
  features: jsonb("features").$type<string[]>().notNull(),
  documentationUrl: text("documentation_url"),
  providerUrl: text("provider_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const organizationIntegrations = pgTable("organization_integrations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  integrationId: integer("integration_id").references(() => integrations.id).notNull(),
  status: text("status").default("disconnected").notNull(), // connected, disconnected
  config: json("config").$type<Record<string, any>>(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Organization Invites table
export const organizationInvites = pgTable("organization_invites", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  email: text("email").notNull(),
  role: text("role").default("member").notNull(), // owner, admin, member
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  username: text("username"),
  organizationId: integer("organization_id").references(() => organizations.id),
  organizationRole: text("organization_role").default("member"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user"),
  userType: text("user_type").default("full").notNull(), // 'full' or 'lite'
  subscriptionPlan: text("subscription_plan"), // 'basic', 'pro', 'enterprise'
  subscriptionStatus: text("subscription_status"), // 'active', 'canceled', 'past_due'
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  phoneNumber: text("phone_number"),
  jobTitle: text("job_title"),
  department: text("department"),
  profileImage: text("profile_image"),
  lastLogin: timestamp("last_login"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").default("pending").notNull(),
  lastLogin: timestamp("last_login"),
  profileComplete: boolean("profile_complete").default(false),
  companyLogo: text("company_logo"),
  website: text("website"),
  primaryContact: text("primary_contact"),
  phone: text("phone"),
  address: text("address"),
  services: json("services").$type<string[]>().default(['General Waste']).notNull(),
  rating: integer("rating").default(0).notNull(),
  serviceAreas: json("service_areas").$type<string[]>().default([]).notNull(),
  certificationsAndCompliance: json("certifications_and_compliance").$type<string[]>().default([]).notNull(),
  onTimeRate: integer("on_time_rate").default(0).notNull(),
  recyclingEfficiency: integer("recycling_efficiency").default(0).notNull(),
  customerSatisfaction: integer("customer_satisfaction").default(0).notNull(),
  connectionStatus: text("connection_status").default("offline").notNull(),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Organization vendors junction table
export const organizationVendors = pgTable("organization_vendors", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id).notNull(),
  status: text("status").default("active").notNull(),
  contractStartDate: timestamp("contract_start_date").defaultNow(),
  contractEndDate: timestamp("contract_end_date"),
  contractTerms: text("contract_terms"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Certifications table
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  requirements: json("requirements").$type<string[]>().notNull(),
  validityPeriod: integer("validity_period").notNull(),
  industry: json("industry").$type<string[]>().notNull(),
  difficulty: text("difficulty").notNull(),
  provider: text("provider").notNull(),
  providerUrl: text("provider_url").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  cost: text("cost").notNull(),
  relevance: integer("relevance").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// User certifications junction table
export const userCertifications = pgTable("user_certifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  certificationId: integer("certification_id").references(() => certifications.id).notNull(),
  status: text("status").notNull().default("pending"),
  applicationDate: timestamp("application_date").defaultNow(),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Initiatives table
export const initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'circular', 'recycling', 'waste'
  status: text("status").notNull().default("planning"), // 'planning', 'active', 'completed', 'cancelled'
  startDate: timestamp("start_date").notNull(),
  targetDate: timestamp("target_date").notNull(),
  estimatedImpact: json("estimated_impact").$type<{
    wasteReduction: number;
    costSavings: number;
    carbonReduction: number;
  }>().notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  initiativeId: integer("initiative_id").references(() => initiatives.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("todo"), // 'todo', 'in_progress', 'completed', 'blocked'
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  progress: integer("progress").notNull().default(0),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  initiativeId: integer("initiative_id").references(() => initiatives.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetDate: timestamp("target_date").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const updates = pgTable("updates", {
  id: serial("id").primaryKey(),
  initiativeId: integer("initiative_id").references(() => initiatives.id).notNull(),
  updateType: text("update_type").notNull(),
  content: text("content").notNull(),
  metrics: json("metrics"), // Optional metrics data
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Define relations
export const deviceRelations = relations(devices, ({ one }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
  wastePoint: one(wastePoints, {
    fields: [devices.wastePointId],
    references: [wastePoints.id],
  })
}));

export const wastePointRelations = relations(wastePoints, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [wastePoints.organizationId],
    references: [organizations.id],
  }),
  wasteStreams: many(wasteStreams)
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  subscriptions: many(subscriptions),
  organizationVendors: many(organizationVendors),
  organizationIntegrations: many(organizationIntegrations),
  reportSettings: many(reportSettings)
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id]
  })
}));

export const certificationRelations = relations(certifications, ({ many }) => ({
  userCertifications: many(userCertifications)
}));

export const userCertificationRelations = relations(userCertifications, ({ one }) => ({
  user: one(users, {
    fields: [userCertifications.userId],
    references: [users.id],
  }),
  certification: one(certifications, {
    fields: [userCertifications.certificationId],
    references: [certifications.id],
  })
}));

export const integrationRelations = relations(integrations, ({ many }) => ({
  organizationIntegrations: many(organizationIntegrations)
}));

export const organizationIntegrationRelations = relations(organizationIntegrations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationIntegrations.organizationId],
    references: [organizations.id],
  }),
  integration: one(integrations, {
    fields: [organizationIntegrations.integrationId],
    references: [integrations.id],
  })
}));

export const vendorRelations = relations(vendors, ({ many }) => ({
  users: many(users),
  organizationVendors: many(organizationVendors)
}));

export const organizationVendorRelations = relations(organizationVendors, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationVendors.organizationId],
    references: [organizations.id],
  }),
  vendor: one(vendors, {
    fields: [organizationVendors.vendorId],
    references: [vendors.id],
  })
}));

export const initiativeRelations = relations(initiatives, ({ many, one }) => ({
  tasks: many(tasks),
  milestones: many(milestones),
  updates: many(updates),
  creator: one(users, {
    fields: [initiatives.createdBy],
    references: [users.id],
  })
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [tasks.initiativeId],
    references: [initiatives.id],
  }),
  assignee: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  })
}));

export const milestoneRelations = relations(milestones, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [milestones.initiativeId],
    references: [initiatives.id],
  })
}));

export const updateRelations = relations(updates, ({ one }) => ({
  initiative: one(initiatives, {
    fields: [updates.initiativeId],
    references: [initiatives.id],
  }),
  creator: one(users, {
    fields: [updates.createdBy],
    references: [users.id],
  })
}));

export const scheduleRelations = relations(schedules, ({ one }) => ({
  organization: one(organizations, {
    fields: [schedules.organizationId],
    references: [organizations.id],
  }),
  wastePoint: one(wastePoints, {
    fields: [schedules.wastePointId],
    references: [wastePoints.id],
  })
}));

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull(),
  vendorId: integer("vendor_id").references(() => vendors.id),
  customerName: text("customer_name"),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  totalAmount: decimal("total_amount").notNull(),
  status: text("status").default("pending").notNull(), // pending, paid, overdue
  notes: text("notes"),
  wastePoints: json("waste_points").$type<number[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const invoiceAttachments = pgTable("invoice_attachments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => users.id)
});

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [invoices.vendorId],
    references: [vendors.id],
  }),
  attachments: many(invoiceAttachments)
}));

export const invoiceAttachmentRelations = relations(invoiceAttachments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceAttachments.invoiceId],
    references: [invoices.id],
  }),
  uploader: one(users, {
    fields: [invoiceAttachments.uploadedBy],
    references: [users.id],
  })
}));

export const insertInvoiceSchema = createInsertSchema(invoices);
export const selectInvoiceSchema = createSelectSchema(invoices);
export type InsertInvoice = typeof invoices.$inferInsert;
export type SelectInvoice = typeof invoices.$inferSelect;

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price").notNull(),
  category: text("category").notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  inStock: boolean("in_stock").default(true).notNull(),
  imageUrl: text("image_url").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const productRelations = relations(products, ({ one }) => ({
  // Add relations if needed in the future
}));

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = typeof products.$inferInsert;
export type SelectProduct = typeof products.$inferSelect;

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  targetPercentage: integer("target_percentage").notNull(),
  currentPercentage: integer("current_percentage").default(0).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("in_progress").notNull(), // 'completed', 'in_progress', 'failed'
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const goalRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  })
}));

export const insertGoalSchema = createInsertSchema(goals);
export const selectGoalSchema = createSelectSchema(goals);
export type InsertGoal = typeof goals.$inferInsert;
export type SelectGoal = typeof goals.$inferSelect;

export const storedLocations = pgTable("stored_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  placeId: text("place_id").notNull(),
  lat: decimal("lat").notNull(),
  lng: decimal("lng").notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const storedLocationRelations = relations(storedLocations, ({ one }) => ({
  organization: one(organizations, {
    fields: [storedLocations.organizationId],
    references: [organizations.id],
  })
}));

export const insertStoredLocationSchema = createInsertSchema(storedLocations);
export const selectStoredLocationSchema = createSelectSchema(storedLocations);
export type InsertStoredLocation = typeof storedLocations.$inferInsert;
export type SelectStoredLocation = typeof storedLocations.$inferSelect;

export const carbonImpact = pgTable("carbon_impact", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  wasteReduction: decimal("waste_reduction").notNull(),
  carbonSavings: decimal("carbon_savings").notNull(),
  energySavings: decimal("energy_savings").notNull(),
  costSavings: decimal("cost_savings").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const carbonImpactRelations = relations(carbonImpact, ({ one }) => ({
  organization: one(organizations, {
    fields: [carbonImpact.organizationId],
    references: [carbonImpact.organizationId],
  })
}));

export const insertCarbonImpactSchema = createInsertSchema(carbonImpact);
export const selectCarbonImpactSchema = createSelectSchema(carbonImpact);
export type InsertCarbonImpact = typeof carbonImpact.$inferInsert;
export type SelectCarbonImpact = typeof carbonImpact.$inferSelect;

export const sustainabilityMetrics = pgTable("sustainability_metrics", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  metricType: text("metric_type").notNull(), // Changed from varchar(50) to text
  value: decimal("value").notNull(), // Changed from numeric(10,2) to numeric
  timestamp: timestamp("timestamp").defaultNow().notNull(), // Changed from timestamp with time zone
  createdAt: timestamp("created_at").defaultNow(), // Changed from timestamp with time zone
  updatedAt: timestamp("updated_at").defaultNow() // Changed from timestamp with time zone
});

export const sustainabilityMetricsRelations = relations(sustainabilityMetrics, ({ one }) => ({
  organization: one(organizations, {
    fields: [sustainabilityMetrics.organizationId],
    references: [sustainabilityMetrics.organizationId],
  })
}));

export const insertSustainabilityMetricSchema = createInsertSchema(sustainabilityMetrics);
export const selectSustainabilityMetricSchema = createSelectSchema(sustainabilityMetrics);
export type InsertSustainabilityMetric = typeof sustainabilityMetrics.$inferInsert;
export type SelectSustainabilityMetric = typeof sustainabilityMetrics.$inferSelect;

type CalculatorField = {
    name: string;
    type: string;
    label: string;
    description?: string;
    options?: string[];
    required?: boolean;
};

type CalculatorFormula = {
    name: string;
    formula: string;
    description?: string;
};

export const calculatorConfigs = pgTable("calculator_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  waste_types: jsonb("waste_types").$type<CalculatorField[]>().notNull(),
  additional_fees: jsonb("additional_fees").$type<CalculatorFormula[]>().notNull(),
  fields: jsonb("fields").$type<CalculatorField[]>(),
  formulas: jsonb("formulas").$type<CalculatorFormula[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const calculatorConfigRelations = relations(calculatorConfigs, ({ one }) => ({
  // Add relations if needed in the future
}));

export const insertCalculatorConfigSchema = createInsertSchema(calculatorConfigs);
export const selectCalculatorConfigSchema = createSelectSchema(calculatorConfigs);
export type InsertCalculatorConfig = typeof calculatorConfigs.$inferInsert;
export type SelectCalculatorConfig = typeof calculatorConfigs.$inferSelect;

// Add to the existing schema file
export const analyticsConfigs = pgTable("analytics_configs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id),
  type: text("type").notNull(), // 'chart', 'analysis', 'report'
  name: text("name").notNull(),
  config: jsonb("config").$type<{
    chartType?: string;
    metrics?: string[];
    timeframe?: string;
    analysisType?: string;
    description?: string;
    reportSchedule?: string;
  }>().notNull(),
  active: boolean("active").default(true),
  schedule: text("schedule"), // For scheduled analysis refreshes
  lastRefreshed: timestamp("last_refreshed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  is_standard: boolean("is_standard").default(false)
});

export const analyticsConfigRelations = relations(analyticsConfigs, ({ one }) => ({
  organization: one(organizations, {
    fields: [analyticsConfigs.organizationId],
    references: [analyticsConfigs.organizationId],
  })
}));

export const insertAnalyticsConfigSchema = createInsertSchema(analyticsConfigs);
export const selectAnalyticsConfigSchema = createSelectSchema(analyticsConfigs);
export type InsertAnalyticsConfig = typeof analyticsConfigs.$inferInsert;
export type SelectAnalyticsConfig = typeof analyticsConfigs.$inferSelect;

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., 'Sensor Offline', 'High Fill Level', etc.
  targetType: text("target_type").notNull(), // 'sensor' or 'waste_point'
  targetId: integer("target_id"), // FK to devices or waste_points (nullable for org-wide alerts)
  condition: text("condition").notNull(), // e.g., '>', '=', 'no data for'
  threshold: text("threshold").notNull(), // e.g., '80%', '30 min'
  notificationMethod: text("notification_method").notNull(), // 'Email', 'SMS', 'In-app'
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const alertRelations = relations(alerts, ({ one }) => ({
  organization: one(organizations, {
    fields: [alerts.organizationId],
    references: [organizations.id],
  })
}));

export const insertAlertSchema = createInsertSchema(alerts);
export const selectAlertSchema = createSelectSchema(alerts);
export type InsertAlert = typeof alerts.$inferInsert;
export type SelectAlert = typeof alerts.$inferSelect;

export const insertUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  username: z.string().optional(),
  organizationId: z.number().optional(),
  organizationRole: z.enum(["owner", "admin", "member"]).default("member"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["user", "vendor", "admin"]).default("user"),
  userType: z.enum(["full", "lite"]).default("full"),
  subscriptionPlan: z.enum(["basic", "pro", "enterprise"]).optional(),
  subscriptionStatus: z.enum(["active", "canceled", "past_due"]).optional(),
  subscriptionId: z.number().optional(),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
});

export const insertInitiativeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["circular", "recycling", "waste"]),
  startDate: z.string().min(1, "Start date is required"),
  targetDate: z.string().min(1, "Target date is required"),
  estimatedImpact: z.object({
    wasteReduction: z.number().min(0),
    costSavings: z.number().min(0),
    carbonReduction: z.number().min(0)
  })
});

export const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startDate: z.string().min(1, "Start date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "medium", "high"]),
  assignedTo: z.number().optional()
});

export const insertCertificationSchema = createInsertSchema(certifications);
export const selectCertificationSchema = createSelectSchema(certifications);

export const insertUserCertificationSchema = createInsertSchema(userCertifications);
export const selectUserCertificationSchema = createSelectSchema(userCertifications);

export const selectUserSchema = createSelectSchema(users);
export const selectInitiativeSchema = createSelectSchema(initiatives);
export const selectTaskSchema = createSelectSchema(tasks);
export const selectMilestoneSchema = createSelectSchema(milestones);
export const selectUpdateSchema = createSelectSchema(updates);

export const insertOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  billingEmail: z.string().email("Valid billing email is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  logo: z.string().optional()
});

export const insertSubscriptionSchema = z.object({
  priceId: z.string(),
  quantity: z.number().min(1)
});

export const insertOrganizationInviteSchema = z.object({
  organizationId: z.number(),
  email: z.string().email("Valid email is required"),
  role: z.enum(["owner", "admin", "member"]).default("member")
});

export const insertOrganizationVendorSchema = createInsertSchema(organizationVendors);
export const selectOrganizationVendorSchema = createSelectSchema(organizationVendors);

export const insertVendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  services: z.array(z.string()),
  serviceAreas: z.array(z.string()),
  certificationsAndCompliance: z.array(z.string()),
  rating: z.number().min(0).max(5),
  onTimeRate: z.number().min(0).max(100),
  recyclingEfficiency: z.number().min(0).max(100),
  customerSatisfaction: z.number().min(0).max(100),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  primaryContact: z.string().optional(),
});

export const selectVendorSchema = createSelectSchema(vendors);

export const insertSensorSchema = z.object({
  name: z.string().min(1, "Sensor name is required"),
  type: z.string().min(1, "Sensor type is required"),
  location: z.string().optional(),
  status: z.string().optional().default("active"),
  lastReading: z.number().optional(),
  lastReadingUnit: z.string().optional(),
  accessCode: z.string().optional(),
  connectionStatus: z.string().optional().default("disconnected"),
  organizationId: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const selectSensorSchema = createSelectSchema(devices);
export const insertWastePointSchema = createInsertSchema(wastePoints);
export const selectWastePointSchema = createSelectSchema(wastePoints);
export const insertScheduleSchema = createInsertSchema(schedules);
export const selectScheduleSchema = createSelectSchema(schedules);

export const insertIntegrationSchema = createInsertSchema(integrations);
export const selectIntegrationSchema = createSelectSchema(integrations);
export type InsertIntegration = typeof integrations.$inferInsert;
export type SelectIntegration = typeof integrations.$inferSelect;

export const insertOrganizationIntegrationSchema = createInsertSchema(organizationIntegrations);
export const selectOrganizationIntegrationSchema = createSelectSchema(organizationIntegrations);
export type InsertOrganizationIntegration = typeof organizationIntegrations.$inferInsert;
export type SelectOrganizationIntegration = typeof organizationIntegrations.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertInitiative = typeof initiatives.$inferInsert;
export type SelectInitiative = typeof initiatives.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type SelectTask = typeof tasks.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;
export type SelectMilestone = typeof milestones.$inferSelect;
export type InsertUpdate = typeof updates.$inferInsert;
export type SelectUpdate = typeof updates.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;
export type SelectCertification = typeof certifications.$inferSelect;
export type InsertUserCertification = typeof userCertifications.$inferInsert;
export type SelectUserCertification = typeof userCertifications.$inferSelect;

export type InsertOrganization = typeof organizations.$inferInsert;
export type SelectOrganization = typeof organizations.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type SelectSubscription = typeof subscriptions.$inferSelect;
export type InsertOrganizationInvite = typeof organizationInvites.$inferInsert;
export type SelectOrganizationInvite = typeof organizationInvites.$inferSelect;

export type InsertOrganizationVendor = typeof organizationVendors.$inferInsert;
export type SelectOrganizationVendor = typeof organizationVendors.$inferSelect;

export type InsertVendor = typeof vendors.$inferInsert;
export type SelectVendor = typeof vendors.$inferSelect;
export type InsertSensor = typeof devices.$inferInsert;
export type SelectSensor = typeof devices.$inferSelect;
export type InsertSchedule = typeof schedules.$inferInsert;
export type SelectSchedule = typeof schedules.$inferSelect;

// Add after existing relations declarations
export const wasteStreamRelations = relations(wasteStreams, ({ one }) => ({
  wastePoint: one(wastePoints, {
    fields: [wasteStreams.wastePointId],
    references: [wasteStreams.wastePointId],
  })
}));


// Add schema exports
export const insertWasteStreamSchema = createInsertSchema(wasteStreams);
export const selectWasteStreamSchema = createSelectSchema(wasteStreams);
export type InsertWasteStream = typeof wasteStreams.$inferInsert;
export type SelectWasteStream = typeof wasteStreams.$inferSelect;

// Add after existing table definitions
export const reportSettings = pgTable("report_settings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  headerAlignment: text("header_alignment").default("left").notNull(),
  includeTimestamp: boolean("include_timestamp").default(true).notNull(),
  includePagination: boolean("include_pagination").default(true).notNull(),
  watermarkOpacity: decimal("watermark_opacity").default("0.1").notNull(),
  includeWatermark: boolean("include_watermark").default(true).notNull(),
  footerText: text("footer_text"),
  defaultColorScheme: text("default_color_scheme").default("default").notNull(),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyContact: text("company_contact"),
  companyWebsite: text("company_website"),
  companyLogo: text("company_logo"),
  headerStyle: text("header_style").default("standard").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const reportSettingsRelations = relations(reportSettings, ({ one }) => ({
  organization: one(organizations, {
    fields: [reportSettings.organizationId],
    references: [reportSettings.organizationId],
  })
}));

// Add schema types for report settings
export const insertReportSettingsSchema = createInsertSchema(reportSettings);
export const selectReportSettingsSchema = createSelectSchema(reportSettings);
export type InsertReportSettings = typeof reportSettings.$inferInsert;
export type SelectReportSettings = typeof reportSettings.$inferSelect;

// Add schema types for images
export const insertImageSchema = createInsertSchema(images);
export const selectImageSchema = createSelectSchema(images);
export type InsertImage = typeof images.$inferInsert;
export type SelectImage = typeof images.$inferSelect;

// Add relations for images
export const imageRelations = relations(images, ({ one }) => ({
  device: one(devices, {
    fields: [images.deviceId],
    references: [images.deviceId],
  }),
  user: one(users, {
    fields: [images.userId],
    references: [images.userId],
  })
}));

// Export types
export type InsertDevice = typeof devices.$inferInsert;
export type SelectDevice = typeof devices.$inferSelect;

// Add after the wastePoints table definition
export type InsertWastePoint = typeof wastePoints.$inferInsert;
export type SelectWastePoint = typeof wastePoints.$inferSelect;

// API Tokens table for user authentication
export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wasteAudits = pgTable("waste_audits", {
  id: serial("id").primaryKey(),
  wastePointId: integer("waste_point_id").references(() => wastePoints.id).notNull(),
  date: pgDate("date").notNull(),
  auditor: text("auditor").notNull(),
  wasteType: text("waste_type").notNull(),
  volume: decimal("volume").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wasteAuditsRelations = relations(wasteAudits, ({ one }) => ({
  wastePoint: one(wastePoints, {
    fields: [wasteAudits.wastePointId],
    references: [wastePoints.id],
  }),
}));

// Data Models table for storing data model info
export const dataModels = pgTable("data_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // waste, environmental, material, lca, carbon, cost, cv
  source: text("source").notNull(), // internal, ecoinvent, external
  lastUpdated: timestamp("last_updated").defaultNow(),
  version: text("version").notNull(),
  status: text("status").notNull(), // in progress, inactive, archived
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  builderConfig: jsonb("builder_config"),
});

export type InsertDataModel = typeof dataModels.$inferInsert;
export type SelectDataModel = typeof dataModels.$inferSelect;