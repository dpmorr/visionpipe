import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '@db';
import { organizations, reportSettings } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Ensure upload directory exists
const uploadDir = 'public/uploads/company-logos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
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
 * /organization/report-settings:
 *   get:
 *     summary: Get report settings for the organization
 *     tags:
 *       - Organization
 *     responses:
 *       200:
 *         description: Organization report settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// Get report settings for organization
router.get('/report-settings', async (req, res, next) => {
  try {
    console.log('GET /report-settings - User:', req.user);
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      console.error('No organization ID found in request');
      return res.status(401).json({ error: 'Not authorized' });
    }

    const settings = await db.query.reportSettings.findFirst({
      where: eq(reportSettings.organizationId, organizationId)
    });

    console.log('Retrieved settings:', settings);
    res.json(settings || {});
  } catch (error) {
    console.error('Error fetching report settings:', error);
    next(error);
  }
});

// Save report settings
router.post('/report-settings', async (req, res, next) => {
  try {
    console.log('POST /report-settings - Request body:', req.body);
    console.log('POST /report-settings - User:', req.user);

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      console.error('No organization ID found in request');
      return res.status(401).json({ error: 'Not authorized' });
    }

    const settingsData = {
      ...req.body,
      organizationId,
      updatedAt: new Date()
    };

    console.log('Attempting to save settings:', settingsData);

    const existingSettings = await db.query.reportSettings.findFirst({
      where: eq(reportSettings.organizationId, organizationId)
    });

    let settings;
    if (existingSettings) {
      console.log('Updating existing settings for organization:', organizationId);
      [settings] = await db
        .update(reportSettings)
        .set(settingsData)
        .where(eq(reportSettings.organizationId, organizationId))
        .returning();
    } else {
      console.log('Creating new settings for organization:', organizationId);
      [settings] = await db.insert(reportSettings)
        .values(settingsData)
        .returning();
    }

    console.log('Successfully saved settings:', settings);
    res.json(settings);
  } catch (error) {
    console.error('Error saving report settings:', error);
    next(error);
  }
});

// Upload company logo
router.post('/logo', upload.single('logo'), async (req, res, next) => {
  try {
    console.log('POST /logo - File:', req.file);
    console.log('POST /logo - User:', req.user);

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      console.error('No organization ID found in request');
      // Delete the uploaded file since we can't use it
      fs.unlinkSync(path.join(uploadDir, req.file.filename));
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Update report settings with new logo filename
    const existingSettings = await db.query.reportSettings.findFirst({
      where: eq(reportSettings.organizationId, organizationId)
    });

    if (existingSettings) {
      // Delete old logo if it exists
      if (existingSettings.companyLogo) {
        const oldLogoPath = path.join(uploadDir, existingSettings.companyLogo);
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }

      await db
        .update(reportSettings)
        .set({ 
          companyLogo: req.file.filename,
          updatedAt: new Date()
        })
        .where(eq(reportSettings.organizationId, organizationId));
    } else {
      await db.insert(reportSettings).values({
        organizationId,
        companyLogo: req.file.filename
      });
    }

    console.log('Logo upload successful:', req.file.filename);
    res.json({ filename: req.file.filename });
  } catch (error) {
    console.error('Error uploading logo:', error);
    // Clean up uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(path.join(uploadDir, req.file.filename));
    }
    next(error);
  }
});

export default router;