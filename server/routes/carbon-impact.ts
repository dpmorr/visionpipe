import { Router } from 'express';
import { db } from '@db';
import { carbonImpact } from '@db/schema';
import { desc } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /carbon-impact/latest:
 *   get:
 *     summary: Get latest carbon impact metrics
 *     tags:
 *       - CarbonImpact
 *     responses:
 *       200:
 *         description: Latest carbon impact metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// Get latest carbon impact metrics
router.get('/latest', async (req, res) => {
  try {
    const latestImpact = await db.query.carbonImpact.findFirst({
      orderBy: desc(carbonImpact.timestamp),
      where: (carbonImpact, { eq }) => eq(carbonImpact.organizationId, req.user?.organizationId || 0)
    });

    // If no data exists, return default values
    if (!latestImpact) {
      return res.json({
        wasteReduction: 150,
        carbonSavings: 75,
        energySavings: 50,
        costSavings: 1000,
        timestamp: new Date().toISOString()
      });
    }

    res.json(latestImpact);
  } catch (error) {
    console.error('Error fetching latest carbon impact:', error);
    res.status(500).json({ message: 'Failed to fetch carbon impact data' });
  }
});

// Get historical carbon impact data
router.get('/history', async (req, res) => {
  try {
    const impactHistory = await db.query.carbonImpact.findMany({
      orderBy: desc(carbonImpact.timestamp),
      limit: 12, // Last 12 months by default
    });

    res.json(impactHistory);
  } catch (error) {
    console.error('Error fetching carbon impact history:', error);
    res.status(500).json({ message: 'Failed to fetch carbon impact history' });
  }
});

export default router;