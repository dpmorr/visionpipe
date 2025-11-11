import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import PageHeader from "@/components/PageHeader";
import { Label } from "@/components/ui/label";
import { CheckIcon, Loader2 } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CreditCard as CreditCardIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// Add PaymentMethod interface
interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface Organization {
  id: number;
  name: string;
  plan: string;
  maxUsers: number;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  quantity: number;
  stripeCustomerId?: string;
  clientSecret?: string;
  subscriptionId?:string;
}

interface StripePriceInfo {
  id: string;
  nickname: string;
  unitAmount: number;
  currency: string;
}

const PRICE_TO_PLAN_MAP = {
  'price_1Qm4uCKQ8jEUCDlSTyJSEKrG': 'connect',
  'price_1Qm4utKQ8jEUCDlSwZ45CaaM': 'professional',
  'price_1Qm4vyKQ8jEUCDlSQGIyBAH1': 'os'
} as const;

const PLAN_FEATURES = {
  connect: [
    'Basic sustainability tracking',
    'Simple reports',
    'Email support',
  ],
  professional: [
    'Advanced analytics',
    'Custom reports',
    'Priority support',
    'API access',
    'Team collaboration'
  ],
  os: [
    'Unlimited analytics',
    'Custom integrations',
    'Dedicated support',
    'Advanced security',
    'Custom features',
    'SLA guarantee'
  ]
} as const;

let stripePromise: Promise<any> | null = null;

function PaymentForm({ clientSecret, onSuccess, onCancel }: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message);
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Add Payment Method"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function BillingSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Array<{
    id: string;
    name: string;
    price: number;
    maxUsers: number;
    features: string[];
  }>>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [setupIntent, setSetupIntent] = useState<string | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  // Add payment methods query
  const { data: paymentMethods, refetch: refetchPaymentMethods } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: [`/api/organizations/${user?.organizationId}/payment-methods`],
    enabled: !!user?.organizationId,
  });

  // Fetch Stripe configuration
  useEffect(() => {
    fetch('/api/organizations/stripe-config')
      .then(response => response.json())
      .then(data => {
        if (data.publishableKey) {
          stripePromise = loadStripe(data.publishableKey);
        }
      })
      .catch(error => {
        console.error('Error loading Stripe configuration:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load payment configuration",
        });
      });
  }, [toast]);

  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: [`/api/organizations/${user?.organizationId}`],
    enabled: !!user?.organizationId,
  });

  const { data: subscription, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: [`/api/organizations/${user?.organizationId}/subscription`],
    enabled: !!user?.organizationId,
  });

  // Fetch available Stripe prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/organizations/subscription-prices');
        if (!response.ok) throw new Error('Failed to fetch prices');
        const prices: StripePriceInfo[] = await response.json();

        // Map Stripe prices to plan tiers with proper type checking
        const planTypes = ['connect', 'professional', 'os'] as const;
        const plans = prices
          .map(price => {
            const planType = PRICE_TO_PLAN_MAP[price.id as keyof typeof PRICE_TO_PLAN_MAP];
            if (!planType || !planTypes.includes(planType)) return null;

            return {
              id: price.id,
              name: planType, //Simplified name assignment
              price: (price.unitAmount || 0) / 100,
              maxUsers: planType === 'connect' ? 5 : planType === 'professional' ? 20 : 100,
              features: PLAN_FEATURES[planType]
            };
          })
          .filter((plan): plan is NonNullable<typeof plan> => plan !== null)
          .filter((plan, index, self) =>
            index === self.findIndex(p => p.name.toLowerCase() === plan.name.toLowerCase())
          );

        setAvailablePlans(plans);
      } catch (error) {
        console.error('Error fetching prices:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load subscription plans. Please try again later.",
        });
      }
    };

    fetchPrices();
  }, [toast]);

  const upgradePlan = useMutation({
    mutationFn: async (planId: string) => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/organizations/${user?.organizationId}/subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId: planId,
            quantity: subscription?.quantity || 1
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }

        const data = await res.json();

        // Only attempt payment confirmation if there's a client secret
        if (data.clientSecret) {
          const stripe = await stripePromise;
          if (!stripe) throw new Error('Failed to load Stripe');

          const { error: paymentError } = await stripe.confirmCardPayment(data.clientSecret);
          if (paymentError) {
            throw new Error(paymentError.message);
          }
        }

        // Update user's subscription plan in profile
        if (user) {
          await fetch('/api/user', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionPlan: PRICE_TO_PLAN_MAP[planId as keyof typeof PRICE_TO_PLAN_MAP],
              subscriptionStatus: 'active',
              subscriptionId: data.subscriptionId
            })
          });

          // Invalidate user query to refresh the data
          queryClient.invalidateQueries(['/api/user']);
        }

        return data;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      // Invalidate both organization and subscription queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/organizations/${user?.organizationId}`]
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/organizations/${user?.organizationId}/subscription`]
      });

      toast({
        title: "Plan updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upgrade plan",
      });
    },
  });

  const handleAddPaymentMethod = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/organizations/${user?.organizationId}/setup-intent`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const { clientSecret } = await res.json();
      setSetupIntent(clientSecret);
      setShowPaymentForm(true);
    } catch (error) {
      console.error('Add payment method error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add payment method",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    refetchPaymentMethods();
    toast({
      title: "Success",
      description: "Payment method added successfully.",
    });
  };

  // Only show for OS users
  if (user?.userType !== 'os') {
    return (
      <div className="container max-w-6xl mx-auto py-6">
        <PageHeader
          title="Billing & Subscription"
          subtitle="Manage your subscription and user seats"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Billing management is only available for Compliro OS users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orgLoading || subLoading || !availablePlans.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-6">
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your subscription and user seats"
      />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              Your current plan and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold capitalize mb-1">
                      Compliro {user?.subscriptionPlan?.charAt(0).toUpperCase() + user?.subscriptionPlan?.slice(1) || "No Plan"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="capitalize">{user?.subscriptionStatus || "Not subscribed"}</span>
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPlans(!showPlans)}
                  >
                    {showPlans ? "Hide Plans" : "Change Plan"}
                  </Button>
                </div>
                {subscription && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Current Period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {showPlans && (
                <div className="grid gap-6 md:grid-cols-3">
                  {availablePlans.map((plan) => {
                    const planType = PRICE_TO_PLAN_MAP[plan.id as keyof typeof PRICE_TO_PLAN_MAP];
                    const displayName = planType === 'connect' ? 'Connect' : 
                                      planType === 'professional' ? 'Professional' : 
                                      'OS';
                    return (
                      <Card 
                        key={plan.id} 
                        className={
                          user?.subscriptionPlan === planType
                            ? 'border-2 border-primary' 
                            : ''
                        }
                      >
                        <CardHeader>
                          <CardTitle>Compliro {displayName}</CardTitle>
                          <CardDescription>
                            ${plan.price}/month
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Up to {plan.maxUsers} users
                              </p>
                            </div>
                            <ul className="space-y-2 text-sm">
                              {PLAN_FEATURES[planType].map((feature, i) => (
                                <li key={i} className="flex items-center">
                                  <CheckIcon className="mr-2 h-4 w-4 text-primary" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            <Button
                              className="w-full"
                              variant={user?.subscriptionPlan === planType ? "outline" : "default"}
                              disabled={user?.subscriptionPlan === planType || isLoading}
                              onClick={() => upgradePlan.mutate(plan.id)}
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Processing...
                                </>
                              ) : user?.subscriptionPlan === planType ? (
                                "Current Plan"
                              ) : (
                                "Switch to this Plan"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {showPaymentForm && setupIntent ? (
              <Elements stripe={stripePromise} options={{ clientSecret: setupIntent }}>
                <PaymentForm
                  clientSecret={setupIntent}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentForm(false)}
                />
              </Elements>
            ) : (
              <div className="space-y-4">
                {paymentMethods?.paymentMethods?.length ? (
                  <div className="space-y-4">
                    {paymentMethods.paymentMethods.map((method) => (
                      <div key={method.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="font-medium capitalize">
                            {method.card.brand} •••• {method.card.last4}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={handleAddPaymentMethod}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Update Payment Method"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      No payment method on file
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleAddPaymentMethod}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Add Payment Method"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}