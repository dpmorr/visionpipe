import { relations } from "drizzle-orm/relations";
import { organizations, subscriptions, organizationInvites, storedLocations, users, vendors, carbonImpact, initiatives, milestones, tasks, updates, wastePoints, goals, organizationVendors, userCertifications, certifications, schedules, invoices, organizationIntegrations, integrations, wasteStreams, analyticsConfigs, reportSettings, devices, images } from "./schema";

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	organization: one(organizations, {
		fields: [subscriptions.organizationId],
		references: [organizations.id]
	}),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	subscriptions: many(subscriptions),
	organizationInvites: many(organizationInvites),
	storedLocations: many(storedLocations),
	users: many(users),
	carbonImpacts: many(carbonImpact),
	wastePoints: many(wastePoints),
	organizationVendors: many(organizationVendors),
	schedules: many(schedules),
	organizationIntegrations: many(organizationIntegrations),
	analyticsConfigs: many(analyticsConfigs),
	reportSettings: many(reportSettings),
}));

export const organizationInvitesRelations = relations(organizationInvites, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationInvites.organizationId],
		references: [organizations.id]
	}),
}));

export const storedLocationsRelations = relations(storedLocations, ({one}) => ({
	organization: one(organizations, {
		fields: [storedLocations.organizationId],
		references: [organizations.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	organization: one(organizations, {
		fields: [users.organizationId],
		references: [organizations.id]
	}),
	vendor: one(vendors, {
		fields: [users.vendorId],
		references: [vendors.id]
	}),
	tasks: many(tasks),
	initiatives: many(initiatives),
	updates: many(updates),
	goals: many(goals),
	userCertifications: many(userCertifications),
	images: many(images),
	devices: many(devices),
}));

export const vendorsRelations = relations(vendors, ({many}) => ({
	users: many(users),
	organizationVendors: many(organizationVendors),
	invoices: many(invoices),
}));

export const carbonImpactRelations = relations(carbonImpact, ({one}) => ({
	organization: one(organizations, {
		fields: [carbonImpact.organizationId],
		references: [organizations.id]
	}),
}));

export const milestonesRelations = relations(milestones, ({one}) => ({
	initiative: one(initiatives, {
		fields: [milestones.initiativeId],
		references: [initiatives.id]
	}),
}));

export const initiativesRelations = relations(initiatives, ({one, many}) => ({
	milestones: many(milestones),
	tasks: many(tasks),
	user: one(users, {
		fields: [initiatives.createdBy],
		references: [users.id]
	}),
	updates: many(updates),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	initiative: one(initiatives, {
		fields: [tasks.initiativeId],
		references: [initiatives.id]
	}),
	user: one(users, {
		fields: [tasks.assignedTo],
		references: [users.id]
	}),
}));

export const updatesRelations = relations(updates, ({one}) => ({
	initiative: one(initiatives, {
		fields: [updates.initiativeId],
		references: [initiatives.id]
	}),
	user: one(users, {
		fields: [updates.createdBy],
		references: [users.id]
	}),
}));

export const wastePointsRelations = relations(wastePoints, ({one, many}) => ({
	organization: one(organizations, {
		fields: [wastePoints.organizationId],
		references: [organizations.id]
	}),
	wasteStreams: many(wasteStreams),
}));

export const goalsRelations = relations(goals, ({one}) => ({
	user: one(users, {
		fields: [goals.userId],
		references: [users.id]
	}),
}));

export const organizationVendorsRelations = relations(organizationVendors, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationVendors.organizationId],
		references: [organizations.id]
	}),
	vendor: one(vendors, {
		fields: [organizationVendors.vendorId],
		references: [vendors.id]
	}),
}));

export const userCertificationsRelations = relations(userCertifications, ({one}) => ({
	user: one(users, {
		fields: [userCertifications.userId],
		references: [users.id]
	}),
	certification: one(certifications, {
		fields: [userCertifications.certificationId],
		references: [certifications.id]
	}),
}));

export const certificationsRelations = relations(certifications, ({many}) => ({
	userCertifications: many(userCertifications),
}));

export const schedulesRelations = relations(schedules, ({one}) => ({
	organization: one(organizations, {
		fields: [schedules.organizationId],
		references: [organizations.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one}) => ({
	vendor: one(vendors, {
		fields: [invoices.vendorId],
		references: [vendors.id]
	}),
}));

export const organizationIntegrationsRelations = relations(organizationIntegrations, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationIntegrations.organizationId],
		references: [organizations.id]
	}),
	integration: one(integrations, {
		fields: [organizationIntegrations.integrationId],
		references: [integrations.id]
	}),
}));

export const integrationsRelations = relations(integrations, ({many}) => ({
	organizationIntegrations: many(organizationIntegrations),
}));

export const wasteStreamsRelations = relations(wasteStreams, ({one}) => ({
	wastePoint: one(wastePoints, {
		fields: [wasteStreams.wastePointId],
		references: [wastePoints.id]
	}),
}));

export const analyticsConfigsRelations = relations(analyticsConfigs, ({one}) => ({
	organization: one(organizations, {
		fields: [analyticsConfigs.organizationId],
		references: [organizations.id]
	}),
}));

export const reportSettingsRelations = relations(reportSettings, ({one}) => ({
	organization: one(organizations, {
		fields: [reportSettings.organizationId],
		references: [organizations.id]
	}),
}));

export const imagesRelations = relations(images, ({one}) => ({
	device: one(devices, {
		fields: [images.deviceId],
		references: [devices.deviceId]
	}),
	user: one(users, {
		fields: [images.userId],
		references: [users.id]
	}),
}));

export const devicesRelations = relations(devices, ({one, many}) => ({
	images: many(images),
	user: one(users, {
		fields: [devices.userId],
		references: [users.id]
	}),
}));