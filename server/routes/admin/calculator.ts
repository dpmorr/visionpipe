import express from 'express';
import { z } from 'zod';
import { db } from '@db';
import { calculatorConfigs } from '@db/schema';
import { eq } from 'drizzle-orm';
import cors from 'cors';

const router = express.Router();

// Enable CORS for public endpoints
const publicEndpoints = cors();

/**
 * @openapi
 * /admin/calculator/calculator-configs/public/{id}:
 *   get:
 *     summary: Get public calculator configuration by ID
 *     tags:
 *       - Calculator
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Calculator config ID
 *     responses:
 *       200:
 *         description: Calculator configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
// Public endpoint to get calculator configuration
router.get('/calculator-configs/public/:id', publicEndpoints, async (req, res) => {
  try {
    console.log(`GET /calculator-configs/public/${req.params.id} - Fetching public configuration`);
    const config = await db.query.calculatorConfigs.findFirst({
      where: eq(calculatorConfigs.id, parseInt(req.params.id))
    });

    if (!config) {
      console.log(`Configuration with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Calculator configuration not found' });
    }

    // Transform the data to the expected format
    const responseData = {
      id: config.id,
      name: config.name,
      fields: config.fields || config.waste_types,
      formulas: config.formulas || config.additional_fees,
    };

    console.log('Found configuration:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching calculator config:', error);
    res.status(500).json({ error: 'Failed to fetch calculator configuration' });
  }
});

// Get all calculator configurations
router.get('/calculator-configs', async (req, res) => {
  try {
    console.log('GET /calculator-configs - Fetching all configurations');
    const configs = await db.query.calculatorConfigs.findMany();
    console.log('Fetched configurations:', configs);
    const responseData = configs.map(config => ({
      id: config.id,
      name: config.name,
      fields: config.fields || config.waste_types,
      formulas: config.formulas || config.additional_fees,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching calculator configs:', error);
    res.status(500).json({ error: 'Failed to fetch calculator configurations' });
  }
});

// Create new calculator configuration
router.post('/calculator-configs', async (req, res) => {
  try {
    console.log('POST /calculator-configs - Received request body:', req.body);

    // Validate the request data
    const validationResult = calculatorConfigSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error.errors);
      return res.status(400).json({ 
        error: 'Invalid calculator configuration', 
        details: validationResult.error.errors 
      });
    }

    const validatedData = validationResult.data;
    console.log('Validated data:', validatedData);

    // Ensure fields and formulas are valid arrays before storing
    if (!Array.isArray(validatedData.fields) || !Array.isArray(validatedData.formulas)) {
      return res.status(400).json({
        error: 'Invalid calculator configuration',
        details: 'Fields and formulas must be arrays'
      });
    }

    // Insert into database using both column sets
    const [newConfig] = await db.insert(calculatorConfigs)
      .values({
        name: validatedData.name,
        // Store in both legacy and new columns
        waste_types: validatedData.fields,
        additional_fees: validatedData.formulas,
        fields: validatedData.fields,
        formulas: validatedData.formulas,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('Successfully created configuration:', newConfig);

    // Transform the data for the response
    const responseData = {
      id: newConfig.id,
      name: newConfig.name,
      fields: newConfig.fields || newConfig.waste_types,
      formulas: newConfig.formulas || newConfig.additional_fees,
      createdAt: newConfig.createdAt,
      updatedAt: newConfig.updatedAt
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error('Detailed error creating calculator config:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid calculator configuration', 
        details: error.errors 
      });
    }
    res.status(500).json({ 
      error: 'Failed to create calculator configuration',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get specific calculator configuration
router.get('/calculator-configs/:id', async (req, res) => {
  try {
    console.log(`GET /calculator-configs/${req.params.id} - Fetching specific configuration`);
    const config = await db.query.calculatorConfigs.findFirst({
      where: eq(calculatorConfigs.id, parseInt(req.params.id))
    });

    if (!config) {
      console.log(`Configuration with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Calculator configuration not found' });
    }

    // Transform the data to the expected format
    const responseData = {
      id: config.id,
      name: config.name,
      fields: config.fields || config.waste_types,
      formulas: config.formulas || config.additional_fees,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };

    console.log('Found configuration:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching calculator config:', error);
    res.status(500).json({ error: 'Failed to fetch calculator configuration' });
  }
});

// Update calculator configuration
router.patch('/calculator-configs/:id', async (req, res) => {
  try {
    console.log(`PATCH /calculator-configs/${req.params.id} - Received update:`, req.body);
    const validatedData = calculatorConfigSchema.parse(req.body);

    const [updated] = await db.update(calculatorConfigs)
      .set({
        name: validatedData.name,
        fields: validatedData.fields,
        formulas: validatedData.formulas,
        waste_types: validatedData.fields,
        additional_fees: validatedData.formulas,
        updatedAt: new Date(),
      })
      .where(eq(calculatorConfigs.id, parseInt(req.params.id)))
      .returning();

    if (!updated) {
      console.log(`Configuration with ID ${req.params.id} not found for update`);
      return res.status(404).json({ error: 'Calculator configuration not found' });
    }

    // Transform the data to the expected format
    const responseData = {
      id: updated.id,
      name: updated.name,
      fields: updated.fields,
      formulas: updated.formulas,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    };

    console.log('Successfully updated configuration:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error updating calculator config:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid calculator configuration', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: 'Failed to update calculator configuration' });
  }
});

// Delete calculator configuration
router.delete('/calculator-configs/:id', async (req, res) => {
  try {
    console.log(`DELETE /calculator-configs/${req.params.id} - Attempting to delete`);
    await db.delete(calculatorConfigs)
      .where(eq(calculatorConfigs.id, parseInt(req.params.id)));
    console.log(`Successfully deleted configuration with ID ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting calculator config:', error);
    res.status(500).json({ error: 'Failed to delete calculator configuration' });
  }
});

// Zod schema for validation
const calculatorConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  fields: z.array(z.object({
    type: z.string(),
    name: z.string(),
    label: z.string(),
    unit: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).min(1, "At least one field is required"),
  formulas: z.array(z.object({
    name: z.string(),
    formula: z.string(),
    description: z.string(),
  })).min(1, "At least one formula is required"),
});

export default router;