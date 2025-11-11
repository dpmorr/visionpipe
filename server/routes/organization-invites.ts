import express from 'express';
import { db } from "@db";
import { organizationInvites, users, organizations } from "@db/schema";
import { eq, and } from "drizzle-orm";
import crypto from 'crypto';
import { sendInviteEmail } from '../services/email';

const router = express.Router();

/**
 * @openapi
 * /organization-invites/invites:
 *   get:
 *     summary: Get all invites for the current organization
 *     tags:
 *       - OrganizationInvites
 *     responses:
 *       200:
 *         description: List of organization invites
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get('/invites', async (req, res) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const invites = await db.query.organizationInvites.findMany({
      where: eq(organizationInvites.organizationId, req.user.organizationId),
      orderBy: organizationInvites.createdAt,
    });

    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ message: 'Failed to fetch invites' });
  }
});

// Send an invite
router.post('/invites', async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!req.user?.organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    // Check if user is already part of the organization
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.email, email),
        eq(users.organizationId, req.user.organizationId)
      )
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User is already part of the organization' });
    }

    // Check for existing invite
    const existingInvite = await db.query.organizationInvites.findFirst({
      where: and(
        eq(organizationInvites.email, email),
        eq(organizationInvites.organizationId, req.user.organizationId)
      )
    });

    if (existingInvite && !existingInvite.acceptedAt) {
      return res.status(400).json({ message: 'Invite already sent to this email' });
    }

    // Get organization details for the email
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, req.user.organizationId)
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const [invite] = await db
      .insert(organizationInvites)
      .values({
        organizationId: req.user.organizationId,
        email,
        role,
        token,
        expiresAt,
        createdAt: new Date()
      })
      .returning();

    // Send invite email
    try {
      await sendInviteEmail(email, organization.name, token, role);
      res.status(201).json(invite);
    } catch (emailError) {
      // If email fails, delete the invite and return error
      await db.delete(organizationInvites).where(eq(organizationInvites.id, invite.id));
      throw emailError;
    }
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create invite' });
  }
});

// Accept an invite and create user account
router.post('/invites/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, firstName, lastName } = req.body;

    // Find and validate invite
    const invite = await db.query.organizationInvites.findFirst({
      where: and(
        eq(organizationInvites.token, token),
        eq(organizationInvites.acceptedAt, null)
      ),
      with: {
        organization: true
      }
    });

    if (!invite) {
      return res.status(404).json({ message: 'Invalid or expired invite' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ message: 'Invite has expired' });
    }

    // Create user account
    const [user] = await db
      .insert(users)
      .values({
        email: invite.email,
        password, // Note: This should be hashed in production
        firstName,
        lastName,
        organizationId: invite.organizationId,
        organizationRole: invite.role,
        createdAt: new Date()
      })
      .returning();

    // Mark invite as accepted
    await db
      .update(organizationInvites)
      .set({
        acceptedAt: new Date()
      })
      .where(eq(organizationInvites.id, invite.id));

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging in after registration' });
      }
      res.json({
        message: 'Invite accepted and account created',
        user
      });
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ message: 'Failed to accept invite' });
  }
});

// Get all members of the organization
router.get('/members', async (req, res) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    const members = await db.query.users.findMany({
      where: eq(users.organizationId, req.user.organizationId),
      orderBy: users.createdAt,
    });

    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Resend invite
router.post('/invites/:id/resend', async (req, res) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ message: 'No organization associated with user' });
    }

    // Find the invite
    const invite = await db.query.organizationInvites.findFirst({
      where: and(
        eq(organizationInvites.id, parseInt(req.params.id)),
        eq(organizationInvites.organizationId, req.user.organizationId)
      ),
      with: {
        organization: true
      }
    });

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.acceptedAt) {
      return res.status(400).json({ message: 'Invite has already been accepted' });
    }

    if (new Date() > invite.expiresAt) {
      // Generate new token and update expiration
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [updatedInvite] = await db
        .update(organizationInvites)
        .set({
          token,
          expiresAt,
          updatedAt: new Date()
        })
        .where(eq(organizationInvites.id, invite.id))
        .returning();

      // Send new invite email
      await sendInviteEmail(
        updatedInvite.email, 
        invite.organization.name,
        updatedInvite.token,
        updatedInvite.role
      );

      return res.json({
        message: 'Invite resent with new token',
        invite: updatedInvite
      });
    }

    // Resend with existing token if not expired
    await sendInviteEmail(
      invite.email,
      invite.organization.name,
      invite.token,
      invite.role
    );

    res.json({
      message: 'Invite resent successfully',
      invite
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Failed to resend invite' 
    });
  }
});

export default router;