import { Router } from 'express';
import { db } from '@db';
import { alerts } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /alerts:
 *   get:
 *     summary: Get all alerts for the organization
 *     tags:
 *       - Alerts
 *     responses:
 *       200:
 *         description: List of alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Alert'
 *       401:
 *         description: Not authorized
 */
// GET /api/alerts - list all alerts for the organization
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const allAlerts = await db.query.alerts.findMany({
      where: eq(alerts.organizationId, organizationId),
      orderBy: alerts.createdAt,
    });
    res.json(allAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Failed to fetch alerts' });
  }
});

/**
 * @openapi
 * /alerts:
 *   post:
 *     summary: Create a new alert
 *     tags:
 *       - Alerts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertInput'
 *     responses:
 *       201:
 *         description: Alert created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authorized
 *       500:
 *         description: Failed to create alert
 */
// POST /api/alerts - create a new alert
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const { name, type, targetType, targetId, condition, threshold, notificationMethod, active } = req.body;
    if (!name || !type || !targetType || !condition || !threshold || !notificationMethod) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const [newAlert] = await db.insert(alerts).values({
      organizationId,
      name,
      type,
      targetType,
      targetId,
      condition,
      threshold,
      notificationMethod,
      active: active !== undefined ? active : true,
    }).returning();
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Failed to create alert' });
  }
});

/**
 * @openapi
 * /alerts/{id}:
 *   put:
 *     summary: Update an alert
 *     tags:
 *       - Alerts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AlertInput'
 *     responses:
 *       200:
 *         description: Alert updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Invalid alert id
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Failed to update alert
 */
// PUT /api/alerts/:id - update an alert
router.put('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const alertId = parseInt(req.params.id, 10);
    if (isNaN(alertId)) {
      return res.status(400).json({ message: 'Invalid alert id' });
    }
    const { name, type, targetType, targetId, condition, threshold, notificationMethod, active } = req.body;
    const [updatedAlert] = await db.update(alerts)
      .set({ name, type, targetType, targetId, condition, threshold, notificationMethod, active, updatedAt: new Date() })
      .where(eq(alerts.id, alertId))
      .returning();
    if (!updatedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ message: 'Failed to update alert' });
  }
});

/**
 * @openapi
 * /alerts/{id}:
 *   delete:
 *     summary: Delete an alert
 *     tags:
 *       - Alerts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Alert deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Invalid alert id
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Failed to delete alert
 */
// DELETE /api/alerts/:id - delete an alert
router.delete('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const alertId = parseInt(req.params.id, 10);
    if (isNaN(alertId)) {
      return res.status(400).json({ message: 'Invalid alert id' });
    }
    const [deletedAlert] = await db.delete(alerts)
      .where(eq(alerts.id, alertId))
      .returning();
    if (!deletedAlert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Failed to delete alert' });
  }
});

/**
 * @openapi
 * components:
 *   schemas:
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         organizationId:
 *           type: integer
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         targetType:
 *           type: string
 *           description: "'sensor' or 'waste_point'"
 *         targetId:
 *           type: integer
 *           nullable: true
 *         condition:
 *           type: string
 *         threshold:
 *           type: string
 *         notificationMethod:
 *           type: string
 *         active:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AlertInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *         targetType:
 *           type: string
 *         targetId:
 *           type: integer
 *           nullable: true
 *         condition:
 *           type: string
 *         threshold:
 *           type: string
 *         notificationMethod:
 *           type: string
 *         active:
 *           type: boolean
 *       required:
 *         - name
 *         - type
 *         - targetType
 *         - condition
 *         - threshold
 *         - notificationMethod
 */
export default router; 