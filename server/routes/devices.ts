import { Router } from 'express';
import { db } from '@db';
import { devices, wastePoints } from '@db/schema';
import { eq, inArray } from 'drizzle-orm';
import { SelectWastePoint } from '@db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

/**
 * @openapi
 * /devices:
 *   get:
 *     summary: Get all devices for the organization
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

/**
 * @openapi
 * /devices/{id}:
 *   get:
 *     summary: Get device by ID
 *     tags:
 *       - Devices
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Device not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @openapi
 * /devices/{id}/data:
 *   get:
 *     summary: Get device data
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
 *         description: Device data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
// Get all devices
router.get('/', async (req, res) => {
  console.log('=== DEVICES ROUTE HIT ===');
  try {
    const organizationId = req.user?.organizationId;
    console.log('Organization ID:', organizationId);
    if (!organizationId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get devices first to see their waste_point_id
    console.log('Fetching devices...');
    const query = sql`
      WITH device_data AS (
        SELECT 
          d.*,
          wp.id as wp_id,
          wp.process_step,
          wp.waste_type,
          wp.estimated_volume,
          wp.unit,
          wp.vendor
        FROM devices d
        LEFT JOIN waste_points wp ON wp.id = d."wastePointId"
        WHERE d.organization_id = ${organizationId}
      )
      SELECT 
        d.*,
        CASE 
          WHEN d.wp_id IS NOT NULL THEN 
            json_build_object(
              'process_step', d.process_step,
              'waste_type', d.waste_type,
              'estimated_volume', d.estimated_volume,
              'unit', d.unit,
              'vendor', d.vendor
            )
          ELSE NULL
        END as "wastePoint"
      FROM device_data d
      ORDER BY d.created_at DESC
    `;
    console.log('SQL Query:', query.sql);
    console.log('SQL Values:', query.values);

    const devicesResult = await db.execute(query);
    console.log('Raw SQL Result:', JSON.stringify(devicesResult.rows, null, 2));
    
    console.log('=== DEVICE DETAILS ===');
    devicesResult.rows.forEach((device, index) => {
      console.log(`\nDevice ${index + 1}:`, {
        id: device.id,
        name: device.name,
        type: device.type,
        waste_point_id: device.waste_point_id,
        wastePoint: device.wastePoint,
        status: device.status,
        iotStatus: device.iot_status,
        raw: device // Log the entire raw device object
      });
    });

    // Write devices data to file in server directory
    const devicesPath = path.join(__dirname, 'devices_dump.json');
    fs.writeFileSync(devicesPath, JSON.stringify(devicesResult.rows, null, 2));
    console.log('Devices data written to:', devicesPath);

    // Get waste points to see what's available
    console.log('\nFetching waste points...');
    const wastePointsResult = await db.execute(sql`
      SELECT * FROM waste_points 
      WHERE organization_id = ${organizationId}
    `);
    console.log('Waste points found:', wastePointsResult.rows.length);
    console.log('=== WASTE POINT DETAILS ===');
    wastePointsResult.rows.forEach((wp, index) => {
      console.log(`\nWaste Point ${index + 1}:`);
      console.log('ID:', wp.id);
      console.log('Process Step:', wp.process_step);
      console.log('Device ID:', wp.device_id);
      console.log('Waste Type:', wp.waste_type);
      console.log('Created At:', wp.created_at);
      console.log('Updated At:', wp.updated_at);
      console.log('-------------------');
    });

    const wastePointsPath = path.join(__dirname, 'waste_points_dump.json');
    fs.writeFileSync(wastePointsPath, JSON.stringify(wastePointsResult.rows, null, 2));
    console.log('Waste points data written to:', wastePointsPath);

    // Now try to join them
    console.log('\nJoining devices with waste points...');
    const result = await db.execute(sql`
      SELECT 
        d.*,
        CASE 
          WHEN wp.id IS NOT NULL THEN 
            json_build_object(
              'process_step', wp.process_step
            )
          ELSE NULL
        END as "wastePoint"
      FROM devices d
      LEFT JOIN waste_points wp ON wp.id = d."wastePointId"
      WHERE d.organization_id = ${organizationId}
      ORDER BY d.created_at DESC
    `);
    console.log('Joined results found:', result.rows.length);
    console.log('=== JOINED RESULT DETAILS ===');
    result.rows.forEach((row, index) => {
      console.log(`\nJoined Result ${index + 1}:`);
      console.log('Device ID:', row.id);
      console.log('Device Name:', row.name);
      console.log('Waste Point ID:', row.waste_point_id);
      console.log('Waste Point Data:', row.wastePoint);
      console.log('-------------------');
    });

    // Write joined result to file in server directory
    const joinedResultPath = path.join(__dirname, 'joined_result_dump.json');
    fs.writeFileSync(joinedResultPath, JSON.stringify(result.rows, null, 2));
    console.log('Joined result written to:', joinedResultPath);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Failed to fetch devices' });
  }
});

// Get device by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const device = await db.query.devices.findFirst({
      where: eq(devices.id, parseInt(id)),
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ message: 'Failed to fetch device' });
  }
});

// Create a new device
router.post('/', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const { name, type, location, deviceId, deviceToken } = req.body;

    if (!name || !type || !deviceId || !deviceToken) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const [newDevice] = await db
      .insert(devices)
      .values({
        name,
        type,
        location: location || 'TBC',
        status: 'active',
        iotStatus: 'disconnected',
        deviceId,
        deviceToken,
        organizationId,
        userId: req.user?.id,
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

// Update a device
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { wastePointId, ...updatedDeviceData } = req.body;

    const [updatedDevice] = await db
      .update(devices)
      .set({
        ...updatedDeviceData,
        wastePointId: wastePointId ? parseInt(wastePointId) : null,
        updatedAt: new Date(),
      })
      .where(eq(devices.id, parseInt(id)))
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

// Delete a device
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedDevice] = await db
      .delete(devices)
      .where(eq(devices.id, parseInt(id)))
      .returning();

    if (!deletedDevice) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Failed to delete device' });
  }
});

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
  const interval = range === '1h' ? 5 * 60 * 1000 : // 5 minutes for 1h
                   range === '24h' ? 30 * 60 * 1000 : // 30 minutes for 24h
                   range === '7d' ? 4 * 60 * 60 * 1000 : // 4 hours for 7d
                   24 * 60 * 60 * 1000; // 1 day for 30d

  let currentTime = new Date(startDate);
  
  while (currentTime <= endDate) {
    // Generate realistic fill level data (0-100%)
    const baseFillLevel = 45 + Math.sin(currentTime.getTime() / (24 * 60 * 60 * 1000)) * 20; // Daily cycle
    const fillLevel = Math.max(0, Math.min(100, baseFillLevel + (Math.random() - 0.5) * 10));
    
    // Generate distance data (inverse of fill level)
    const distanceToTop = 100 - fillLevel + (Math.random() - 0.5) * 5;
    
    // Generate items detected based on fill level
    const itemsDetected = generateItemsDetected(fillLevel);
    
    // Generate temperature and humidity
    const temperature = 20 + Math.sin(currentTime.getTime() / (24 * 60 * 60 * 1000)) * 5 + (Math.random() - 0.5) * 2;
    const humidity = 50 + Math.sin(currentTime.getTime() / (24 * 60 * 60 * 1000)) * 10 + (Math.random() - 0.5) * 5;
    
    // Generate battery level (slowly decreasing)
    const batteryLevel = Math.max(20, 95 - (currentTime.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000) * 10);
    
    data.push({
      timestamp: currentTime.toISOString(),
      value: fillLevel,
      unit: 'percent',
      fillLevel: fillLevel,
      distanceToTop: distanceToTop,
      itemsDetected: itemsDetected,
      temperature: temperature,
      humidity: humidity,
      batteryLevel: batteryLevel,
      lastCollected: getLastCollectionTime(currentTime),
      processingTime: 150 + Math.random() * 100,
      confidence: 0.85 + Math.random() * 0.1,
      imageUrl: `https://example.com/sensor-images/${deviceId}/${currentTime.getTime()}.jpg`
    });
    
    currentTime = new Date(currentTime.getTime() + interval);
  }
  
  return data;
}

// Helper function to generate items detected based on fill level
function generateItemsDetected(fillLevel: number): any[] {
  const items = [
    { name: 'Paper', confidence: 0.9, count: 0 },
    { name: 'Plastic', confidence: 0.85, count: 0 },
    { name: 'Cardboard', confidence: 0.88, count: 0 },
    { name: 'Metal', confidence: 0.92, count: 0 },
    { name: 'Glass', confidence: 0.87, count: 0 },
    { name: 'Organic', confidence: 0.83, count: 0 }
  ];
  
  // Higher fill level means more items detected
  const totalItems = Math.floor(fillLevel / 10) + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < totalItems; i++) {
    const itemIndex = Math.floor(Math.random() * items.length);
    items[itemIndex].count += Math.floor(Math.random() * 5) + 1;
    items[itemIndex].confidence = 0.8 + Math.random() * 0.15;
  }
  
  return items.filter(item => item.count > 0);
}

// Helper function to get last collection time
function getLastCollectionTime(currentTime: Date): string {
  // Simulate collection every 2-3 days
  const daysSinceCollection = Math.floor(Math.random() * 3) + 1;
  const lastCollection = new Date(currentTime.getTime() - daysSinceCollection * 24 * 60 * 60 * 1000);
  return lastCollection.toISOString();
}

export default router; 