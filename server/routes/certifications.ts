import { Router } from 'express';
import { db } from '@db';
import { certifications, userCertifications } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /certifications:
 *   get:
 *     summary: Get all certifications
 *     tags:
 *       - Certifications
 *     responses:
 *       200:
 *         description: List of certifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Get all certifications
router.get('/certifications', async (_req, res) => {
  try {
    const allCertifications = await db.query.certifications.findMany({
      orderBy: certifications.createdAt
    });
    res.json(allCertifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    res.status(500).json({ message: 'Failed to fetch certifications' });
  }
});

// Get user certifications
router.get('/user-certifications', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const userCerts = await db.query.userCertifications.findMany({
      where: eq(userCertifications.userId, req.user.id),
      with: {
        certification: true
      }
    });

    // Transform the data to match the expected frontend structure
    const transformedCerts = userCerts.map(cert => ({
      id: cert.id,
      userId: cert.userId,
      status: cert.status,
      applicationDate: cert.applicationDate?.toISOString(),
      issueDate: cert.issueDate?.toISOString(),
      expiryDate: cert.expiryDate?.toISOString(),
      certificationType: cert.certification
    }));

    res.json(transformedCerts);
  } catch (error) {
    console.error('Error fetching user certifications:', error);
    res.status(500).json({ message: 'Failed to fetch user certifications' });
  }
});

// Get certification progress for current user
router.get('/certification-progress', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const progress = await db.query.userCertifications.findMany({
      where: eq(userCertifications.userId, req.user.id),
      with: {
        certification: true,
      },
    });

    // Format the progress data
    const formattedProgress = progress.map(p => ({
      id: p.id,
      certificationId: p.certification.id,
      currentStage: p.status,
      startedAt: p.applicationDate?.toISOString(),
      appliedAt: p.applicationDate?.toISOString(),
      inProgressAt: p.applicationDate?.toISOString(), 
      approvedAt: p.issueDate?.toISOString(),
      expiredAt: p.expiryDate?.toISOString(),
      nextSteps: [],
      notes: 'Certification process initiated'
    }));

    res.json(formattedProgress);
  } catch (error) {
    console.error('Error fetching certification progress:', error);
    res.status(500).json({ message: 'Failed to fetch certification progress' });
  }
});

// Start certification process
router.post('/certifications/start', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { certificationTypeId } = req.body;

  try {
    // Check if certification exists
    const certification = await db.query.certifications.findFirst({
      where: eq(certifications.id, certificationTypeId),
    });

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found' });
    }

    // Check if user already has this certification in progress
    const existingCert = await db.query.userCertifications.findFirst({
      where: and(
        eq(userCertifications.userId, req.user.id),
        eq(userCertifications.certificationId, certificationTypeId)
      ),
    });

    if (existingCert) {
      return res.status(400).json({ message: 'Certification process already started' });
    }

    // Start the certification process
    const [newProgress] = await db
      .insert(userCertifications)
      .values({
        userId: req.user.id,
        certificationId: certificationTypeId,
        status: 'started',
        applicationDate: new Date(),
      })
      .returning();

    // Return the new progress with certification details
    const progressWithCert = await db.query.userCertifications.findFirst({
      where: eq(userCertifications.id, newProgress.id),
      with: {
        certification: true
      }
    });

    res.json(progressWithCert);
  } catch (error) {
    console.error('Error starting certification process:', error);
    res.status(500).json({ message: 'Failed to start certification process' });
  }
});

// Add new endpoint to update certification progress stage
router.post('/certification-progress/:id/update-stage', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { stage, checked, newStatus } = req.body;
  const progressId = parseInt(req.params.id);

  try {
    // Verify the progress exists and belongs to the user
    const existingProgress = await db.query.userCertifications.findFirst({
      where: and(
        eq(userCertifications.id, progressId),
        eq(userCertifications.userId, req.user.id)
      ),
    });

    if (!existingProgress) {
      return res.status(404).json({ message: 'Certification progress not found' });
    }

    // Update the progress stage
    const [updatedProgress] = await db
      .update(userCertifications)
      .set({
        status: newStatus,
        ...(checked ? {
          ...(stage === 'applied' && { applicationDate: new Date() }),
          ...(stage === 'in_progress' && { inProgressDate: new Date() }),
          ...(stage === 'approved' && { issueDate: new Date() })
        } : {
          // Clear dates when unchecking
          ...(stage === 'applied' && { applicationDate: null }),
          ...(stage === 'in_progress' && { inProgressDate: null }),
          ...(stage === 'approved' && { issueDate: null })
        }),
        updatedAt: new Date()
      })
      .where(eq(userCertifications.id, progressId))
      .returning();

    // Fetch the updated progress with certification details
    const progressWithCert = await db.query.userCertifications.findFirst({
      where: eq(userCertifications.id, updatedProgress.id),
      with: {
        certification: true
      }
    });

    res.json(progressWithCert);
  } catch (error) {
    console.error('Error updating certification progress:', error);
    res.status(500).json({ message: 'Failed to update certification progress' });
  }
});

export default router;