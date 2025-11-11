import { Router } from 'express';
import devicesRouter from './devices';

const router = Router();

/**
 * @openapi
 * /api/admin/status:
 *   get:
 *     summary: Get admin API status
 *     description: Diagnostic endpoint to check if admin routes are working
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Admin API status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "active"
 *                 message:
 *                   type: string
 *                   example: "Admin API is working"
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["/devices", "/devices/scripts", "/devices/:id/connect", "/devices/:id/disconnect", "/devices/:id/command", "/devices/:id/reboot"]
 */
router.get('/status', (req, res) => {
  console.log('Admin status endpoint accessed');
  res.json({
    status: 'active',
    message: 'Admin API is working',
    routes: ['/devices', '/devices/scripts', '/devices/:id/connect', '/devices/:id/disconnect', '/devices/:id/command', '/devices/:id/reboot']
  });
});

router.use('/devices', devicesRouter);

export default router;