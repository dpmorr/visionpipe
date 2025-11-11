import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createCustomer(organizationName: string, email: string) {
  return stripe.customers.create({
    name: organizationName,
    email,
    metadata: {
      organizationType: 'compliro_organization'
    }
  });
}

export async function createSubscription(customerId: string, priceId: string, quantity: number, paymentMethodId?: string) {
  // Ensure price exists before creating subscription
  try {
    await stripe.prices.retrieve(priceId);
  } catch (error) {
    throw new Error(`Invalid price ID: ${priceId}. Please ensure you have created this price in your Stripe dashboard.`);
  }

  // If a payment method is provided, attach it to the customer
  if (paymentMethodId) {
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set it as the default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  return stripe.subscriptions.create({
    customer: customerId,
    items: [{
      price: priceId,
      quantity
    }],
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription'
    },
    expand: ['latest_invoice.payment_intent']
  });
}

export async function updateSubscriptionQuantity(subscriptionId: string, quantity: number) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItemId = subscription.items.data[0].id;

  return stripe.subscriptions.update(subscriptionId, {
    items: [{
      id: subscriptionItemId,
      quantity
    }]
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export async function createSetupIntent(customerId: string) {
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });
}

export async function listPaymentMethods(customerId: string) {
  return stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });
}

export async function listSubscriptionPlans() {
  const prices = await stripe.prices.list({
    active: true,
    type: 'recurring',
    expand: ['data.product']
  });

  return prices.data;
}

export async function getAvailablePriceIds() {
  const prices = await stripe.prices.list({
    active: true,
    type: 'recurring',
    limit: 3
  });

  return prices.data.map(price => ({
    id: price.id,
    nickname: price.nickname || 'Unknown',
    unitAmount: price.unit_amount,
    currency: price.currency
  }));
}