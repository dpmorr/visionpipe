import { Router } from 'express';
import { db } from '@db';
import { schedules } from '@db/schema';
import { eq } from 'drizzle-orm';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { randomUUID } from 'crypto';

const router = Router();

/**
 * @openapi
 * /schedules:
 *   get:
 *     summary: Get all schedules for the organization
 *     tags:
 *       - Schedules
 *     responses:
 *       200:
 *         description: List of schedules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/', async (req, res) => {
  try {
    const results = await db.query.schedules.findMany({
      where: req.user?.organizationId ? 
        eq(schedules.organizationId, req.user.organizationId) : 
        undefined,
      with: {
        wastePoint: true
      }
    });
    res.json(results);
  } catch (error) {
    console.error('Failed to fetch schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Create a new schedule
router.post('/', async (req, res) => {
  try {
    const { date, wasteTypes, vendor, wastePointId } = req.body;

    if (!wastePointId) {
      return res.status(400).json({ error: 'wastePointId is required' });
    }

    // Create a single schedule entry
    try {
      const result = await db.insert(schedules).values({
        date: new Date(date),
        wasteTypes,
        vendor,
        wastePointId,
        status: 'pending',
        organizationId: req.user?.organizationId
      }).returning();
      console.log('Successfully created schedule:', result);
      res.json(result[0]);
    } catch (insertError) {
      console.error('Failed to insert schedule:', insertError);
      res.status(500).json({ error: 'Failed to create schedule', details: insertError.message });
    }
  } catch (error) {
    console.error('Failed to process schedule creation:', error);
    res.status(500).json({ error: 'Failed to create schedule', details: error.message });
  }
});


// Update a single schedule
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, wasteTypes, vendor, status } = req.body;

    console.log('Updating schedule:', { id, updates: req.body });

    const result = await db.update(schedules)
      .set({
        date: date ? new Date(date) : undefined,
        wasteTypes: wasteTypes || undefined,
        vendor: vendor || undefined,
        status: status || undefined,
      })
      .where(eq(schedules.id, parseInt(id, 10)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Failed to update schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
});

export default router;