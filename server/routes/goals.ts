import { Router } from 'express';
import { db } from '@db';
import { goals } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /goals:
 *   get:
 *     summary: Get all goals
 *     tags:
 *       - Goals
 *     responses:
 *       200:
 *         description: List of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

// Get all goals
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all goals...');
    const allGoals = await db.query.goals.findMany({
      orderBy: goals.createdAt,
    });
    console.log('Retrieved goals:', allGoals);
    res.json(allGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Failed to fetch goals' });
  }
});

// Create a new goal
router.post('/', async (req, res) => {
  try {
    const { type, description, targetPercentage, startDate, endDate } = req.body;
    console.log('Creating new goal with data:', req.body);

    const [newGoal] = await db
      .insert(goals)
      .values({
        type,
        description,
        targetPercentage: parseInt(targetPercentage),
        currentPercentage: 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'in_progress',
        userId: 1, // TODO: Replace with actual user ID from session
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('Created new goal:', newGoal);
    res.status(201).json(newGoal);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ message: 'Failed to create goal' });
  }
});

export default router;