import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Switch,
  TextField,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  MenuItem,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Container,
} from "@mui/material";
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Check } from '@mui/icons-material';
import { z } from "zod";
import {
  NotificationsActive as NotificationsIcon,
  Straighten as UnitsIcon,
  Business as BusinessIcon,
  Extension as ExtensionIcon,
  CreditCard as CreditCardIcon,
  Security as SecurityIcon,
  ViewModule as ModulesIcon,
  Assessment as ReportsIcon,
  IntegrationInstructions as IntegrationsIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Key as ApiTokensIcon,
} from "@mui/icons-material";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ReportSettings } from '@/components/AnalyticsBuilder/ReportSettings';
import { ApiTokensManager } from '@/components/ApiTokensManager';
import { useNavigationModulesStore, moduleNames, moduleCategories, NavigationModule } from '@/lib/navigationModulesStore';
import { useAppModeStore } from '@/lib/appModeStore';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface Organization {
  id: number;
  name: string;
  billingEmail: string;
  website?: string;
  address?: string;
  phone?: string;
}

const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    weeklyReport: z.boolean().default(true),
    sustainabilityAlerts: z.boolean().default(true),
    wastePickupReminders: z.boolean().default(true),
  }),
  privacy: z.object({
    shareAnalytics: z.boolean().default(true),
    publicProfile: z.boolean().default(false),
    showProgressToOthers: z.boolean().default(true),
  }),
  sustainability: z.object({
    defaultUnit: z.enum(["metric", "imperial"]).default("metric"),
    targetReductionRate: z.enum(["aggressive", "moderate", "conservative"]).default("moderate"),
    reminderFrequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  }),
});

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  billingEmail: z.string().email("Invalid email address"),
  website: z.string().url("Invalid URL").optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;
type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface Integration {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  features: string[];
  documentationUrl?: string;
  providerUrl?: string;
}

interface OrganizationIntegration {
  id: number;
  integrationId: number;
  organizationId: number;
  status: 'connected' | 'disconnected';
  config?: Record<string, any>;
  lastSyncedAt?: string;
}

interface PaymentMethod {
  id: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  quantity: number;
  stripeCustomerId?: string;
  clientSecret?: string;
}


// Constants outside component
const PRICE_TO_PLAN_MAP = {
  'price_1QqVwGKQ8jEUCDlSRnijWuf5': 'basic',    // $99 AUD plan
  'price_1QqVwUKQ8jEUCDlS5tk3a7oA': 'pro',      // $199 AUD plan
  'price_1QqVx0KQ8jEUCDlS3Y8FJqLX': 'enterprise' // $499 AUD plan
} as const;

const PLAN_FEATURES = {
  basic: [
    'Basic sustainability tracking',
    'Simple reports',
    'Email support',
  ],
  pro: [
    'Advanced analytics',
    'Custom reports',
    'Priority support',
    'API access',
    'Team collaboration'
  ],
  enterprise: [
    'Unlimited analytics',
    'Custom integrations',
    'Dedicated support',
    'Advanced security',
    'Custom features',
    'SLA guarantee'
  ]
} as const;

const stripePromise = loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY'); // Replace with your key

//Dummy PaymentForm Component - Replace with your actual component
const PaymentForm = ({ clientSecret, onSuccess, onCancel }: { clientSecret: string; onSuccess: () => void; onCancel: () => void }) => {
  return (
    <div>
      <p>Payment Form (Replace with your actual Stripe payment form using clientSecret: {clientSecret})</p>
      <button onClick={onSuccess}>Submit Payment</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};


export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOrgEditing, setIsOrgEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications");
  const [showPlans, setShowPlans] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [setupIntent, setSetupIntent] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Array<{
    id: string;
    name: string;
    price: number;
    maxUsers: number;
    features: string[];
  }>>([]);
  const queryClient = new QueryClient();

  // Navigation modules store hook - moved outside render functions
  const { visibleModules, toggleModule, setModules, resetToDefault, resetToModeDefault } = useNavigationModulesStore();
  const { mode } = useAppModeStore();

  // Selection state
  const [selectedAvailable, setSelectedAvailable] = useState<NavigationModule[]>([]);
  const [selectedActive, setSelectedActive] = useState<NavigationModule[]>([]);


  // All React Query hooks
  const { data: organization, isLoading: isOrgLoading } = useQuery<Organization>({
    queryKey: [`/api/organizations/${user?.organizationId}`],
    enabled: !!user?.organizationId,
  });

  const { data: paymentMethods, refetch: refetchPaymentMethods } = useQuery<{ paymentMethods: PaymentMethod[] }>({
    queryKey: [`/api/organizations/${user?.organizationId}/payment-methods`],
    enabled: !!user?.organizationId,
  });

  const { data: subscription } = useQuery<Subscription>({
    queryKey: [`/api/organizations/${user?.organizationId}/subscription`],
    enabled: !!user?.organizationId,
  });

  const { data: organizationIntegrations, isLoading: isIntegrationsLoading } = useQuery<OrganizationIntegration[]>({
    queryKey: [`/api/organization-integrations`],
    enabled: !!user?.organizationId,
  });

  const { data: availableIntegrations, isLoading: isAvailableIntegrationsLoading } = useQuery<Integration[]>({
    queryKey: [`/api/integrations`],
    enabled: !!user?.organizationId,
  });

  // Mutations
  const upgradePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      setUpgradingPlan(true);
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
          throw new Error(await res.text());
        }

        const data = await res.json();

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
        }

        return data;
      } finally {
        setUpgradingPlan(false);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
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
      setShowPlans(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upgrade plan",
      });
    },
  });

  const toggleIntegration = useMutation({
    mutationFn: async ({ integrationId, action }: { integrationId: number; action: 'connect' | 'disconnect' }) => {
      const response = await fetch(`/api/organization-integrations/${action}/${integrationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to update integration status');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Integration status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update integration status",
      });
    },
  });

  const settingsForm = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      notifications: {
        email: true,
        push: true,
        weeklyReport: true,
        sustainabilityAlerts: true,
        wastePickupReminders: true,
      },
      privacy: {
        shareAnalytics: true,
        publicProfile: false,
        showProgressToOthers: true,
      },
      sustainability: {
        defaultUnit: "metric",
        targetReductionRate: "moderate",
        reminderFrequency: "weekly",
      },
    },
  });

  const organizationForm = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
  });

  const updateOrganization = useMutation({
    mutationFn: async (data: OrganizationFormValues) => {
      const res = await fetch(`/api/organizations/${user?.organizationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization updated",
        description: "Your organization settings have been saved.",
      });
      setIsOrgEditing(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update organization",
      });
    },
  });

  const handleAddPaymentMethod = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/organizations/${user?.organizationId}/setup-intent`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      const { clientSecret } = await res.json();
      setSetupIntent(clientSecret);
      setShowPaymentForm(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to setup payment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onSettingsSubmit(data: SettingsFormValues) {
    try {
      setIsLoading(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const startOrgEditing = () => {
    if (organization) {
      organizationForm.reset({
        name: organization.name,
        billingEmail: organization.billingEmail,
        website: organization.website || "",
        address: organization.address || "",
        phone: organization.phone || "",
      });
    }
    setIsOrgEditing(true);
  };


  // Effect to fetch prices and handle plans display
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        console.log('Fetching subscription prices...');
        const response = await fetch('/api/organizations/subscription-prices');
        if (!response.ok) throw new Error('Failed to fetch prices');
        const prices = await response.json();
        console.log('Received prices:', prices);

        const planTypes = ['basic', 'pro', 'enterprise'] as const;
        const plans = prices
          .map(price => {
            const planType = PRICE_TO_PLAN_MAP[price.id as keyof typeof PRICE_TO_PLAN_MAP];
            if (!planType || !planTypes.includes(planType)) {
              console.log('Invalid plan type for price:', price);
              return null;
            }

            return {
              id: price.id,
              name: planType.charAt(0).toUpperCase() + planType.slice(1),
              price: (price.unitAmount || 0) / 100,
              maxUsers: planType === 'basic' ? 5 : planType === 'pro' ? 20 : 100,
              features: [...PLAN_FEATURES[planType]] // Create a new array from the readonly array
            };
          })
          .filter((plan): plan is NonNullable<typeof plan> => plan !== null)
          .filter((plan, index, self) =>
            index === self.findIndex(p => p.name.toLowerCase() === plan.name.toLowerCase())
          );

        console.log('Processed plans:', plans);
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

    if (showPlans) {
      fetchPrices();
    }
  }, [toast, showPlans]); // Added showPlans as dependency

  // Render functions 
  const renderBilling = () => {
    console.log('Rendering billing section, showPlans:', showPlans);
    console.log('Available plans:', availablePlans);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>Current Plan</Typography>
              <Typography variant="subtitle1" color="primary" className="capitalize">
                {user?.subscriptionPlan || "No Plan"} Plan
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: <span className="capitalize">{user?.subscriptionStatus || "Not subscribed"}</span>
              </Typography>
              {subscription && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Current Period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              onClick={() => setShowPlans(!showPlans)}
              startIcon={showPlans ? null : <CreditCardIcon />}
            >
              {showPlans ? "Hide Plans" : "Change Plan"}
            </Button>
          </Box>
        </Paper>

        {showPlans && availablePlans.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Available Plans</Typography>
            <Grid container spacing={3}>
              {availablePlans.map((plan) => (
                <Grid item xs={12} md={4} key={plan.id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: user?.subscriptionPlan === PRICE_TO_PLAN_MAP[plan.id as keyof typeof PRICE_TO_PLAN_MAP] ? 2 : 1,
                      borderColor: user?.subscriptionPlan === PRICE_TO_PLAN_MAP[plan.id as keyof typeof PRICE_TO_PLAN_MAP] ? 'primary.main' : 'divider'
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{plan.name}</Typography>
                      <Typography variant="h4" gutterBottom>${plan.price}<Typography variant="caption">/month</Typography></Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Up to {plan.maxUsers} users
                      </Typography>
                      <List dense>
                        {plan.features.map((feature, i) => (
                          <ListItem key={i} sx={{ py: 0.5 }}>
                            <Check sx={{ fontSize: 20, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">{feature}</Typography>
                          </ListItem>
                        ))}
                      </List>
                      <Button
                        fullWidth
                        variant={user?.subscriptionPlan === PRICE_TO_PLAN_MAP[plan.id as keyof typeof PRICE_TO_PLAN_MAP] ? "outlined" : "contained"}
                        disabled={user?.subscriptionPlan === PRICE_TO_PLAN_MAP[plan.id as keyof typeof PRICE_TO_PLAN_MAP] || upgradingPlan}
                        onClick={() => upgradePlanMutation.mutate(plan.id)}
                        sx={{ mt: 2 }}
                      >
                        {upgradingPlan ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Processing...
                          </>
                        ) : user?.subscriptionPlan === PRICE_TO_PLAN_MAP[plan.id as keyof typeof PRICE_TO_PLAN_MAP] ? (
                          "Current Plan"
                        ) : (
                          "Switch to this Plan"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Payment Methods Section */}
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">Payment Methods</Typography>
              <Typography variant="body2" color="text.secondary">
                Manage your payment information
              </Typography>
            </Box>
          </Box>

          {showPaymentForm && setupIntent ? (
            <Elements stripe={stripePromise} options={{ clientSecret: setupIntent }}>
              <PaymentForm
                clientSecret={setupIntent}
                onSuccess={() => {
                  setShowPaymentForm(false);
                  refetchPaymentMethods();
                  toast({
                    title: "Success",
                    description: "Payment method added successfully",
                  });
                }}
                onCancel={() => setShowPaymentForm(false)}
              />
            </Elements>
          ) : (
            <Box sx={{ mt: 2 }}>
              {paymentMethods?.paymentMethods?.map((method) => (
                <Box
                  key={method.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <CreditCardIcon />
                  <Box>
                    <Typography variant="subtitle2">
                      {method.card.brand.toUpperCase()} •••• {method.card.last4}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expires {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Button
                variant="outlined"
                onClick={handleAddPaymentMethod}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Processing...
                  </>
                ) : (
                  "Add Payment Method"
                )}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  const renderNotifications = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Email Notifications</Typography>
            <Typography variant="body2" color="text.secondary">
              Receive important updates via email
            </Typography>
          </Box>
          <Switch
            checked={settingsForm.watch("notifications.email")}
            onChange={(e) => settingsForm.setValue("notifications.email", e.target.checked)}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Weekly Reports</Typography>
            <Typography variant="body2" color="text.secondary">
              Get weekly sustainability performance reports
            </Typography>
          </Box>
          <Switch
            checked={settingsForm.watch("notifications.weeklyReport")}
            onChange={(e) => settingsForm.setValue("notifications.weeklyReport", e.target.checked)}
          />
        </Box>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Sustainability Alerts</Typography>
            <Typography variant="body2" color="text.secondary">
              Get notified about sustainability milestones and opportunities
            </Typography>
          </Box>
          <Switch
            checked={settingsForm.watch("notifications.sustainabilityAlerts")}
            onChange={(e) => settingsForm.setValue("notifications.sustainabilityAlerts", e.target.checked)}
          />
        </Box>
      </Paper>
    </Box>
  );

  const renderPrivacy = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Share Analytics</Typography>
            <Typography variant="body2" color="text.secondary">
              Share anonymous data to improve sustainability insights
            </Typography>
          </Box>
          <Switch
            checked={settingsForm.watch("privacy.shareAnalytics")}
            onChange={(e) => settingsForm.setValue("privacy.shareAnalytics", e.target.checked)}
          />
        </Box>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle1">Public Profile</Typography>
            <Typography variant="body2" color="text.secondary">
              Make your sustainability profile visible to other users
            </Typography>
          </Box>
          <Switch
            checked={settingsForm.watch("privacy.publicProfile")}
            onChange={(e) => settingsForm.setValue("privacy.publicProfile", e.target.checked)}
          />
        </Box>
      </Paper>
    </Box>
  );

  const renderSustainability = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <FormLabel>Measurement Units</FormLabel>
        <Select
          value={settingsForm.watch("sustainability.defaultUnit")}
          onChange={(e) => settingsForm.setValue("sustainability.defaultUnit", e.target.value as any)}
          sx={{ mt: 1 }}
        >
          <MenuItem value="metric">Metric (kg, liters)</MenuItem>
          <MenuItem value="imperial">Imperial (lbs, gallons)</MenuItem>
        </Select>
        <FormHelperText>Choose your preferred measurement system</FormHelperText>
      </FormControl>

      <FormControl fullWidth>
        <FormLabel>Target Reduction Rate</FormLabel>
        <Select
          value={settingsForm.watch("sustainability.targetReductionRate")}
          onChange={(e) => settingsForm.setValue("sustainability.targetReductionRate", e.target.value as any)}
          sx={{ mt: 1 }}
        >
          <MenuItem value="aggressive">Aggressive (30%+ per year)</MenuItem>
          <MenuItem value="moderate">Moderate (15-30% per year)</MenuItem>
          <MenuItem value="conservative">Conservative (5-15% per year)</MenuItem>
        </Select>
        <FormHelperText>Set your waste reduction goals</FormHelperText>
      </FormControl>
      <FormControl fullWidth>
        <FormLabel>Reminder Frequency</FormLabel>
        <Select
          value={settingsForm.watch("sustainability.reminderFrequency")}
          onChange={(e) => settingsForm.setValue("sustainability.reminderFrequency", e.target.value as any)}
          sx={{ mt: 1 }}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>
        <FormHelperText>Set your reminder frequency</FormHelperText>
      </FormControl>
    </Box>
  );

  const renderOrganization = () => {
    if (isOrgLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!organization) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No organization found. Please contact an administrator.
          </Typography>
        </Box>
      );
    }

    if (isOrgEditing) {
      return (
        <Box component="form" onSubmit={organizationForm.handleSubmit((data) => updateOrganization.mutate(data))} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Organization Name"
            fullWidth
            {...organizationForm.register("name")}
            error={!!organizationForm.formState.errors.name}
            helperText={organizationForm.formState.errors.name?.message}
          />
          <TextField
            label="Billing Email"
            type="email"
            fullWidth
            {...organizationForm.register("billingEmail")}
            error={!!organizationForm.formState.errors.billingEmail}
            helperText={organizationForm.formState.errors.billingEmail?.message}
          />
          <TextField
            label="Website"
            type="url"
            fullWidth
            {...organizationForm.register("website")}
            error={!!organizationForm.formState.errors.website}
            helperText={organizationForm.formState.errors.website?.message}
          />
          <TextField
            label="Address"
            fullWidth
            {...organizationForm.register("address")}
          />
          <TextField
            label="Phone"
            type="tel"
            fullWidth
            {...organizationForm.register("phone")}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setIsOrgEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={updateOrganization.isPending}
              startIcon={updateOrganization.isPending ? <CircularProgress size={20} /> : null}
            >
              {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Organization Name</Typography>
          <Typography>{organization?.name}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Billing Email</Typography>
          <Typography>{organization?.billingEmail}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Website</Typography>
          <Typography>{organization?.website || "—"}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Address</Typography>
          <Typography>{organization?.address || "—"}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
          <Typography>{organization?.phone || "—"}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={startOrgEditing}>
            Edit
          </Button>
        </Box>
      </Box>
    );
  };

  const renderIntegrations = () => {
    if (isIntegrationsLoading || isAvailableIntegrationsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!availableIntegrations?.length) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No integrations available at this time.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {availableIntegrations.map((integration) => {
          const orgIntegration = organizationIntegrations?.find(
            (oi) => oi.integrationId === integration.id
          );
          const isConnected = orgIntegration?.status === 'connected';

          return (
            <Grid item xs={12} sm={6} md={4} key={integration.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 2, fontSize: '24px' }}>{integration.icon}</Box>
                    <Box>
                      <Typography variant="h6" component="div">
                        {integration.name}
                      </Typography>
                      <Chip
                        label={isConnected ? 'Connected' : 'Disconnected'}
                        color={isConnected ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <Typography color="text.secondary" paragraph>
                    {integration.description}
                  </Typography>

                  <Typography variant="subtitle2" gutterBottom>
                    Features:
                  </Typography>
                  <List dense>
                    {integration.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          • {feature}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  <Grid container spacing={1} alignItems="center">
                    {integration.documentationUrl && (
                      <Grid item xs>
                        <Button
                          variant="text"
                          href={integration.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          Documentation
                        </Button>
                      </Grid>
                    )}
                    <Grid item>
                      <Button
                        variant={isConnected ? 'outlined' : 'contained'}
                        startIcon={isConnected ? <LinkOffIcon /> : <LinkIcon />}
                        onClick={() => toggleIntegration.mutate({
                          integrationId: integration.id,
                          action: isConnected ? 'disconnect' : 'connect'
                        })}
                        disabled={toggleIntegration.isPending}
                        size="small"
                      >
                        {isConnected ? 'Disconnect' : 'Connect'}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderModules = () => {
    const currentModeModules = mode === 'simple' ? moduleCategories.simple : moduleCategories.advanced;
    const allModules = Object.keys(moduleNames) as NavigationModule[];
    
    // Separate modules into active and available
    const activeModules = visibleModules;
    const availableModules = allModules.filter(module => !visibleModules.includes(module));

    // Move selected modules
    const moveSelectedToActive = () => {
      setModules([...activeModules, ...selectedAvailable.filter(m => !activeModules.includes(m))]);
      setSelectedAvailable([]);
    };
    const moveSelectedToAvailable = () => {
      setModules(activeModules.filter(m => !selectedActive.includes(m)));
      setSelectedActive([]);
    };

    // Drag-and-drop reorder
    const onDragEnd = (result: any) => {
      if (!result.destination) return;
      const reordered = Array.from(activeModules);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setModules(reordered);
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Navigation Modules</Typography>
          <Button
            variant="outlined"
            onClick={() => { setSelectedAvailable([]); setSelectedActive([]); resetToModeDefault(mode); }}
            size="small"
          >
            Reset to {mode} Default
          </Button>
        </Box>
        <Typography color="text.secondary" paragraph>
          Control which pages appear in your sidebar navigation. Select and move modules between Available and Active columns. Drag to reorder in Active.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Available Modules */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Available ({availableModules.length})
            </Typography>
            <Paper sx={{ height: 400, overflow: 'auto', border: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
              <List dense>
                {availableModules.map((moduleKey) => {
                  const isDefaultForMode = currentModeModules.includes(moduleKey);
                  const selected = selectedAvailable.includes(moduleKey);
                  return (
                    <ListItemButton
                      key={moduleKey}
                      selected={selected}
                      onClick={() => setSelectedAvailable(selected ? selectedAvailable.filter(m => m !== moduleKey) : [...selectedAvailable, moduleKey])}
                    >
                      <ListItemText
                        primary={moduleNames[moduleKey]}
                        secondary={isDefaultForMode ? `Default for ${mode} mode` : ''}
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.75rem' }}
                      />
                    </ListItemButton>
                  );
                })}
                {availableModules.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No available modules"
                      sx={{ textAlign: 'center', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Box>
          {/* Arrow Controls */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 6 }}>
            <IconButton
              onClick={moveSelectedToActive}
              disabled={selectedAvailable.length === 0}
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.300' } }}
            >
              <ArrowForwardIcon />
            </IconButton>
            <IconButton
              onClick={moveSelectedToAvailable}
              disabled={selectedActive.length === 0}
              sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.300' } }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
          {/* Active Modules (Draggable) */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Active ({activeModules.length})
            </Typography>
            <Paper sx={{ height: 400, overflow: 'auto', border: '1px solid #4caf50', bgcolor: '#f1f8e9' }}>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="activeModules">
                  {(provided) => (
                    <List dense ref={provided.innerRef} {...provided.droppableProps}>
                      {activeModules.map((moduleKey, idx) => {
                        const isDefaultForMode = currentModeModules.includes(moduleKey);
                        const selected = selectedActive.includes(moduleKey);
                        return (
                          <Draggable key={moduleKey} draggableId={moduleKey} index={idx}>
                            {(provided, snapshot) => (
                              <ListItemButton
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                selected={selected}
                                onClick={() => setSelectedActive(selected ? selectedActive.filter(m => m !== moduleKey) : [...selectedActive, moduleKey])}
                                sx={{
                                  borderBottom: '1px solid #e8f5e8',
                                  '&:last-child': { borderBottom: 'none' },
                                  bgcolor: snapshot.isDragging ? 'primary.light' : undefined
                                }}
                              >
                                <ListItemText
                                  primary={moduleNames[moduleKey]}
                                  secondary={isDefaultForMode ? `Default for ${mode} mode` : ''}
                                  primaryTypographyProps={{ fontSize: '0.9rem' }}
                                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                                />
                              </ListItemButton>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {activeModules.length === 0 && (
                        <ListItem>
                          <ListItemText
                            primary="No active modules"
                            sx={{ textAlign: 'center', color: 'text.secondary' }}
                          />
                        </ListItem>
                      )}
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            </Paper>
          </Box>
        </Box>
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Current Mode: {mode}</Typography>
          <Typography variant="body2" color="text.secondary">
            {mode === 'simple' 
              ? 'Simple mode focuses on core waste management features.'
              : 'Advanced mode includes workflow and automation features.'
            }
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "notifications":
        return renderNotifications();
      case "privacy":
        return renderPrivacy();
      case "sustainability":
        return renderSustainability();
      case "organization":
        return renderOrganization();
      case "billing":
        return renderBilling();
      case "integrations":
        return renderIntegrations();
      case "reports":
        return <ReportSettings />;
      case "modules":
        return renderModules();
      case "api-tokens":
        return <ApiTokensManager />;
      default:
        return null;
    }
  };

  if (!user) return null;

  const sections = [
    {
      id: "notifications",
      label: "Notifications",
      icon: NotificationsIcon
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: SecurityIcon
    },
    {
      id: "sustainability",
      label: "Units",
      icon: UnitsIcon
    },
    {
      id: "organization",
      label: "Organization",
      icon: BusinessIcon
    },
    {
      id: "modules",
      label: "Navigation Modules",
      icon: ModulesIcon
    },
    {
      id: "reports",
      label: "Report Settings",
      icon: ReportsIcon
    },
    {
      id: "billing",
      label: "Billing",
      icon: CreditCardIcon
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: IntegrationsIcon
    },
    {
      id: "api-tokens",
      label: "API Tokens",
      icon: ApiTokensIcon
    }
  ];

  return (
    <Box>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>Settings</Typography>
          <Box sx={{ display: 'flex', mt: 4 }}>
            <Box sx={{ width: 240, flexShrink: 0 }}>
              {sections.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    startIcon={<Icon />}
                    variant={activeSection === item.id ? "contained" : "text"}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      mb: 1,
                      px: 2,
                      py: 1
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
            <Box sx={{ flexGrow: 1, ml: 4 }}>
              {renderContent()}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}