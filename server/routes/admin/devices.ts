import { Router } from 'express';
import { z } from 'zod';
import { db } from '@db';
import { devices } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * @openapi
 * /api/admin/devices:
 *   get:
 *     summary: Get all devices
 *     tags:
 *       - Devices
 *     responses:
 *       200:
 *         description: List of devices
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Get all devices
router.get('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const allDevices = await db.query.devices.findMany({
      where: eq(devices.organizationId, organizationId),
      orderBy: devices.createdAt,
    });

    res.json(allDevices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get a single device
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const device = await db.query.devices.findFirst({
      where: eq(devices.id, parseInt(id)),
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Check if the device belongs to the organization
    if (device.organizationId !== organizationId) {
      return res.status(403).json({ error: 'Not authorized to access this device' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Connect to a device via SSH
router.post('/:id/connect', async (req, res) => {
  try {
    const { id } = req.params;
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ error: 'Access code is required' });
    }

    // TODO: Implement actual SSH connection logic
    // For now, just update the device status
    await db.update(devices)
      .set({ iotStatus: 'connected' })
      .where(eq(devices.id, parseInt(id)));

    res.json({ message: 'Connected to device successfully' });
  } catch (error) {
    console.error('Error connecting to device:', error);
    res.status(500).json({ error: 'Failed to connect to device' });
  }
});

// Disconnect from a device
router.post('/:id/disconnect', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual SSH disconnection logic
    // For now, just update the device status
    await db.update(devices)
      .set({ iotStatus: 'disconnected' })
      .where(eq(devices.id, parseInt(id)));

    res.json({ message: 'Disconnected from device successfully' });
  } catch (error) {
    console.error('Error disconnecting from device:', error);
    res.status(500).json({ error: 'Failed to disconnect from device' });
  }
});

// Execute a command on a device
const commandSchema = z.object({
  command: z.string().min(1),
});

router.post('/:id/command', async (req, res) => {
  try {
    const { id } = req.params;
    const { command } = commandSchema.parse(req.body);

    // TODO: Implement actual command execution logic
    // For now, just return a mock response
    res.json({
      output: `Executed command: ${command}`,
      status: 'success',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid command' });
    }
    console.error('Error executing command:', error);
    res.status(500).json({ error: 'Failed to execute command' });
  }
});

// Reboot a device
router.post('/:id/reboot', async (req, res) => {
  try {
    const { id } = req.params;

    // TODO: Implement actual reboot logic
    // For now, just update the device status
    await db.update(devices)
      .set({ status: 'rebooting' })
      .where(eq(devices.id, parseInt(id)));

    // Simulate reboot delay
    setTimeout(async () => {
      await db.update(devices)
        .set({ status: 'active' })
        .where(eq(devices.id, parseInt(id)));
    }, 5000);

    res.json({ message: 'Device reboot initiated' });
  } catch (error) {
    console.error('Error rebooting device:', error);
    res.status(500).json({ error: 'Failed to reboot device' });
  }
});

// Create a new device
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    if (!organizationId || !userId) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const { name, type, waste_point_id, device_token, device_id, status, iot_status } = req.body;

    if (!name || !type || !device_id || !device_token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [newDevice] = await db
      .insert(devices)
      .values({
        name,
        type,
        deviceId: device_id,
        deviceToken: device_token,
        userId,
        organizationId,
        status: status || 'active',
        iotStatus: iot_status || 'disconnected',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newDevice);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

/**
 * @openapi
 * /api/admin/devices/{id}/data:
 *   get:
 *     summary: Get device sensor data
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *       - in: query
 *         name: range
 *         required: false
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *         description: Time range for data
 *     responses:
 *       200:
 *         description: Device sensor data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
// Get device data with sensor readings
router.get('/:id/data', async (req, res) => {
  try {
    const { id } = req.params;
    const { range = '24h' } = req.query;
    const organizationId = req.user?.organizationId;
    
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Calculate time range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Generate dummy data for the sensor
    const dummyData = generateDummySensorData(parseInt(id), startDate, now, range as string);
    
    res.json(dummyData);
  } catch (error) {
    console.error('Error fetching device data:', error);
    res.status(500).json({ message: 'Failed to fetch device data' });
  }
});

// Helper function to generate dummy sensor data
function generateDummySensorData(deviceId: number, startDate: Date, endDate: Date, range: string): any[] {
  const data: any[] = [];
  const interval = range === '1h' ? 10 * 60 * 1000 : // 10 minutes for 1h
                   range === '24h' ? 30 * 60 * 1000 : // 30 minutes for 24h
                   range === '7d' ? 2 * 60 * 60 * 1000 : // 2 hours for 7d
                   3 * 60 * 60 * 1000; // 3 hours for 30d

  let currentTime = new Date(startDate);
  
  // Calculate consistent base values that don't change with timeframe
  const baseDistanceToTop = 25.5; // Consistent distance
  const baseBatteryLevel = 87; // Consistent battery level
  const baseItemsDetected = [
    { name: 'Paper', confidence: 0.92, count: 8 },
    { name: 'Plastic', confidence: 0.88, count: 12 },
    { name: 'Cardboard', confidence: 0.91, count: 5 },
    { name: 'Metal', confidence: 0.94, count: 3 },
    { name: 'Glass', confidence: 0.89, count: 2 },
    { name: 'Organic', confidence: 0.85, count: 6 }
  ];
  
  // Set up collection schedule (every 12 hours)
  const collectionInterval = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
  
  while (currentTime <= endDate) {
    // Calculate fill level based on time since epoch to ensure consistent pattern across timeframes
    const timeSinceEpoch = currentTime.getTime();
    const timeSinceLastCollection = timeSinceEpoch % collectionInterval;
    const hoursSinceCollection = timeSinceLastCollection / (60 * 60 * 1000);
    
    // Fill level increases from 5% to 98% over 12 hours, then resets
    let fillLevel;
    if (hoursSinceCollection < 12) {
      // Fill from 5% to 98% over 12 hours (7.75% per hour)
      fillLevel = 5 + (hoursSinceCollection * 7.75);
    } else {
      // Reset to 5% after collection
      fillLevel = 5;
    }
    
    // Add some realistic noise (±1% to keep it closer to the intended values)
    fillLevel = Math.max(0, Math.min(100, fillLevel + (Math.random() - 0.5) * 2));
    
    // Check if this is a collection time (within 1 hour of collection schedule)
    const isCollectionTime = hoursSinceCollection >= 11 && hoursSinceCollection <= 13;
    
    // Generate distance data (inverse of fill level, but keep consistent base)
    const distanceToTop = Math.max(5, 100 - fillLevel + (Math.random() - 0.5) * 2);
    
    // Generate temperature and humidity with daily cycles
    const dayProgress = (currentTime.getTime() % (24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000);
    const temperature = 18 + Math.sin(dayProgress * 2 * Math.PI) * 8 + (Math.random() - 0.5) * 2;
    const humidity = 45 + Math.sin(dayProgress * 2 * Math.PI) * 15 + (Math.random() - 0.5) * 5;
    
    data.push({
      timestamp: currentTime.toISOString(),
      value: fillLevel,
      unit: 'percent',
      fillLevel: fillLevel,
      distanceToTop: distanceToTop,
      itemsDetected: baseItemsDetected, // Keep consistent
      temperature: temperature,
      humidity: humidity,
      batteryLevel: baseBatteryLevel, // Keep consistent
      lastCollected: getLastCollectionTime(currentTime),
      processingTime: 150 + Math.random() * 100,
      confidence: 0.85 + Math.random() * 0.1,
      imageUrl: `https://example.com/sensor-images/${deviceId}/${currentTime.getTime()}.jpg`,
      wasCollected: isCollectionTime
    });
    
    currentTime = new Date(currentTime.getTime() + interval);
  }
  
  return data;
}



// Helper function to get last collection time
function getLastCollectionTime(currentTime: Date): string {
  // Simulate collection every 2-3 days
  const daysSinceCollection = Math.floor(Math.random() * 3) + 1;
  const lastCollection = new Date(currentTime.getTime() - daysSinceCollection * 24 * 60 * 60 * 1000);
  return lastCollection.toISOString();
}

export default router; 