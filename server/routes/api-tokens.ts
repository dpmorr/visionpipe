import { Router } from 'express';
import { db } from '@db';
import { apiTokens } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

/**
 * @openapi
 * /api/api-tokens:
 *   get:
 *     summary: Get user's API tokens
 *     description: Retrieve all API tokens for the authenticated user
 *     tags: [API Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of API tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   token:
 *                     type: string
 *                   permissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   lastUsed:
 *                     type: string
 *                     format: date-time
 *                   expiresAt:
 *                     type: string
 *                     format: date-time
 *                   isActive:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const tokens = await db.query.apiTokens.findMany({
      where: and(
        eq(apiTokens.userId, req.user.id),
        eq(apiTokens.isActive, true)
      ),
      orderBy: apiTokens.createdAt,
    });

    // Don't return the full token, just a masked version for security
    const maskedTokens = tokens.map(token => ({
      ...token,
      token: `${token.token.substring(0, 8)}...${token.token.substring(token.token.length - 4)}`
    }));

    res.json(maskedTokens);
  } catch (error) {
    console.error('Error fetching API tokens:', error);
    res.status(500).json({ message: 'Failed to fetch API tokens' });
  }
});

/**
 * @openapi
 * /api/api-tokens:
 *   post:
 *     summary: Create a new API token
 *     description: Generate a new API token for the authenticated user
 *     tags: [API Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the API token
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permissions for the token
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiration date
 *     responses:
 *       201:
 *         description: API token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: The full API token (only shown once)
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { name, permissions = [], expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Token name is required' });
    }

    // Generate a secure random token
    const token = `wt_${crypto.randomBytes(32).toString('hex')}`;

    const [newToken] = await db.insert(apiTokens).values({
      userId: req.user.id,
      organizationId: req.user.organizationId!,
      name,
      token,
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    }).returning();

    res.status(201).json(newToken);
  } catch (error) {
    console.error('Error creating API token:', error);
    res.status(500).json({ message: 'Failed to create API token' });
  }
});

/**
 * @openapi
 * /api/api-tokens/{id}:
 *   delete:
 *     summary: Revoke an API token
 *     description: Deactivate an API token by setting isActive to false
 *     tags: [API Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: API token ID
 *     responses:
 *       200:
 *         description: API token revoked successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Token not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const tokenId = parseInt(req.params.id);
    if (isNaN(tokenId)) {
      return res.status(400).json({ message: 'Invalid token ID' });
    }

    const [updatedToken] = await db.update(apiTokens)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.userId, req.user.id)
      ))
      .returning();

    if (!updatedToken) {
      return res.status(404).json({ message: 'Token not found' });
    }

    res.json({ message: 'Token revoked successfully' });
  } catch (error) {
    console.error('Error revoking API token:', error);
    res.status(500).json({ message: 'Failed to revoke API token' });
  }
});

export default router; 