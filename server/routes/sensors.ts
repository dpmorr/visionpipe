import { Router } from 'express';
import { db } from '@db';
import { devices } from '@db/schema';
import { eq } from 'drizzle-orm';
import { awsIoTService } from '../services/aws-iot';

const router = Router();

/**
 * @openapi
 * /sensors:
 *   get:
 *     summary: Get all devices for the user
 *     tags:
 *       - Sensors
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *   post:
 *     summary: Create a new device
 *     tags:
 *       - Sensors
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               location:
 *                 type: string
 *               accessCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Device created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields
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
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get all devices associated with this user
    const userDevices = await db.query.devices.findMany({
      where: eq(devices.userId, userId)
    });

    res.json(userDevices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Failed to fetch devices' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, location, accessCode } = req.body;
    const userId = req.user?.id;

    if (!name || !type) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ['name', 'type'],
        received: req.body
      });
    }

    // Generate a random access code if not provided
    const deviceAccessCode = accessCode || Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create device in database
    const [newDevice] = await db
      .insert(devices)
      .values({
        deviceId: deviceAccessCode,
        name: name,
        type: type,
        location: location || null,
        status: "active",
        iotStatus: "disconnected",
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newDevice);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ message: 'Failed to create device' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, type, location, accessCode, status, iotStatus } = req.body;

    // Build the update object dynamically based on what's provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (location !== undefined) updateData.location = location;
    if (accessCode !== undefined) updateData.deviceId = accessCode;
    if (status !== undefined) updateData.status = status;
    if (iotStatus !== undefined) updateData.iotStatus = iotStatus;

    const [updatedDevice] = await db
      .update(devices)
      .set(updateData)
      .where(eq(devices.id, Number(id)))
      .returning();

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json(updatedDevice);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Failed to update device' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('Deleting device with ID:', id);

    const [deletedDevice] = await db
      .delete(devices)
      .where(eq(devices.id, Number(id)))
      .returning();

    if (!deletedDevice) {
      console.log('No device found with ID:', id);
      return res.status(404).json({ message: 'Device not found' });
    }

    console.log('Successfully deleted device:', deletedDevice);
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Failed to delete device' });
  }
});

export default router;