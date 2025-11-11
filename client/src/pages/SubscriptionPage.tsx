import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Box,
  Container,
  Typography,
  Grid,
  Card,
  useTheme,
  alpha,
  Button as MuiButton,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";

interface Plan {
  id: string;
  name: string;
  price: number;
  annualPrice?: number;
  annualPriceId?: string;
  features: string[];
  interval: 'month' | 'year';
}

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [registrationData, setRegistrationData] = useState<any>(null);
  const theme = useTheme();

  useEffect(() => {
    // Load registration data on mount
    const storedData = sessionStorage.getItem('registrationData');
    if (!storedData) {
      console.error('No registration data found');
      navigate('/');
      return;
    }

    try {
      const parsedData = JSON.parse(storedData);
      setRegistrationData(parsedData);
    } catch (error) {
      console.error('Failed to parse registration data:', error);
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // Load Stripe configuration on mount
    fetch('/api/organizations/stripe-config')
      .then(response => response.json())
      .then(data => {
        if (!data.publishableKey) {
          console.error('No Stripe publishable key found');
          toast({
            variant: "destructive",
            title: "Configuration Error",
            description: "Payment system is not properly configured.",
          });
          return;
        }
        setStripePromise(loadStripe(data.publishableKey));
      })
      .catch(error => {
        console.error('Failed to load Stripe config:', error);
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Failed to load payment system configuration.",
        });
      });
  }, []);

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a plan first",
      });
      return;
    }

    if (!registrationData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Registration data is missing",
      });
      navigate('/');
      return;
    }

    if (!stripePromise) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Payment system is not initialized",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId: billingInterval === 'year' ? selectedPlan.annualPriceId : selectedPlan.id,
          registrationData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (!data.sessionId) {
        throw new Error('No session ID returned from server');
      }

      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout process",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!registrationData) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        py: 8
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" gutterBottom>
            Choose Your Plan
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
            Select a plan that best fits your business needs
          </Typography>
          <ToggleButtonGroup
            value={billingInterval}
            exclusive
            onChange={(_, value) => value && setBillingInterval(value)}
            aria-label="billing interval"
            sx={{ mb: 4 }}
          >
            <ToggleButton value="month" aria-label="monthly billing">
              Monthly
            </ToggleButton>
            <ToggleButton value="year" aria-label="annual billing">
              Annual (Save 20%)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  p: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '2px solid',
                  borderColor: selectedPlan?.id === plan.id ? 'primary.main' : 'transparent',
                  bgcolor: selectedPlan?.id === plan.id ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
                onClick={() => setSelectedPlan(plan)}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h4" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mt: 2, mb: 4 }}>
                    <Typography variant="h3" component="span">
                      ${billingInterval === 'year' && plan.annualPrice ? plan.annualPrice : plan.price}
                    </Typography>
                    <Typography variant="subtitle1" component="span" color="text.secondary">
                      /{billingInterval}
                    </Typography>
                    {billingInterval === 'year' && plan.annualPrice && (
                      <Typography variant="body2" color="success.main" sx={{ display: 'block', mt: 1 }}>
                        Save 20% with annual billing
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box component="ul" sx={{ 
                  listStyle: 'none',
                  p: 0,
                  m: 0,
                  '& > li': {
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                  }
                }}>
                  {plan.features.map((feature, index) => (
                    <li key={index}>
                      <Check 
                        style={{ 
                          color: theme.palette.primary.main,
                          marginRight: theme.spacing(2),
                          flexShrink: 0
                        }}
                      />
                      <Typography>{feature}</Typography>
                    </li>
                  ))}
                </Box>

                <MuiButton
                  fullWidth
                  variant={selectedPlan?.id === plan.id ? "contained" : "outlined"}
                  color="primary"
                  sx={{ mt: 4 }}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {selectedPlan?.id === plan.id ? "Selected" : "Select Plan"}
                </MuiButton>
              </Card>
            </Grid>
          ))}
        </Grid>

        {selectedPlan && (
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <MuiButton
              variant="contained"
              color="primary"
              size="large"
              disabled={isProcessing}
              onClick={handleSubscribe}
              sx={{ minWidth: 200 }}
            >
              {isProcessing ? "Processing..." : `Subscribe to ${selectedPlan.name}`}
            </MuiButton>
          </Box>
        )}
      </Container>
    </Box>
  );
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    annualPrice: 566,
    annualPriceId: 'price_1RMKbFLf8BbaDmWB5i1nHY92',
    interval: 'month',
    features: [
      'Basic waste tracking',
      'Monthly reports',
      'Email support',
      'Single user license'
    ]
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 99,
    annualPrice: 950,
    annualPriceId: 'price_1RMKbpLf8BbaDmWBRnbUiGCi',
    interval: 'month',
    features: [
      'Advanced analytics',
      'Real-time tracking',
      'Priority support',
      'Up to 5 users',
      'Custom reports',
      'API access'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    features: [
      'Full analytics suite',
      'Unlimited users',
      'Dedicated support',
      'Custom integrations',
      'Advanced API access',
      'White-label reports',
      'Contact us for annual pricing'
    ]
  }
];