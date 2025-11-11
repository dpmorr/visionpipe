import { Router } from 'express';
import Device from '../models/device';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all devices for the organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const devices = await Device.findAll({
      where: { organizationId: req.user.organizationId },
      include: [{
        model: Device.sequelize.models.WastePoint,
        as: 'wastePoint'
      }]
    });
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Create a new device
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, wastePointId, deviceToken } = req.body;
    const device = await Device.create({
      name,
      type,
      waste_point_id: wastePointId,
      device_token: deviceToken,
      organizationId: req.user.organizationId
    });
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ error: 'Failed to create device' });
  }
});

// Update a device
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, wastePointId, deviceToken } = req.body;
    const device = await Device.findOne({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await device.update({
      name,
      type,
      waste_point_id: wastePointId,
      device_token: deviceToken
    });

    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Delete a device
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findOne({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await device.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router; 