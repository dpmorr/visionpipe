import { Router } from 'express';
import { db } from '@db';
import { wasteAudits } from '@db/schema';
import { eq, desc } from 'drizzle-orm';

const router = Router();

// POST /api/waste-audits - create a new audit
router.post('/', async (req, res) => {
  try {
    const { wastePointId, date, auditor, wasteType, volume, notes } = req.body;
    const user = req.user;
    if (!user || !user.organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!wastePointId || !date || !auditor || !wasteType || !volume) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    // Insert audit
    const [audit] = await db.insert(wasteAudits).values({
      wastePointId,
      date,
      auditor,
      wasteType,
      volume,
      notes,
    }).returning();
    res.status(201).json(audit);
  } catch (err) {
    console.error('Failed to create waste audit:', err);
    res.status(500).json({ message: 'Failed to create waste audit' });
  }
});

// GET /api/waste-audits/:wastePointId - get all audits for a waste point
router.get('/:wastePointId', async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const wastePointId = parseInt(req.params.wastePointId, 10);
    if (isNaN(wastePointId)) {
      return res.status(400).json({ message: 'Invalid wastePointId' });
    }
    const audits = await db.select().from(wasteAudits)
      .where(eq(wasteAudits.wastePointId, wastePointId))
      .orderBy(desc(wasteAudits.date));
    res.json(audits);
  } catch (err) {
    console.error('Failed to fetch waste audits:', err);
    res.status(500).json({ message: 'Failed to fetch waste audits' });
  }
});

export default router; 