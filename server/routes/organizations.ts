import { Router } from 'express';
import { db } from '@db';
import { organizations, users, subscriptions } from '@db/schema';
import { eq } from 'drizzle-orm';
import { insertOrganizationSchema, insertSubscriptionSchema } from '@db/schema';
import { createCustomer, createSubscription, createSetupIntent, getAvailablePriceIds, listPaymentMethods } from '../services/stripe';

const router = Router();

/**
 * @openapi
 * /organizations/stripe-config:
 *   get:
 *     summary: Get Stripe public key
 *     tags:
 *       - Organizations
 *     responses:
 *       200:
 *         description: Stripe public key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 publishableKey:
 *                   type: string
 *       500:
 *         description: Stripe public key not configured
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/stripe-config', (_req, res) => {
  if (!process.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Stripe public key not configured' });
  }
  res.json({ publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY });
});

// Get payment methods
router.get('/:id/payment-methods', async (req, res) => {
  try {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, parseInt(req.params.id)),
      with: {
        subscriptions: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const stripeCustomerId = organization.subscriptions?.[0]?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await listPaymentMethods(stripeCustomerId);
    res.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get available subscription prices
router.get('/subscription-prices', async (_req, res) => {
  try {
    const prices = await getAvailablePriceIds();
    res.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    res.status(500).json({ error: 'Failed to fetch subscription prices' });
  }
});

// Get organization details
router.get('/:id', async (req, res) => {
  try {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, parseInt(req.params.id)),
      with: {
        users: true,
        subscriptions: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update organization
router.patch('/:id', async (req, res) => {
  try {
    const data = insertOrganizationSchema.partial().parse(req.body);
    const [organization] = await db.update(organizations)
      .set(data)
      .where(eq(organizations.id, parseInt(req.params.id)))
      .returning();

    res.json(organization);
  } catch (error) {
    console.error('Error updating organization:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create or update subscription
router.post('/:id/subscription', async (req, res) => {
  try {
    const { priceId, quantity } = insertSubscriptionSchema.parse(req.body);
    const organizationId = parseInt(req.params.id);

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      with: {
        subscriptions: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    let stripeCustomerId = organization.subscriptions?.[0]?.stripeCustomerId;

    // Create Stripe customer if not exists
    if (!stripeCustomerId) {
      const customer = await createCustomer(
        organization.name,
        organization.billingEmail
      );
      stripeCustomerId = customer.id;
    }

    // Get default payment method if exists
    const paymentMethods = await listPaymentMethods(stripeCustomerId);
    const defaultPaymentMethod = paymentMethods.data[0]?.id;

    // Create Stripe subscription with default payment method if available
    const stripeSubscription = await createSubscription(
      stripeCustomerId,
      priceId,
      quantity,
      defaultPaymentMethod
    );

    // Save subscription details
    const [savedSubscription] = await db.insert(subscriptions)
      .values({
        organizationId,
        status: stripeSubscription.status,
        priceId,
        quantity,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
      })
      .onConflictDoUpdate({
        target: [subscriptions.organizationId],
        set: {
          status: stripeSubscription.status,
          priceId,
          quantity,
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          updatedAt: new Date()
        }
      })
      .returning();

    // Update organization plan
    const planType = priceId === 'price_1Qm4uCKQ8jEUCDlSTyJSEKrG' ? 'connect' :
                    priceId === 'price_1Qm4utKQ8jEUCDlSwZ45CaaM' ? 'professional' :
                    priceId === 'price_1Qm4vyKQ8jEUCDlSQGIyBAH1' ? 'os' : 'connect';

    await db.update(organizations)
      .set({ plan: planType })
      .where(eq(organizations.id, organizationId));

    // Get the client secret from the subscription's latest invoice payment intent
    const clientSecret = stripeSubscription.latest_invoice?.payment_intent?.client_secret;

    res.json({
      ...savedSubscription,
      clientSecret
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Create setup intent for adding payment method
router.post('/:id/setup-intent', async (req, res) => {
  try {
    const organizationId = parseInt(req.params.id);

    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      with: {
        subscriptions: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    let stripeCustomerId = organization.subscriptions?.[0]?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await createCustomer(
        organization.name,
        organization.billingEmail
      );
      stripeCustomerId = customer.id;
    }

    const setupIntent = await createSetupIntent(stripeCustomerId);
    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;