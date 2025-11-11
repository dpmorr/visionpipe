import { Router } from 'express';
import { db } from '@db';
import { analyticsConfigs } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /analytics-configs:
 *   get:
 *     summary: Get all analytics configurations for the organization
 *     tags:
 *       - AnalyticsConfigs
 *     responses:
 *       200:
 *         description: Grouped analytics configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// Get all analytics configurations for the organization
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 2;
    const configs = await db.query.analyticsConfigs.findMany({
      where: eq(analyticsConfigs.organizationId, organizationId),
      orderBy: analyticsConfigs.createdAt
    });

    // Group configurations by type
    const groupedConfigs = configs.reduce((acc: any, config) => {
      // Fix: Change the type name to be grammatically correct
      let type = config.type;
      if (type === 'analysis') {
        type = 'analyses';
      } else {
        type = type + 's';
      }

      if (!acc[type]) acc[type] = [];
      acc[type].push(config);
      return acc;
    }, {});

    console.log('Returning grouped configs:', groupedConfigs);
    res.json(groupedConfigs);
  } catch (error) {
    console.error('Error fetching analytics configurations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch configurations',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Save a new analytics configuration
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId || 2;
    const { type, name, config } = req.body;

    console.log('Saving new config:', { type, name, config });

    const newConfig = await db.insert(analyticsConfigs).values({
      organizationId,
      type,
      name,
      config,
      active: true,
      is_standard: false
    }).returning();

    console.log('Saved config:', newConfig[0]);
    res.json(newConfig[0]);
  } catch (error) {
    console.error('Error saving analytics configuration:', error);
    res.status(500).json({
      error: 'Failed to save configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Update analytics configuration
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { schedule } = req.body;
    const organizationId = req.user?.organizationId || 2;

    const updatedConfig = await db
      .update(analyticsConfigs)
      .set({
        schedule,
        updatedAt: new Date(),
      })
      .where(eq(analyticsConfigs.id, parseInt(id)))
      .returning();

    res.json(updatedConfig[0]);
  } catch (error) {
    console.error('Error updating analytics configuration:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Delete analytics configuration
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 2;

    await db
      .delete(analyticsConfigs)
      .where(eq(analyticsConfigs.id, parseInt(id)));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting analytics configuration:', error);
    res.status(500).json({
      error: 'Failed to delete configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;