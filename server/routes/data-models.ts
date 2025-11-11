import { Router } from 'express';
import { db } from '@db';
import { dataModels } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/data-models - list all data models for the organization
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const models = await db.query.dataModels.findMany({
      where: eq(dataModels.organizationId, organizationId),
      orderBy: dataModels.createdAt,
    });
    res.json(models);
  } catch (error) {
    console.error('Error fetching data models:', error);
    res.status(500).json({ message: 'Failed to fetch data models' });
  }
});

// GET /api/data-models/:id - get a single data model
router.get('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    console.log('API Debug - User org ID:', organizationId, 'Requested ID:', req.params.id);
    
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const id = parseInt(req.params.id);
    
    // First, let's see if the model exists at all
    const allModels = await db.query.dataModels.findMany();
    console.log('All models in DB:', allModels);
    
    const model = await db.query.dataModels.findFirst({
      where: (dm, { and }) => and(
        eq(dataModels.id, id),
        eq(dataModels.organizationId, organizationId)
      )
    });
    
    console.log('Found model:', model);
    
    if (!model) {
      return res.status(404).json({ 
        message: 'Data model not found',
        debug: {
          requestedId: id,
          userOrgId: organizationId,
          totalModels: allModels.length
        }
      });
    }
    res.json(model);
  } catch (error) {
    console.error('Error fetching data model:', error);
    res.status(500).json({ message: 'Failed to fetch data model' });
  }
});

// POST /api/data-models - create a new data model
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const { name, description, type, source, version, status, builderConfig } = req.body;
    if (!name || !type || !source || !version || !status) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const [newModel] = await db.insert(dataModels).values({
      name,
      description,
      type,
      source,
      version,
      status,
      builderConfig,
      organizationId,
      lastUpdated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(newModel);
  } catch (error) {
    console.error('Error creating data model:', error);
    res.status(500).json({ message: 'Failed to create data model' });
  }
});

// PUT /api/data-models/:id - update a data model
router.put('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const id = parseInt(req.params.id);
    const { name, description, type, source, version, status, builderConfig } = req.body;
    const [updatedModel] = await db.update(dataModels)
      .set({
        name,
        description,
        type,
        source,
        version,
        status,
        builderConfig,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dataModels.id, id))
      .returning();
    if (!updatedModel) {
      return res.status(404).json({ message: 'Data model not found' });
    }
    res.json(updatedModel);
  } catch (error) {
    console.error('Error updating data model:', error);
    res.status(500).json({ message: 'Failed to update data model' });
  }
});

// DELETE /api/data-models/:id - delete a data model
router.delete('/:id', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const id = parseInt(req.params.id);
    const [deletedModel] = await db.delete(dataModels)
      .where(eq(dataModels.id, id))
      .returning();
    if (!deletedModel) {
      return res.status(404).json({ message: 'Data model not found' });
    }
    res.json({ message: 'Data model deleted' });
  } catch (error) {
    console.error('Error deleting data model:', error);
    res.status(500).json({ message: 'Failed to delete data model' });
  }
});

export default router; 