import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { wastePoints, vendors, storedLocations, sustainabilityMetrics, reportSettings } from "@db/schema";
import { eq } from "drizzle-orm";
import organizationRoutes from "./routes/organizations";
import organizationInvitesRouter from "./routes/organization-invites";
import carbonImpactRouter from "./routes/carbon-impact";
import subscriptionRouter from "./routes/subscription";
import invoicesRouter from "./routes/invoices";
import express, { Router } from "express";
import PDFDocument from "pdfkit";
import type { PDFKit } from "pdfkit";
import {
  users,
  initiatives,
  tasks,
  milestones,
  updates,
  certifications,
  userCertifications,
  organizations,
  organizationVendors,
  goals,
  products,
  schedules,
} from "@db/schema";
import { eq as eq2, inArray, gte, and } from "drizzle-orm";
import { mockInsights } from "./insights";
import { generateInsights, fetchNews } from "./openai";
import { analyzeMaterial } from "./openai";
import { openai } from "./openai";
import { generateRecommendation } from "./openai";
import crypto from "crypto";
import { insertVendorSchema, vendorLoginSchema } from "./schemas";
import certificationsRouter from "./routes/certifications";
import productsRouter from "./routes/products";
import schedulesRouter from "./routes/schedules";
import metricsRouter from "./routes/metrics";
import goalsRouter from './routes/goals';
import { sql } from 'drizzle-orm';
import integrationsRouter from "./routes/integrations";
import calculatorRouter from "./routes/admin/calculator";
import adminRouter from "./routes/admin";
import analyticsConfigsRouter from "./routes/analytics-configs";
import organizationRouter from "./routes/organization";
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import type { InsertWastePoint } from "@db/schema";
import devicesRouter from "./routes/admin/devices";
import apiTokensRouter from "./routes/api-tokens";
import wasteAuditsRouter from './routes/waste-audits';
import alertsRouter from "./routes/alerts";
import dataModelsRouter from "./routes/data-models";

// Create Express application instance
const app = express();

// Utility interfaces and data
interface ReportData {
  waste: {
    total: number;
    recycled: number;
    disposed: number;
    byType: Record<string, number>;
  };
  recycling: {
    rate: number;
    improvement: number;
    savings: number;
    topMaterials: Array<{ name: string; value: number }>;
  };
  costs: {
    total: number;
    byCategory: Record<string, number>;
    savings: Record<string, number>;
  };
}

const reportData: ReportData = {
  waste: {
    total: 1250,
    recycled: 875,
    disposed: 375,
    byType: {
      general: 450,
      recyclable: 525,
      hazardous: 275,
    },
  },
  recycling: {
    rate: 0.7,
    improvement: 0.15,
    savings: 12500,
    topMaterials: [
      { name: "Paper", value: 300 },
      { name: "Plastic", value: 250 },
      { name: "Metal", value: 200 },
      { name: "Glass", value: 125 },
    ],
  },
  costs: {
    total: 45000,
    byCategory: {
      disposal: 15000,
      recycling: 20000,
      transportation: 10000,
    },
    savings: {
      recycling: 8000,
      optimization: 4500,
    },
  },
};

// Register all routes
export function registerRoutes(app: Express): Server {
  // Add this near the top of your route registrations to ensure it's properly mounted
  console.log('📝 Registering invoice routes at /api/invoices');
  app.use("/api/invoices", invoicesRouter);
  console.log('📝 Registering metrics routes at /api/metrics');
  app.use("/api/metrics", metricsRouter);
  app.use("/api/integrations", integrationsRouter);
  console.log('📝 Registering analytics config routes at /api/analytics/configs');
  app.use("/api/analytics/configs", analyticsConfigsRouter);

  // Register routes
  app.use("/api/devices", devicesRouter);
  app.use("/api/api-tokens", apiTokensRouter);
  app.use("/api", productsRouter);
  app.use("/api/goals", goalsRouter);
  app.use("/api/schedules", schedulesRouter);
  app.use("/api/carbon-impact", carbonImpactRouter);
  app.use("/api", subscriptionRouter);

  // Register organization routes
  app.use("/api/organizations", organizationRoutes);

  // Register organization invite routes
  app.use("/api/organization", organizationInvitesRouter);
  app.use("/api/organization", organizationRouter);

  // Add certifications routes
  app.use("/api", certificationsRouter);
  
  // Add data models routes
  app.use("/api/data-models", dataModelsRouter);

  // Add logo upload endpoint
  const uploadDir = 'public/uploads/company-logos';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

  /**
   * @openapi
   * /api/organization/logo:
   *   post:
   *     summary: Upload organization logo
   *     description: Upload a logo file for the organization and update report settings
   *     tags: [Organization]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required:
   *               - logo
   *             properties:
   *               logo:
   *                 type: string
   *                 format: binary
   *                 description: Logo image file
   *     responses:
   *       200:
   *         description: Logo uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 filename:
   *                   type: string
   *                   description: Generated filename
   *                 url:
   *                   type: string
   *                   description: URL path to the uploaded logo
   *       400:
   *         description: No file uploaded
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *       401:
   *         description: Not authorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   */
  app.post("/api/organization/logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        fs.unlinkSync(path.join(uploadDir, req.file.filename));
        return res.status(401).json({ error: "Not authorized" });
      }

      const settings = await db.query.reportSettings.findFirst({
        where: eq(reportSettings.organizationId, organizationId)
      });

      if (settings?.companyLogo) {
        const oldLogoPath = path.join(uploadDir, settings.companyLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      const [updatedSettings] = await db
        .update(reportSettings)
        .set({ 
          companyLogo: req.file.filename,
          updatedAt: new Date()
        })
        .where(eq(reportSettings.organizationId, organizationId))
        .returning();

      // Return the full URL path for the uploaded logo
      const logoUrl = `/uploads/company-logos/${req.file.filename}`;
      res.json({ 
        filename: req.file.filename,
        url: logoUrl
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      if (req.file) {
        fs.unlinkSync(path.join(uploadDir, req.file.filename));
      }
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  // Add waste points endpoints
  /**
   * @openapi
   * /api/waste-points:
   *   get:
   *     summary: Get all waste points
   *     description: Retrieve all waste points for the organization with device information
   *     tags: [Waste Points]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of waste points
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/WastePoint'
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */
  app.get("/api/waste-points", async (req, res) => {
    try {
      console.log("Fetching waste points...");

      const points = await db.query.wastePoints.findMany({
        with: {
          device: true,
        },
        orderBy: wastePoints.createdAt,
      });

      console.log(`Found ${points.length} waste points:`, points);
      res.json(points);
    } catch (error) {
      console.error("Error fetching waste points:", error);
      res.status(500).json({
        message: "Failed to fetch waste points",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * @openapi
   * /api/waste-points:
   *   post:
   *     summary: Create a new waste point
   *     description: Create a new waste point with process step, waste type, and vendor information
   *     tags: [Waste Points]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - processStep
   *               - wasteType
   *               - estimatedVolume
   *               - unit
   *               - vendor
   *             properties:
   *               processStep:
   *                 type: string
   *                 description: The process step name
   *               wasteType:
   *                 type: string
   *                 description: Type of waste
   *               estimatedVolume:
   *                 type: number
   *                 description: Estimated volume of waste
   *               unit:
   *                 type: string
   *                 description: Unit of measurement
   *               vendor:
   *                 type: string
   *                 description: Vendor name
   *               notes:
   *                 type: string
   *                 description: Additional notes
   *               locationData:
   *                 type: object
   *                 description: Location information
   *               deviceId:
   *                 type: number
   *                 description: Associated device ID
   *     responses:
   *       201:
   *         description: Waste point created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/WastePoint'
   *       400:
   *         description: Bad request - missing required fields or invalid content type
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 missingFields:
   *                   type: array
   *                   items:
   *                     type: string
   *       401:
   *         description: Not authorized
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 error:
   *                   type: string
   */
  app.post("/api/waste-points", async (req, res) => {
    try {
      console.log("Creating waste point with data:", req.body);

      // Validate content-type
      if (!req.is("application/json")) {
        return res.status(400).json({
          message: "Invalid content type. Expected application/json",
        });
      }

      // Validate required fields
      const requiredFields = [
        "processStep",
        "wasteType",
        "estimatedVolume",
        "unit",
        "vendor",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "Missing required fields",
          missingFields,
        });
      }

      const {
        processStep,
        wasteType,
        estimatedVolume,
        unit,
        vendor,
        notes,
        locationData,
        deviceId,
      } = req.body;

      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({
          message: "No organization associated with user",
        });
      }

      const wastePointData: InsertWastePoint = {
        process_step: processStep,
        name: processStep, // Add name field with same value as process_step
        wasteType,
        estimatedVolume: parseFloat(estimatedVolume),
        unit,
        vendor,
        notes: notes || undefined,
        locationData,
        deviceId: deviceId ? Number(deviceId) : undefined,
        organizationId,
      };

      const [newWastePoint] = await db
        .insert(wastePoints)
        .values(wastePointData)
        .returning();

      // Fetch complete waste point data
      const wastePoint = await db.query.wastePoints.findFirst({
        where: eq(wastePoints.id, newWastePoint.id),
        with: {
          device: true,
        },
      });

      res.status(201).json(wastePoint);
    } catch (error) {
      console.error("Error creating waste point:", error);
      res.status(500).json({
        message: "Failed to create waste point",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.patch("/api/waste-points/:id", async (req, res) => {
    try {
      console.log("Updating waste point with data:", req.body);

      const [updatedPoint] = await db
        .update(wastePoints)
        .set({
          process_step: req.body.process_step,
          wasteType: req.body.wasteType,
          estimatedVolume: req.body.estimatedVolume,
          unit: req.body.unit,
          vendor: req.body.vendor,
          notes: req.body.notes,
          locationData: req.body.locationData,
          deviceId: req.body.deviceId ? Number(req.body.deviceId) : undefined,
          interval: req.body.interval,
          updatedAt: new Date(),
        })
        .where(eq(wastePoints.id, parseInt(req.params.id)))
        .returning();

      if (!updatedPoint) {
        return res.status(404).json({ message: "Waste point not found" });
      }

      console.log("Updated waste point:", updatedPoint);

      // Fetch the complete waste point with device data
      const pointWithDevice = await db.query.wastePoints.findFirst({
        where: eq(wastePoints.id, updatedPoint.id),
        with: {
          device: true,
        },
      });

      console.log("Fetched updated point with device:", pointWithDevice);
      res.json(pointWithDevice);
    } catch (error) {
      console.error("Error updating waste point:", error);
      res.status(500).json({ message: "Failed to update waste point" });
    }
  });

  app.delete("/api/waste-points/:id", async (req, res) => {
    try {
      const [deletedPoint] = await db
        .delete(wastePoints)
        .where(eq(wastePoints.id, parseInt(req.params.id)))
        .returning();

      if (!deletedPoint) {
        return res.status(404).json({ message: "Waste point not found" });
      }

      res.json({ message: "Waste point deleted successfully" });
    } catch (error) {
      console.error("Error deleting waste point:", error);
      res.status(500).json({ message: "Failed to delete waste point" });
    }
  });

  // Goals endpoints
  app.get("/api/goals", async (req, res) => {
    try {
      const goalsData = await db.query.goals.findMany({
        orderBy: (goals, { desc }) => [desc(goals.createdAt)],
      });
      res.json(goalsData);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post("/api/goals", async (req, res) => {
    try {
      const {
        type,
        description,
        targetPercentage,
        startDate,
        endDate,
        userId,
      } = req.body;

      // Validate dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      if (parsedStartDate >= parsedEndDate) {
        return res
          .status(400)
          .json({ message: "Start date must be before end date" });
      }

      // Validate target percentage
      if (
        typeof targetPercentage !== "number" ||
        targetPercentage < 0 ||
        targetPercentage > 100
      ) {
        return res
          .status(400)
          .json({ message: "Target percentage must be between 0 and 100" });
      }

      const [newGoal] = await db
        .insert(goals)
        .values({
          type,
          description,
          targetPercentage,
          currentPercentage: 0,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          status: "in_progress",
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newGoal);
    } catch (error) {
      console.error("Error creating goal:", error);
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  app.get("/api/goals/:id", async (req, res) => {
    try {
      const goal = await db.query.goals.findFirst({
        where: eq(goals.id, parseInt(req.params.id)),
      });

      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }

      res.json(goal);
    } catch (error) {
      console.error("Error fetching goal:", error);
      res.status(500).json({ message: "Failed to fetch goal" });
    }
  });

  // Add admin-specific endpoints
  app.get("/api/admin/vendors", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const allVendors = await db.query.vendors.findMany({
        orderBy: vendors.createdAt,
      });
      res.json(allVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.post("/api/admin/vendors", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [newVendor] = await db
        .insert(vendors)
        .values({
          name: req.body.name,
          services: req.body.services,
          serviceAreas: req.body.serviceAreas,
          rating: req.body.rating || 0,
          certificationsAndCompliance: req.body.certificationsAndCompliance || [],
          onTimeRate: req.body.onTimeRate || 0,
          recyclingEfficiency: req.body.recyclingEfficiency || 0,
          customerSatisfaction: req.body.customerSatisfaction || 0,
          connectionStatus: req.body.connectionStatus || "offline",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newVendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.put("/api/admin/vendors/:id", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [updatedVendor] = await db
        .update(vendors)
        .set({
          name: req.body.name,
          description: req.body.description,
          services: req.body.services,
          serviceAreas: req.body.serviceAreas,
          rating: req.body.rating,
          certificationsAndCompliance: req.body.certificationsAndCompliance,
          contactInfo: req.body.contactInfo,
          pricingTiers: req.body.pricingTiers,
          updatedAt: new Date(),
        })
        .where(eq(vendors.id, parseInt(req.params.id)))
        .returning();

      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json(updatedVendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete("/api/admin/vendors/:id", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [deletedVendor] = await db
        .delete(vendors)
        .where(eq(vendors.id, parseInt(req.params.id)))
        .returning();

      if (!deletedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      res.json({ message: "Vendor deleted successfully" });
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // Certifications admin endpoints
  app.get("/api/admin/certifications", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const allCertifications = await db.query.certifications.findMany({
        orderBy: certifications.createdAt,
      });
      res.json(allCertifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  app.post("/api/admin/certifications", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [newCertification] = await db
        .insert(certifications)
        .values({
          name: req.body.name,
          provider: req.body.provider,
          description: req.body.description,
          requirements: req.body.requirements,
          validityPeriod: req.body.validityPeriod,
          difficulty: req.body.difficulty,
          relevance: req.body.relevance || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newCertification);
    } catch (error) {
      console.error("Error creating certification:", error);
      res.status(500).json({ message: "Failed to create certification" });
    }
  });

  app.put("/api/admin/certifications/:id", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [updatedCertification] = await db
        .update(certifications)
        .set({
          name: req.body.name,
          provider: req.body.provider,
          description: req.body.description,
          requirements: req.body.requirements,
          validityPeriod: req.body.validityPeriod,
          difficulty: req.body.difficulty,
          relevance: req.body.relevance,
          updatedAt: new Date(),
        })
        .where(eq(certifications.id, parseInt(req.params.id)))
        .returning();

      if (!updatedCertification) {
        return res.status(404).json({ message: "Certification not found" });
      }

      res.json(updatedCertification);
    } catch (error) {
      console.error("Error updating certification:", error);
      res.status(500).json({ message: "Failed to update certification" });
    }
  });

  app.delete("/api/admin/certifications/:id", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [deletedCertification] = await db
        .delete(certifications)
        .where(eq(certifications.id, parseInt(req.params.id)))
        .returning();

      if (!deletedCertification) {
        return res.status(404).json({ message: "Certification not found" });
      }

      res.json({ message: "Certification deleted successfully" });
    } catch (error) {
      console.error("Error deleting certification:", error);
      res.status(500).json({ message: "Failed to delete certification" });
    }
  });

  // Get stored locations
  app.get("/api/stored-locations", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const locations = await db.query.storedLocations.findMany({
        where: eq2(storedLocations.organizationId, organizationId),
        orderBy: storedLocations.updatedAt,
      });

      res.json(locations);
    } catch (error) {
      console.error("Error fetching stored locations:", error);
      res.status(500).json({ message: "Failed to fetch stored locations" });
    }
  });

  // Add a new stored location
  app.post("/api/stored-locations", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const [newLocation] = await db
        .insert(storedLocations)
        .values({
          name: req.body.name,
          address: req.body.address,
          placeId: req.body.placeId,
          lat: req.body.lat ? String(req.body.lat) : undefined,
          lng: req.body.lng ? String(req.body.lng) : undefined,
          organizationId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newLocation);
    } catch (error) {
      console.error("Error creating stored location:", error);
      res.status(500).json({ message: "Failed to create stored location" });
    }
  });

  // Update a stored location
  app.patch("/api/stored-locations/:id", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const [updatedLocation] = await db
        .update(storedLocations)
        .set({
          name: req.body.name,
          address: req.body.address,
          placeId: req.body.placeId,
          lat: req.body.lat ? String(req.body.lat) : undefined,
          lng: req.body.lng ? String(req.body.lng) : undefined,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq2(storedLocations.id, parseInt(req.params.id)),
            eq2(storedLocations.organizationId, organizationId),
          ),
        )
        .returning();

      if (!updatedLocation) {
        return res.status(404).json({ message: "Stored location not found" });
      }

      res.json(updatedLocation);
    } catch (error) {
      console.error("Error updating stored location:", error);
      res.status(500).json({ message: "Failed to update stored location" });
    }
  });

  // Delete a stored location
  app.delete("/api/stored-locations/:id", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const [deletedLocation] = await db
        .delete(storedLocations)
        .where(
          and(
            eq2(storedLocations.id, parseInt(req.params.id)),
            eq2(storedLocations.organizationId, organizationId),
          ),
        )
        .returning();

      if (!deletedLocation) {
        return res.status(404).json({ message: "Stored location not found" });
      }

      res.json({ message: "Stored location deleted successfully" });
    } catch (error) {
      console.error("Error deleting stored location:", error);
      res.status(500).json({ message: "Failed to delete stored location" });
    }
  });


  // Add organization vendor endpoints
  app.get("/api/organization-vendors", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const orgVendors = await db.query.organizationVendors.findMany({
        where: eq2(organizationVendors.organizationId, organizationId),
        with: {
          vendor: true,
        },
        orderBy: organizationVendors.updatedAt,
      });

      res.json(orgVendors);
    } catch (error) {
      console.error("Error fetching organization vendors:", error);
      res.status(500).json({ message: "Failed to fetch organization vendors" });
    }
  });

  app.post("/api/organization-vendors", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const [newOrgVendor] = await db
        .insert(organizationVendors)
        .values({
          organizationId,
          vendorId: req.body.vendorId,
          status: req.body.status || "active",
          contractStartDate: req.body.contractStartDate
            ? new Date(req.body.contractStartDate)
            : null,
          contractEndDate: req.body.contractEndDate
            ? new Date(req.body.contractEndDate)
            : null,
          contractTerms: req.body.contractTerms,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const orgVendor = await db.query.organizationVendors.findFirst({
        where: eq2(organizationVendors.id, newOrgVendor.id),
        with: {
          vendor: true,
        },
      });

      res.status(201).json(orgVendor);
    } catch (error) {
      console.error("Error creating organization vendor:", error);
      res.status(500).json({ message: "Failed to create organization vendor" });
    }
  });

  app.patch("/api/organization-vendors/:id", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const [updatedOrgVendor] = await db
        .update(organizationVendors)
        .set({
          status: req.body.status,
          contractStartDate: req.body.contractStartDate
            ? new Date(req.body.contractStartDate)
            : null,
          contractEndDate: req.body.contractEndDate
            ? new Date(req.body.contractEndDate)
            : null,
          contractTerms: req.body.contractTerms,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq2(organizationVendors.id, parseInt(req.params.id)),
            eq2(organizationVendors.organizationId, organizationId),
          ),
        )
        .returning();

      if (!updatedOrgVendor) {
        return res
          .status(404)
          .json({ message: "Organization vendor not found" });
      }

      const orgVendor = await db.query.organizationVendors.findFirst({
        where: eq2(organizationVendors.id, updatedOrgVendor.id),
        with: {
          vendor: true,
        },
      });

      res.json(orgVendor);
    } catch (error) {
      console.error("Error updating organization vendor:", error);
      res.status(500).json({ message: "Failed to update organization vendor" });
    }
  });

  app.delete("/api/organization-vendors/:id", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res
          .status(401)
          .json({ message: "No organization associated with user" });
      }

      const [deletedOrgVendor] = await db
        .delete(organizationVendors)
        .where(
          and(
            eq2(organizationVendors.id, parseInt(req.params.id)),
            eq2(organizationVendors.organizationId, organizationId),
          ),
        )
        .returning();

      if (!deletedOrgVendor) {
        return res
          .status(404)
          .json({ message: "Organization vendor not found" });
      }

      res.json({ message: "Organization vendor deleted successfully" });
    } catch (error) {
      console.error("Error deleting organization vendor:", error);
      res.status(500).json({ message: "Failed to delete organization vendor" });
    }
  });

  // Helper function to generate PDF report
  async function generateReport(doc: PDFKit.PDFDocument, settings: any) {
    // Add company logo if present
    if (settings?.companyLogo) {
      const logoPath = path.join(process.cwd(), 'public/uploads/company-logos', settings.companyLogo);
      console.log('Attempting to load logo from:', logoPath);
      
      if (fs.existsSync(logoPath)) {
        try {
          console.log('Logo file exists, attempting to add to PDF');
          doc.image(logoPath, {
            fit: [200, 100], // Increased size for better visibility
            align: 'center',
            valign: 'top'
          });
          doc.moveDown(2);
        } catch (error) {
          console.error('Error adding logo to report:', error);
        }
      } else {
        console.error('Logo file not found at path:', logoPath);
      }
    } else {
      console.log('No logo configured in settings:', settings);
    }

    // Add header with company name if present
    if (settings?.companyName) {
      doc.fontSize(24)
         .fillColor('#333333')
         .text(settings.companyName, { align: 'center' });
      doc.moveDown();
    }

    // Add company contact info if present
    if (settings?.companyAddress || settings?.companyContact) {
      doc.fontSize(12)
         .fillColor('#666666');
      
      if (settings.companyAddress) {
        doc.text(settings.companyAddress, { align: 'center' });
      }
      if (settings.companyContact) {
        doc.text(settings.companyContact, { align: 'center' });
      }
      doc.moveDown(2);
    }

    // Rest of the report generation...
    doc.fontSize(14)
       .fillColor('#000000')
       .text('Sustainability Report', { align: 'center' })
       .moveDown();
  }

  // Report generation endpoint
  app.post("/api/reports", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: "Not authorized" });
      }

      // Get report settings
      const settings = await db.query.reportSettings.findFirst({
        where: eq(reportSettings.organizationId, organizationId)
      });

      console.log('Retrieved report settings:', settings);

      const doc = new PDFDocument({
        margins: {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        }
      });
      const chunks: any[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', Buffer.byteLength(result));
        res.end(result);
      });

      // Generate report with settings
      await generateReport(doc, settings);
      doc.end();
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  registerApplicationRoutes(app);

  // Register calculator routes
  console.log('📝 Registering calculator routes at /api/admin/calculator-configs');
  app.use("/api/admin/calculator-configs", calculatorRouter);
  console.log('📝 Registering admin routes at /api/admin');
  app.use("/api/admin", adminRouter);
  
  // Direct access route for sensor control scripts - no authentication needed
  app.get('/api/direct-sensor-scripts', (req, res) => {
    console.log('Direct sensor scripts access requested');
    // Provide the predefined scripts that would normally be available in the admin panel
    const predefinedScripts = [
      {
        id: 1,
        name: "System Status",
        description: "Check the current system status of the sensor",
        command: "sudo systemctl status sensor-service",
        category: "monitoring"
      },
      {
        id: 2,
        name: "Restart Service",
        description: "Restart the sensor service if it's not working properly",
        command: "sudo systemctl restart sensor-service",
        category: "maintenance"
      },
      {
        id: 3,
        name: "Update Firmware",
        description: "Update the sensor firmware to the latest version",
        command: "sudo /opt/sensor/update-firmware.sh",
        category: "maintenance"
      },
      {
        id: 4,
        name: "Backup Config",
        description: "Create a backup of the sensor configuration",
        command: "sudo /opt/sensor/backup-config.sh",
        category: "maintenance"
      },
      {
        id: 5,
        name: "Check Connection",
        description: "Test the sensor's connection to the central server",
        command: "ping -c 4 central-server.example.com",
        category: "monitoring"
      }
    ];
    
    return res.json({
      success: true,
      scripts: predefinedScripts
    });
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}

// Helper function to register all application routes
function registerApplicationRoutes(app: Express) {
  // Vendors endpoint
  app.get("/api/vendors", async (req, res) => {
    try {
      const { wasteTypes, location, minRating, certifications } = req.query;

      let query = db.select().from(vendors);
      let conditions = [];

      if (wasteTypes) {
        const types = Array.isArray(wasteTypes) ? wasteTypes : [wasteTypes];
        conditions.push(
          types.some((type) =>
            JSON.stringify(vendors.services).includes(type as string),
          ),
        );
      }

      if (location) {
        conditions.push(
          JSON.stringify(vendors.serviceAreas).includes(location as string),
        );
      }

      if (minRating) {
        conditions.push(gte(vendors.rating, Number(minRating)));
      }

      if (certifications) {
        const certs = Array.isArray(certifications)
          ? certifications
          : [certifications];
        conditions.push(
          certs.every((cert) =>
            JSON.stringify(vendors.certificationsAndCompliance).includes(
              cert as string,
            ),
          ),
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const filteredVendors = await query.execute();
      res.json(filteredVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  // Report Generation endpoint
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { sections = ["waste", "recycling", "costs"], format = "pdf" } =
        req.body;

      if (format === "pdf") {
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=sustainability-report.pdf",
        );
        doc.pipe(res);

        doc
          .fontSize(28)
          .fillColor("#333333")
          .text("Sustainability Report", { align: "center" })
          .fontSize(14)
          .fillColor("#666666")
          .text(new Date().toLocaleDateString(), { align: "center" })
          .moveDown(2);

        let pageNumber = 1;
        const addPageNumber = (num: number) => {
          doc
            .fontSize(10)
            .fillColor("#999999")
            .text(`Page ${num}`, 0, doc.page.height - 50, {
              align: "center",
            });
        };
        addPageNumber(pageNumber);

        // Add sections based on request
        if (sections.includes("waste")) {          doc
            .fontSize(20)
            .fillColor("#333333")
            .text("Waste Management", { underline: true })
            .moveDown()
            .fontSize(12)
            .fillColor("#666666")
            .text(`Total Waste: ${reportData.waste.total} tons`)
            .moveDown(0.5);

          const wasteData = Object.entries(reportData.waste.byType).map(
            ([name, value]) => ({ name, value }),
          );
          drawBarChart(
            doc,
            wasteData,
            70,
            250,
            450,
            200,
            "Waste Distribution by Type",
          );
          doc.moveDown(2);
        }

        if (sections.includes("recycling")) {
          doc.addPage();          pageNumber++;
          addPageNumber(pageNumber);

          doc
            .fontSize(20)
            .fillColor("#333333")
            .text("Recycling Performance", { underline: true })
            .moveDown()
            .fontSize(12)
            .fillColor("#666666")
            .text(
              `Recycling Rate: ${(reportData.recycling.rate * 100).toFixed(
                1,
              )}%`,
            )
            .text(
              `Year-over-Year Improvement: ${(
                reportData.recycling.improvement * 100
              ).toFixed(1)}%`,
            )
            .text(
              `Cost Savings: $${reportData.recycling.savings.toLocaleString()}`,
            )
            .moveDown(2);

          drawPieChart(
            doc,
            reportData.recycling.topMaterials,
            300,
            400,
            100,
            "Recycled Materials Distribution",
          );
          doc.moveDown(2);
        }

        if (sections.includes("costs")) {
          doc.addPage();
          pageNumber++;
          addPageNumber(pageNumber);

          doc
            .fontSize(20)
            .fillColor("#333333")
            .text("Cost Analysis", { underline: true })
            .moveDown()
            .fontSize(12)
            .fillColor("#666666")
            .text(`Total Costs: $${reportData.costs.total.toLocaleString()}`)
            .moveDown(2);

          const costData = Object.entries(reportData.costs.byCategory).map(
            ([name, value]) => ({ name, value }),
          );
          drawBarChart(doc, costData, 70, 200, 450, 200, "Costs by Category");

          const savingsData = Object.entries(reportData.costs.savings).map(
            ([name, value]) => ({ name, value }),
          );
          drawBarChart(
            doc,
            savingsData,
            70,
            500,
            450,
            200,
            "Cost Savings Analysis",
          );
        }

        doc.end();
      } else {
        const response = {
          timestamp: new Date(),
          sections: sections.reduce(
            (acc: Record<string, any>, section: keyof ReportData) => {
              acc[section] = reportData[section];
              return acc;
            },
            {},
          ),
        };
        res.json(response);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get("/api/initiatives/export", async (req, res) => {
    try {
      console.log("Starting PDF export...");
      const { view = "list" } = req.query;

      let initiatives;
      try {
        initiatives = await db.query.initiatives.findMany({
          orderBy: (initiatives, { desc }) => [desc(initiatives.createdAt)],
          with: {
            tasks: true,
            milestones: true,
            updates: true,
            creator: true,
          },
        });
        console.log(`Found ${initiatives.length} initiatives`);
      } catch (dbError) {
        console.error("Database query error:", dbError);
        throw new Error("Failed to fetch initiatives from database");
      }

      if (!initiatives || initiatives.length === 0) {
        return res.status(404).json({ message: "No initiatives found" });
      }

      const doc = new PDFDocument({
        margin: 50,
        bufferPages: true,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=initiatives-${view}.pdf`,
      );

      doc.pipe(res);

      doc
        .fontSize(24)
        .fillColor("#333333")
        .text("Initiatives Report", { align: "center" })
        .moveDown()
        .fontSize(12)
        .fillColor("#666666")
        .text(new Date().toLocaleDateString(), { align: "center" })
        .moveDown(2);

      if (view === "list") {
        initiatives.forEach((initiative, index) => {
          if (!initiative) return;

          const startDate = initiative.startDate
            ? new Date(initiative.startDate).toLocaleDateString()
            : "Not set";
          const targetDate = initiative.targetDate
            ? new Date(initiative.targetDate).toLocaleDateString()
            : "Not set";

          doc
            .fontSize(14)
            .fillColor("#333333")
            .text(`${index + 1}. ${initiative.title || "Untitled"}`)
            .fontSize(10)
            .fillColor("#666666")
            .text(`Status: ${initiative.status || "Unknown"}`)
            .text(`Timeline: ${startDate} - ${targetDate}`)
            .text(`Description: ${initiative.description || "No description"}`)
            .moveDown();
        });
      } else if (view === "gantt") {
        doc
          .fontSize(14)
          .fillColor("#333333")
          .text("Timeline View", { underline: true })
          .moveDown();

        const timelineHeight = 30;
        const startX = 150;
        const width = 400;

        const validInitiatives = initiatives.filter(
          (i) =>
            i &&
            i.startDate &&
            i.targetDate &&
            !isNaN(new Date(i.startDate).getTime()) &&
            !isNaN(new Date(i.targetDate).getTime()),
        );

        if (validInitiatives.length === 0) {
          doc.text("No valid timeline data available");
          doc.end();
          return;
        }

        const { minDate, maxDate } = validInitiatives.reduce(
          (acc, initiative) => {
            const startDate = new Date(initiative.startDate);
            const targetDate = new Date(initiative.targetDate);
            return {
              minDate: acc.minDate && acc.minDate < startDate ? acc.minDate : startDate,
              maxDate: acc.maxDate && acc.maxDate > targetDate ? acc.maxDate : targetDate,
            };
          },
          { minDate: null, maxDate: null } as {
            minDate: Date | null;
            maxDate: Date | null;
          },
        );

        if (!minDate || !maxDate) {
          doc.text("No valid timeline data available");
          doc.end();
          return;
        }

        const totalDays = Math.ceil(
          (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        doc
          .strokeColor("#666666")
          .moveTo(startX, 100)
          .lineTo(startX + width, 100)
          .stroke();

        validInitiatives.forEach((initiative, index) => {
          const y = 120 + index * timelineHeight;
          const startDate = new Date(initiative.startDate);
          const targetDate = new Date(initiative.targetDate);

          doc
            .fontSize(10)
            .fillColor("#333333")
            .text(initiative.title || "Untitled", 50, y);

          const startDays = Math.ceil(
            (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          const duration = Math.ceil(
            (targetDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const barX = startX + (startDays / totalDays) * width;
          const barWidth = Math.max((duration / totalDays) * width, 2);

          doc
            .rect(barX, y, barWidth, 15)
            .fill(getStatusColor(initiative.status));
        });

        doc
          .fontSize(8)
          .fillColor("#666666")
          .text(minDate.toLocaleDateString(), startX, 85)
          .text(maxDate.toLocaleDateString(), startX + width - 50, 85);
      }

      doc.end();
      console.log("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({
        message: "Failed to generate PDF",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/schedules", async (req, res) => {
    try {
      const results = await db.query.schedules.findMany({
        where: req.user?.organizationId ? 
          eq(schedules.organizationId, req.user.organizationId) : 
          undefined
      });
      res.json(results);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const { date, wasteTypes, wastePointId, vendor } = req.body;

      // First fetch the waste point to get the vendor
      const wastePoint = await db.query.wastePoints.findFirst({
        where: eq(wastePoints.id, wastePointId)
      });

      if (!wastePoint) {
        return res.status(404).json({ error: "Waste point not found" });
      }

      // Parse the date string to ensure it's valid
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      const [result] = await db.insert(schedules).values({
        date: parsedDate,
        wasteTypes: wasteTypes,
        wastePointId: wastePointId,
        vendor: vendor || wastePoint.vendor,
        status: 'pending',
        organizationId: req.user?.organizationId
      }).returning();

      // Fetch the complete schedule with waste point data
      const schedule = await db.query.schedules.findFirst({
        where: eq(schedules.id, result.id),
        with: {
          wastePoint: true
        }
      });

      if (!schedule) {
        return res.status(500).json({ error: "Failed to fetch created schedule" });
      }

      res.json(schedule);
    } catch (error) {
      console.error("Error creating schedule:", error);
      res.status(500).json({ error: "Failed to create schedule", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/schedules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { date, wasteTypes, wastePointId, status } = req.body;

      const result = await db.update(schedules)
        .set({
          date: date ? new Date(date) : undefined,
          wasteTypes: wasteTypes || undefined,
          wastePointId: wastePointId || undefined,
          status: status || undefined,
        })
        .where(eq(schedules.id, parseInt(id, 10)))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  app.get("/api/initiatives/all", async (req, res) => {
    try {
      const allInitiatives = await db.query.initiatives.findMany({
        with: {
          tasks: true,
          milestones: true,
          updates: true,
          creator: true,
        },
        orderBy: initiatives.createdAt,
      });

      res.json(allInitiatives);
    } catch (error) {
      console.error("Error fetching initiatives:", error);
      res.status(500).json({ message: "Failed to fetch initiatives" });
    }
  });

  app.get("/api/initiatives/:id", async (req, res) => {
    try {
      const initiative = await db.query.initiatives.findFirst({
        where: eq2(initiatives.id, parseInt(req.params.id)),
        with: {
          tasks: true,
          milestones: true,
          updates: true,
          creator: true,
        },
      });

      if (!initiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      res.json(initiative);
    } catch (error) {
      console.error("Error fetching initiative:", error);
      res.status(500).json({ message: "Failed to fetch initiative" });
    }
  });

  app.post("/api/initiatives", async (req, res) => {
    try {
      const { startDate, targetDate, ...restBody } = req.body;

      const parsedStartDate = new Date(startDate);
      const parsedTargetDate = new Date(targetDate);

      if (
        isNaN(parsedStartDate.getTime()) ||
        isNaN(parsedTargetDate.getTime())
      ) {
        return res
          .status(400)
          .json({ message: "Invalid date format provided" });
      }

      const [newInitiative] = await db
        .insert(initiatives)
        .values({
          ...restBody,
          startDate: parsedStartDate,
          targetDate: parsedTargetDate,
          createdBy: req.user?.id || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.json(newInitiative);
    } catch (error) {
      console.error("Error creating initiative:", error);
      res.status(500).json({ message: "Failed to create initiative" });
    }
  });

  app.patch("/api/initiatives/:id", async (req, res) => {
    try {
      const [updatedInitiative] = await db
        .update(initiatives)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(eq2(initiatives.id, parseInt(req.params.id)))
        .returning();

      if (!updatedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      res.json(updatedInitiative);
    } catch (error) {
      console.error("Error updating initiative:", error);
      res.status(500).json({ message: "Failed to update initiative" });
    }
  });

  app.delete("/api/initiatives/:id", async (req, res) => {
    try {
      const [deletedInitiative] = await db
        .delete(initiatives)
        .where(eq2(initiatives.id, parseInt(req.params.id)))
        .returning();

      if (!deletedInitiative) {
        return res.status(404).json({ message: "Initiative not found" });
      }

      res.json({ message: "Initiative deleted successfully" });
    } catch (error) {
      console.error("Error deleting initiative:", error);
      res.status(500).json({ message: "Failed to delete initiative" });
    }
  });

  /**
   * @openapi
   * /api/trends/insights:
   *   get:
   *     summary: Get AI-generated insights
   *     description: Retrieve AI-generated insights about waste management trends and recommendations
   *     tags: [Trends]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: AI-generated insights
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 insights:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       title:
   *                         type: string
   *                       description:
   *                         type: string
   *                       category:
   *                         type: string
   *                       impact:
   *                         type: string
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   */
  app.get("/api/trends/insights", async (req, res) => {
    try {
      let insights;
      try {
        insights = await generateInsights();
        console.log("Generated insights:", insights);
      } catch (error) {
        console.error("Error generating insights with OpenAI:", error);
        insights = mockInsights;
      }
      res.json(insights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.get("/api/trends/news", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const location = (req.query.location as string) || "all";

      let newsData;
      try {
        newsData = await fetchNews(page, location);
        console.log("News data fetched:", newsData);
        res.json(newsData);
      } catch (error) {
        console.error("Error fetching news from NewsAPI:", error);
        res.json({
          articles: [
            {
              id: "news_1_page_1",
              title: "New Circular Economy Standards Announced",
              summary:
                "Global standards body introduces comprehensive guidelines for circular economy practices",
              source: "Sustainability News",
              url: "https://example.com/news1",
              publishedAt: new Date().toISOString(),
              category: "Policy",
              location: location,
            },
            {
              id: "news_2_page_1",
              title: "Innovation in Recycling Technology",
              summary:
                "Breakthrough in plastic recycling promises to revolutionize waste management",
              source: "Tech Weekly",
              url: "https://example.com/news2",
              publishedAt: new Date().toISOString(),
              category: "Technology",
              location: location,
            },
          ],
          totalResults: 2,
          currentPage: page,
          hasMore: false,
        });
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post("/api/trends/refresh", async (req, res) => {
    try {
      console.log("Starting refresh of insights and news...");

      const [insights, news] = await Promise.all([
        generateInsights(),
        fetchNews(),
      ]);

      console.log("Successfully refreshed data:", { insights, news });

      res.json({
        message: "Insights and news refreshed successfully",
        data: { insights, news },
      });
    } catch (error) {
      console.error("Error refreshing insights and news:", error);
      res.status(500).json({
        message: "Failed to refresh insights and news",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/certifications", async (req, res) => {
    try {
      const certifications = await db.query.certifications.findMany({
        orderBy: (certifications, { desc }) => [
          desc(certifications.relevance),
        ],
      });
      res.json(certifications);
    } catch (error) {
      console.error("Error fetching certifications:", error);
      res.status(500).json({ message: "Failed to fetch certifications" });
    }
  });

  app.get("/api/user-certifications", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userCerts = await db.query.userCertifications.findMany({
        where: eq2(userCertifications.userId, req.user.id),
        with: {
          certification: true,
        },
      });
      res.json(userCerts);
    } catch (error) {
      console.error("Error fetching user certifications:", error);
      res.status(500).json({ message: "Failed to fetch user certifications" });
    }
  });

  app.post("/api/certifications/apply", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { certificationId } = req.body;
      if (!certificationId) {
        return res
          .status(400)
          .json({ message: "Certification ID is required" });
      }

      const [newUserCert] = await db
        .insert(userCertifications)
        .values({
          userId: req.user.id,
          certificationId: certificationId,
          status: "pending",
          applicationDate: new Date(),
        })
        .returning();

      res.json(newUserCert);
    } catch (error) {
      console.error("Error applying for certification:", error);
      res.status(500).json({ message: "Failed to apply for certification" });
    }
  });

  app.post("/api/material-analysis", async (req, res) => {
    try {
      const { product } = req.body;

      if (!product) {
        return res
          .status(400)
          .json({ message: "Product description is required" });
      }

      const analysis = await analyzeMaterial(product);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing material:", error);
      res.status(500).json({ message: "Failed to analyze material" });
    }
  });

  app.post("/api/generate-recommendation", async (req, res) => {
    try {
      console.log("Starting recommendation generation...");
      const recommendation = await generateRecommendation(req.body);
      console.log("Generated recommendation:", recommendation);
      res.json(recommendation);
    } catch (error) {
      console.error("Error generating recommendation:", error);
      res.status(500).json({
        message: "Failed to generate recommendation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * @openapi
   * /api/chat:
   *   post:
   *     summary: Chat with AI assistant
   *     description: Send a message to the AI assistant and get a response
   *     tags: [AI]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *                 description: The message to send to the AI assistant
   *               context:
   *                 type: object
   *                 description: Additional context for the AI
   *     responses:
   *       200:
   *         description: AI response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 response:
   *                   type: string
   *                   description: AI assistant response
   *                 suggestions:
   *                   type: array
   *                   items:
   *                     type: string
   *                   description: Suggested follow-up questions
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *       500:
   *         description: Internal server error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   */
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!context?.userId) {
        return res.status(400).json({ message: "User context is required" });
      }

      let userContext = "";
      try {
        // Get user and organization data
        const user = await db.query.users.findFirst({
          where: eq2(users.id, context.userId),
        });

        if (user?.organizationId) {
          const organization = await db.query.organizations.findFirst({
            where: eq2(organizations.id, user.organizationId),
          });

          // Get recent initiatives
          const recentInitiatives = await db.query.initiatives.findMany({
            where: eq2(initiatives.createdBy, context.userId),
            orderBy: (initiatives, { desc }) => [desc(initiatives.createdAt)],
            limit: 5,
          });

          // Get waste metrics
          const wasteMetrics = await db.query.wastePoints.findMany({
            where: eq2(wastePoints.organizationId, user.organizationId),
            orderBy: (wp, { desc }) => [desc(wp.createdAt)],
            limit: 10,
          });

          userContext = `
            Organization Context:
            - Organization: ${organization?.name || "Unknown"}
            - Recent Initiatives: ${recentInitiatives
              .map((i) => i.title)
              .join(", ") || "None"}
            - Recent Waste Metrics: ${wasteMetrics.length} entries
            - Total Waste Volume: ${wasteMetrics.reduce(
              (sum, wp) => sum + (wp.estimatedVolume || 0),
              0,
            )} units
          `;
        }
      } catch (error) {
        console.error("Error fetching user context:", error);
        // Continue with empty context if there's an error
        userContext = "Unable to fetch organization context.";
      }

      const systemPrompt = `You are an AI Sustainability Advisor helping with environmental initiatives and waste management. 
        ${userContext}

        Provide specific, actionable advice based on the organization's data and sustainability goals.
        Keep responses concise and focused on practical steps.`;

      try {
        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          model: "gpt-4-turbo-preview",
          temperature: 0.7,
          max_tokens: 500,
        });

        res.json({ message: completion.choices[0].message.content });
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);
        res.status(500).json({
          message: "Failed to generate AI response",
          error: aiError instanceof Error ? aiError.message : "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  // Add vendor auth routes
  app.post("/api/vendor/login", async (req, res) => {
    try {
      console.log("Vendor login attempt:", req.body);

      // Validate input
      const result = vendorLoginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Invalid credentials",
          errors: result.error.issues,
        });
      }

      const { email, password } = result.data;

      // Find vendor by email
      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.email, email))
        .limit(1);

      if (!vendor) {
        console.log("Vendor not found:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // For now using direct password comparison since test data isn't hashed
      if (password !== vendor.password) {
        console.log("Invalid password for vendor:", email);
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Set vendor session
      req.session.vendor = {
        id: vendor.id,
        email: vendor.email,
        name: vendor.name,
        type: "vendor",
      };

      console.log("Setting vendor session:", req.session.vendor);

      // Ensure session is saved before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res
            .status(500)
            .json({ message: "Failed to create session" });
        }

        console.log("Vendor logged in successfully:", vendor.email);
        res.json({
          vendor: {
            id: vendor.id,
            email: vendor.email,
            name: vendor.name,
            type: "vendor",
          },
        });
      });
    } catch (error) {
      console.error("Vendor login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/vendor/logout", (req, res) => {
    if (req.session.vendor) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logout successful" });
      });
    } else {
      res.status(401).json({ message: "Not logged in" });
    }
  });

  app.get("/api/vendor/profile", (req, res) => {
    if (!req.session.vendor) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const vendorId = req.session.vendor.id;

    db.query.vendors
      .findFirst({
        where: eq(vendors.id, vendorId),
      })
      .then((vendor) => {
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
        }

        // Remove sensitive data
        const { password, ...vendorData } = vendor;
        res.json(vendorData);
      })
      .catch((error) => {
        console.error("Error fetching vendor profile:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
      });
  });

  app.post("/api/vendor/register", async (req, res) => {
    try {
      const result = insertVendorSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send(
            "Invalid input: " +
              result.error.issues.map((i) => i.message).join(", "),
          );
      }

      const { email, password, ...vendorData } = result.data;

      // Check if vendor already exists
      const [existingVendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.email, email))
        .limit(1);

      if (existingVendor) {
        return res.status(400).send("Email already registered");
      }

      // Hash password
      const hashedPassword = await crypto.hash(password);

      // Create new vendor
      const [newVendor] = await db
        .insert(vendors)
        .values({
          ...vendorData,
          email,
          password: hashedPassword,
          status: "pending",
          rating: 0,
          onTimeRate: 0,
          recyclingEfficiency: 0,
          customerSatisfaction: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Set vendor session
      req.session.vendor = {
        id: newVendor.id,
        email: newVendor.email,
        name: newVendor.name,
      };
      await req.session.save();

      res.status(201).json({
        message: "Registration successful",
        vendor: {
          id: newVendor.id,
          email: newVendor.email,
          name: newVendor.name,
        },
      });
    } catch (error) {
      console.error("Vendor registration error:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.post("/api/vendor/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/vendor/profile", (req, res) => {
    if (req.session.vendor) {
      return res.json(req.session.vendor);
    }
    res.status(401).send("Not logged in");
  });
  // Add admin product endpoints
  app.get("/api/admin/products", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const allProducts = await db.query.products.findMany({
        orderBy: products.createdAt,
      });
      res.json(allProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [newProduct] = await db
        .insert(products)
        .values({
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          category: req.body.category,
          imageUrl: req.body.imageUrl || "",
          inStock: req.body.inStock || true,
          tags: req.body.tags || [],
          status: req.body.status ||"active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [updatedProduct] = await db
        .update(products)
        .set({
          name: req.body.name,
          description: req.body.description,
          category: req.category,
          price: req.body.price,
          sustainabilityScore: req.body.sustainabilityScore,
          carbonFootprint: req.body.carbonFootprint,
          materials: req.body.materials,
          certifications: req.body.certifications,
          updatedAt: new Date(),
        })
        .where(eq(products.id, parseInt(req.params.id)))
        .returning();

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      if (!req.user || req.user.organizationRole !== "owner") {
        return res.status(403).json({ message: "Not authorized" });
      }

      const [deletedProduct] = await db
        .delete(products)
        .where(eq(products.id, parseInt(req.params.id)))
        .returning();

      if (!deletedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });
  // Waste disposal trends endpoint
  app.get("/api/metrics/disposal-trends", async (req, res) => {
    try {
      const { timeframe = '6m' } = req.query;
      const organizationId = req.user?.organizationId || 2; // Fallback for testing

      console.log('Fetching metrics for timeframe:', timeframe);
      console.log('Organization ID:', organizationId);

      // Calculate the start date based on timeframe
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 6);
      }

      console.log('Date range:', {
        start_date: startDate.toISOString(),
        end_date: now.toISOString()
      });

      // Check and generate sample data if needed
      console.log('Checking and generating sample data...');
      const existingData = await db.select()
        .from(sustainabilityMetrics)
        .where(sql`organization_id = ${organizationId}`)
        .execute();

      console.log('Existing data count:', existingData.length);

      if (existingData.length === 0) {
        console.log('Inserting sample data points...');
        // Generate 6 months of sample data
        const sampleData = [];
        for (let i = 0; i < 456; i++) {
          const date = new Date();
          date.setHours(date.getHours() - i);

          sampleData.push(
            {
              organizationId,
              metricType: 'total_waste',
              value: 1000 + Math.random() * 500,
              timestamp: date,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              organizationId,
              metricType: 'recyclable_waste',
              value: 600 + Math.random() * 300,
              timestamp: date,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              organizationId,
              metricType: 'non_recyclable_waste',
              value: 300 + Math.random() * 200,
              timestamp: date,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          );
        }

        await db.insert(sustainabilityMetrics).values(sampleData);
        console.log('Sample data inserted successfully');
      }

      // Query the metrics
      const result = await db.execute(sql`
        WITH monthly_metrics AS (
          SELECT
            DATE_TRUNC('month', timestamp) as month,
            metric_type,
            AVG(CAST(value AS FLOAT)) as avg_value
          FROM sustainability_metrics
          WHERE organization_id = ${organizationId}
            AND timestamp >= ${startDate}
            AND timestamp <= ${now}
            AND metric_type IN ('total_waste', 'recyclable_waste', 'non_recyclable_waste')
          GROUP BY DATE_TRUNC('month', timestamp), metric_type
        )
        SELECT
          TO_CHAR(month, 'Mon YYYY') as month,
          ROUND(COALESCE(MAX(CASE WHEN metric_type = 'total_waste' THEN avg_value END), 0)::numeric, 2) as total,
          ROUND(COALESCE(MAX(CASE WHEN metric_type = 'recyclable_waste' THEN avg_value END), 0)::numeric, 2) as recyclable,
          ROUND(COALESCE(MAX(CASE WHEN metric_type = 'non_recyclable_waste' THEN avg_value END), 0)::numeric, 2) as nonrecyclable
        FROM monthly_metrics
        GROUP BY month
        ORDER BY month ASC;
      `);

      const transformedData = result.rows;
      console.log('Final transformed data:', transformedData);

      res.json(transformedData);
    } catch (error) {
      console.error("Error fetching disposal trends:", error);
      res.status(500).json({ message: "Failed to fetch disposal trends", error: error.message });
    }
  });

  app.get("/api/metrics/disposal-trends", async (req, res) => {
    try {
      const { timeframe = '6m' } = req.query;
      const organizationId = req.user?.organizationId;

      console.log('Fetching metrics for timeframe:', timeframe);
      console.log('Organization ID:', organizationId);

      if (!organizationId) {
        return res.status(401).json({ message: "No organization associated with user" });
      }

      // Calculate the start date based on timeframe
      const now = new Date();
      const startDate = new Date();
      switch (timeframe) {
        case '1m':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '6m':
          startDate.setMonth(now.getMonth() - 6);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(now.getMonth() - 6);
      }

      console.log('Date range:', { start_date: startDate, end_date: now });

      const disposalTrends = await db.execute(sql`
        WITH monthly_metrics AS (
          SELECT
            DATE_TRUNC('month', timestamp) as month,
            metric_type,
            AVG(value) as avg_value
          FROM sustainability_metrics
          WHERE organization_id = ${organizationId}
            AND timestamp >= ${startDate}
            AND timestamp <= ${now}
            AND metric_type IN ('total_waste', 'recyclable_waste', 'non_recyclable_waste')
          GROUP BY DATE_TRUNC('month', timestamp), metric_type
        )
        SELECT
          TO_CHAR(month, 'Mon YYYY') as month,
          ROUND(COALESCE(MAX(CASE WHEN metric_type = 'total_waste' THEN avg_value END), 0)::numeric, 2) as total,
          ROUND(COALESCE(MAX(CASE WHEN metric_type = 'recyclable_waste' THEN avg_value END), 0)::numeric, 2) as recyclable,
          ROUND(COALESCE(MAX(CASE WHEN metric_type = 'non_recyclable_waste' THEN avg_value END), 0)::numeric, 2) as nonrecyclable
        FROM monthly_metrics
        GROUP BY month
        ORDER BY month ASC;
      `);

      console.log('Query results:', disposalTrends.rows);

      // If no data, create sample data for demonstration
      if (!disposalTrends.rows.length) {
        // Insert some sample metrics for testing
        await db.insert(sustainabilityMetrics).values([
          {
            organizationId,
            metricType: 'total_waste',
            value: 1200,
            timestamp: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            organizationId,
            metricType: 'recyclable_waste',
            value: 800,
            timestamp: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            organizationId,
            metricType: 'non_recyclable_waste',
            value: 400,
            timestamp: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]);

        // Return sample data structure
        return res.json([
          { month: 'Feb 2025', total: 1200, recyclable: 800, nonrecyclable: 400 },
          { month: 'Jan 2025', total: 1100, recyclable: 750, nonrecyclable: 350 }
        ]);
      }

      res.json(disposalTrends.rows);
    } catch (error) {
      console.error("Error fetching disposal trends:", error);
      res.status(500).json({ message: "Failed to fetch disposal trends" });
    }
  });

  // Add report settings routes to the main routes file
  app.get("/api/organization/report-settings", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: "Not authorized" });
      }

      const settings = await db.query.reportSettings.findFirst({
        where: eq(reportSettings.organizationId, organizationId)
      });

      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching report settings:", error);
      res.status(500).json({ error: "Failed to fetch report settings" });
    }
  });

  app.post("/api/organization/report-settings", async (req, res) => {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(401).json({ error: "Not authorized" });
      }

      const existingSettings = await db.query.reportSettings.findFirst({
        where: eq(reportSettings.organizationId, organizationId)
      });

      let settings;
      if (existingSettings) {
        [settings] = await db
          .update(reportSettings)
          .set({
            ...req.body,
            organizationId,
            updatedAt: new Date()
          })
          .where(eq(reportSettings.organizationId, organizationId))
          .returning();
      } else {
        [settings] = await db
          .insert(reportSettings)
          .values({
            ...req.body,
            organizationId,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();
      }

      res.json(settings);
    } catch (error) {
      console.error("Error saving report settings:", error);
      res.status(500).json({ error: "Failed to save report settings" });
    }
  });

  // Add logo upload endpoint
  const uploadDir = 'public/uploads/company-logos';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ storage });

  app.post("/api/organization/logo", upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        fs.unlinkSync(path.join(uploadDir, req.file.filename));
        return res.status(401).json({ error: "Not authorized" });
      }

      const settings = await db.query.reportSettings.findFirst({
        where: eq(reportSettings.organizationId, organizationId)
      });

      if (settings?.companyLogo) {
        const oldLogoPath = path.join(uploadDir, settings.companyLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      const [updatedSettings] = await db
        .update(reportSettings)
        .set({ 
          companyLogo: req.file.filename,
          updatedAt: new Date()
        })
        .where(eq(reportSettings.organizationId, organizationId))
        .returning();

      res.json({ filename: req.file.filename });
    } catch (error) {
      console.error("Error uploading logo:", error);
      if (req.file) {
        fs.unlinkSync(path.join(uploadDir, req.file.filename));
      }
      res.status(500).json({ error: "Failed to upload logo" });
    }
  });

  app.use('/api/waste-audits', wasteAuditsRouter);
  app.use("/api/alerts", alertsRouter);
}

// Chart drawing utility functions
function drawBarChart(
  doc: PDFDocumentType,
  data: Array<{ name: string; value: number }>,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
) {
  try {
    doc
      .fontSize(14)
      .fillColor("#333333")
      .text(title, x, y)
      .moveDown();

    const bars = data.length;
    const barWidth = (width - (bars + 1) * 10) / bars;
    const maxValue = Math.max(...data.map((d) => d.value));

    doc
      .strokeColor("#666666")
      .moveTo(x, y)
      .lineTo(x, y + height)
      .moveTo(x, y + height)
      .lineTo(x + width, y + height)
      .stroke();

    data.forEach((item, i) => {
      const barHeight = (item.value / maxValue) * height;
      const barX = x + 10 + i * (barWidth + 10);
      const barY = y + height - barHeight;

      doc
        .fillColor("#0066cc")
        .rect(barX, barY, barWidth, barHeight)
        .fill()
        .fontSize(8)
        .fillColor("#666666")
        .text(item.name, barX, y + height + 5, {
          width: barWidth,
          align: "center",
        })
        .text(item.value.toString(), barX, barY - 15, {
          width: barWidth,
          align: "center",
        });
    });

    doc.moveDown(2);
  } catch (error) {
    console.error("Error drawing bar chart:", error);
  }
}

function drawPieChart(
  doc: PDFDocumentType,
  data: Array<{ name: string; value: number }>,
  x: number,
  y: number,
  radius: number,
  title: string,
) {
  try {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    doc
      .fontSize(14)
      .fillColor("#333333")
      .text(title, x - radius, y - radius - 20);

    let currentAngle = 0;
    const colors = ["#0066cc", "#00cc66", "#cc6600", "#cc0066"];

    data.forEach((item, i) => {
      const angle = (item.value / total) * 2 * Math.PI;
      const endAngle = currentAngle + angle;

      doc.fillColor(colors[i % colors.length]).moveTo(x, y);

      const steps = 16;
      for (let j = 0; j <= steps; j++) {
        const stepAngle = currentAngle + (angle * j) / steps;
        const xPos = x + Math.cos(stepAngle) * radius;
        const yPos = y + Math.sin(stepAngle) * radius;
        doc.lineTo(xPos, yPos);
      }
      doc.lineTo(x, y).fill();

      const legendY = y + radius + 20 + i * 20;
      doc
        .fillColor(colors[i % colors.length])
        .rect(x - radius, legendY, 15, 15)
        .fill()
        .fillColor("#666666")
        .fontSize(10)
        .text(
          `${item.name} (${Math.round((item.value / total) * 100)}%)`,
          x - radius + 20,
          legendY,
        );

      currentAngle = endAngle;
    });

    doc.moveDown(2);
  } catch (error) {
    console.error("Error drawing pie chart:", error);
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return "#37b5fe";
    case 'inactive':
      return "#6B7280";
    case 'pending':
      return "#F59E0B";
    case 'completed':
      return "#10B981";
    default:
      return "#6B7280";
  }
}

const mockUserCertifications = [
  {
    id: 1,
    status: "pending",
    applicationDate: "2025-01-15",
    certificationType: {
      id: 1,
      name: "ISO 14001 Environmental Management",
      description:
        "International standard for environmental management systems (EMS)",
      requirements: [
        "Development of environmental policy",
        "Implementation of environmental management system",
        "Regular environmental impact assessments",
        "Continuous improvement documentation",
        "External audit compliance",
      ],
      validityPeriod: 36,
      industry: "All Industries",
      provider: "International Organization for Standardization (ISO)",
      providerUrl:
        "https://www.iso.org/iso-14001-environmental-management.html",
      difficulty: "High",
      estimatedTime: "12-18 months",
      cost: "$$$$",
    },
  },
  {
    id: 2,
    status: "approved",
    applicationDate: "2024-12-01",
    issueDate: "2024-12-15",
    expiryDate: "2027-12-15",
    certificationType: {
      id: 3,
      name: "Green Star Performance Rating",
      description:
        "Australian certification for building environmental performance",
      requirements: [
        "Building performance documentation",
        "Energy efficiency measures",
        "Water conservation practices",
        "Waste management procedures",
        "Indoor environment quality standards",
      ],
      validityPeriod: 36,
      industry: "Construction & Real Estate",
      provider: "Green Building Council of Australia",
      providerUrl: "https://new.gbca.org.au/rate/rating-system/performance/",
      difficulty: "Medium",
      estimatedTime: "3-6 months",
      cost: "$$$",
    },
  },
];

const sensorStorage = [
  {
    id: "sensor_1",
    name: "Waste Bin Sensor 1",
    type: "weight",
    location: "Loading Dock",
    status: "active",
    lastReading: "2025-01-24T02:15:00Z",
    batteryLevel: 85,
    nextMaintenance: "2025-03-15",
  },
  {
    id: "sensor_2",
    name: "Recycling Monitor",
    type: "volume",
    location: "Recycling Area",
    status: "active",
    lastReading: "2025-01-24T02:10:00Z",
    batteryLevel: 92,
    nextMaintenance: "2025-02-28",
  },
];

const scheduleStorage: any[] = [];
const vendorStorage = [
  {
    id: 1,
    name: "EcoWaste Solutions",
    services: ["General Waste", "Recyclables", "Organic Waste"],
    rating: 4.5,
    serviceAreas: ["Sydney", "Melbourne", "Brisbane"],
    certificationsAndCompliance: ["ISO 14001", "EPA Certified"],
    onTimeRate: 0.95,
    recyclingEfficiency: 0.85,
    customerSatisfaction: 4.8,
  },
  {
    id: 2,
    name: "SafeDisposal Inc",
    services: ["Hazardous Waste", "Chemical Waste", "Medical Waste"],
    rating: 4.7,
    serviceAreas: ["Perth", "Adelaide", "Darwin"],
    certificationsAndCompliance: ["ISO 14001", "OHSAS 18001", "EPA Certified"],
    onTimeRate: 0.98,
    recyclingEfficiency: 0.9,
    customerSatisfaction: 4.9,
  },
  {
    id: 3,
    name: "GreenLoop Recycling",
    services: ["Recyclables", "E-Waste", "Paper Waste"],
    rating: 4.6,
    serviceAreas: ["Sydney", "Newcastle", "Wollongong"],
    certificationsAndCompliance: ["ISO 14001", "R2 Certified"],
    onTimeRate: 0.92,
    recyclingEfficiency: 0.88,
    customerSatisfaction: 4.7,
  },
  {
    id: 4,
    name: "MediWaste Specialists",
    services: ["Medical Waste", "Biohazard Materials", "Sharps Disposal"],
    rating: 4.9,
    serviceAreas: ["Melbourne", "Geelong", "Ballarat"],
    certificationsAndCompliance: [
      "OHSAS 18001",
      "EPA Certified",
      "Healthcare Waste Certified",
    ],
    onTimeRate: 0.99,
    recyclingEfficiency: 0.95,
    customerSatisfaction: 4.9,
  },
  {
    id: 5,
    name: "Industrial Recyclers Co",
    services: ["Industrial Waste", "Metal Recycling", "Construction Waste"],
    rating: 4.4,
    serviceAreas: ["Brisbane", "Gold Coast", "Sunshine Coast"],
    certificationsAndCompliance: ["ISO 14001", "EPA Certified"],
    onTimeRate: 0.91,
    recyclingEfficiency: 0.82,
    customerSatisfaction: 4.5,
  },
  {
    id: 6,
    name: "Organic Solutions Australia",
    services: ["Organic Waste", "Food Waste", "Green Waste"],
    rating: 4.3,
    serviceAreas: ["Perth", "Fremantle", "Joondalup"],
    certificationsAndCompliance: ["Composting Certification", "EPA Certified"],
    onTimeRate: 0.89,
    recyclingEfficiency: 0.87,
    customerSatisfaction: 4.4,
  },
  {
    id: 7,
    name: "TechRecycle Pro",
    services: ["E-Waste", "Battery Recycling", "Electronics Disposal"],
    rating: 4.8,
    serviceAreas: ["Adelaide", "Port Adelaide", "Glenelg"],
    certificationsAndCompliance: [
      "E-Stewards Certified",
      "R2 Certified",
      "ISO 14001",
    ],
    onTimeRate: 0.94,
    recyclingEfficiency: 0.92,
    customerSatisfaction: 4.8,
  },
  {
    id: 8,
    name: "Northern Territory Waste Co",
    services: ["General Waste", "Recyclables", "Industrial Waste"],
    rating: 4.2,
    serviceAreas: ["Darwin", "Palmerston", "Katherine"],
    certificationsAndCompliance: ["EPA Certified"],
    onTimeRate: 0.88,
    recyclingEfficiency: 0.8,
    customerSatisfaction: 4.3,
  },
];

const router = express.Router();

// Mount admin routes
router.use('/admin', adminRouter);

// Mount devices routes
router.use('/devices', devicesRouter);

export default router;