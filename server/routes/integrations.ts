import { Router } from 'express';
import { db } from '@db';
import { integrations, organizationIntegrations } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /integrations:
 *   get:
 *     summary: Get all available integrations
 *     tags:
 *       - Integrations
 *     responses:
 *       200:
 *         description: List of integrations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Get all available integrations
router.get('/', async (_req, res) => {
  try {
    console.log('Fetching all integrations...');
    const allIntegrations = await db.query.integrations.findMany({
      orderBy: (integrations, { desc }) => [desc(integrations.createdAt)]
    });
    console.log('Found integrations:', allIntegrations);
    res.json(allIntegrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Get organization's integration statuses
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const orgIntegrations = await db.query.organizationIntegrations.findMany({
      where: eq(organizationIntegrations.organizationId, parseInt(req.params.organizationId))
    });
    res.json(orgIntegrations);
  } catch (error) {
    console.error('Error fetching organization integrations:', error);
    res.status(500).json({ error: 'Failed to fetch organization integrations' });
  }
});

// Connect an integration
router.post('/connect/:integrationId', async (req, res) => {
  try {
    const [integration] = await db.insert(organizationIntegrations)
      .values({
        integrationId: parseInt(req.params.integrationId),
        organizationId: req.body.organizationId,
        status: 'connected',
        config: req.body.config || {},
      })
      .onConflictDoUpdate({
        target: [
          organizationIntegrations.integrationId,
          organizationIntegrations.organizationId,
        ],
        set: {
          status: 'connected',
          config: req.body.config || {},
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(integration);
  } catch (error) {
    console.error('Error connecting integration:', error);
    res.status(500).json({ error: 'Failed to connect integration' });
  }
});

// Disconnect an integration
router.post('/disconnect/:integrationId', async (req, res) => {
  try {
    const [integration] = await db.update(organizationIntegrations)
      .set({
        status: 'disconnected',
        updatedAt: new Date(),
      })
      .where(eq(organizationIntegrations.integrationId, parseInt(req.params.integrationId)))
      .returning();

    res.json(integration);
  } catch (error) {
    console.error('Error disconnecting integration:', error);
    res.status(500).json({ error: 'Failed to disconnect integration' });
  }
});

export default router;