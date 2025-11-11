import { Router } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /wastePoints:
 *   get:
 *     summary: Get all waste points
 *     tags:
 *       - WastePoints
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: false
 *         schema:
 *           type: string
 *         description: Comma-separated list of waste point IDs
 *     responses:
 *       200:
 *         description: List of waste points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

// Get all waste points
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check if we're fetching specific waste points by IDs
    const ids = req.query.ids as string;
    if (ids) {
      const wastePointIds = ids.split(',').map(id => parseInt(id));
      const result = await db.execute(sql`
        SELECT * FROM waste_points 
        WHERE id = ANY(${wastePointIds})
        AND organization_id = ${organizationId}
      `);
      return res.json(result.rows);
    }

    // Otherwise fetch all waste points for the organization
    const result = await db.execute(sql`
      SELECT wp.*, d.name as "device.name", d.type as "device.type"
      FROM waste_points wp
      LEFT JOIN devices d ON wp.device_id = d.id
      WHERE wp.organization_id = ${organizationId}
      ORDER BY wp.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching waste points:', error);
    res.status(500).json({ message: 'Failed to fetch waste points' });
  }
});

export default router; 