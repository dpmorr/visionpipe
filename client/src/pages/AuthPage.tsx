import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@db/schema";
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  Button,
  Container,
  Divider,
  useTheme,
  alpha,
  Chip,
} from "@mui/material";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaGoogle, FaMicrosoft, FaGithub } from "react-icons/fa";
import Logo from '@/components/Logo';

// Feature highlights configuration
const featureHighlights = [
  {
    title: "AI Analytics",
    description: "Smart insights",
    icon: "🤖"
  },
  {
    title: "Real-time Data",
    description: "Live monitoring",
    icon: "📊"
  },
  {
    title: "Compliance",
    description: "Stay compliant",
    icon: "✅"
  },
  {
    title: "Integration",
    description: "Connect systems",
    icon: "🔄"
  }
];

// Registration steps configuration
const registrationSteps = [
  {
    title: "Create your account",
    type: "credentials",
    fields: ["email", "password", "firstName", "lastName", "companyName"]
  },
  {
    title: "What best describes your role?",
    type: "cards",
    field: "role",
    options: [
      { id: "user", label: "Business User", description: "I want to manage sustainability for my organization" },
      { id: "vendor", label: "Vendor", description: "I provide waste management and recycling services" }
    ]
  },
  {
    title: "What industry are you in?",
    type: "cards",
    field: "industry",
    options: [
      { id: "manufacturing", label: "Manufacturing", description: "Production and assembly of goods" },
      { id: "retail", label: "Retail", description: "Consumer goods and services" },
      { id: "healthcare", label: "Healthcare", description: "Medical and healthcare services" },
      { id: "technology", label: "Technology", description: "Software and tech services" }
    ]
  }
];

// Selection card component
const SelectionCard = ({ option, selected, onClick }: {
  option: { id: string; label: string; description: string; };
  selected: boolean;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        padding: 2,
        height: '100%',
        transition: 'all 0.2s',
        border: '2px solid',
        borderColor: selected ? theme.palette.primary.main : 'transparent',
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <Typography variant="h6" gutterBottom>
        {option.label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {option.description}
      </Typography>
    </Card>
  );
};

export default function AuthPage() {
  const { login } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [, navigate] = useLocation();
  const theme = useTheme();

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema.pick({
      email: true,
      password: true
    })),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      companyName: "",
      role: "user",
      industry: "",
    },
  });

  const handleOptionSelect = (field: string, value: string) => {
    registerForm.setValue(field as any, value);
    if (currentStep < registrationSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onRegister(registerForm.getValues());
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 0) {
      // Validate credentials step
      const fields = registrationSteps[0].fields;
      const isValid = await registerForm.trigger(fields as any);
      if (isValid) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const renderRegistrationContent = () => {
    const step = registrationSteps[currentStep];

    if (step.type === "credentials") {
      return (
        <Box>
          <Typography variant="h5" gutterBottom>
            {step.title}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                error={!!registerForm.formState.errors.email}
                helperText={registerForm.formState.errors.email?.message}
                {...registerForm.register("email")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                error={!!registerForm.formState.errors.password}
                helperText={registerForm.formState.errors.password?.message}
                {...registerForm.register("password")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                error={!!registerForm.formState.errors.firstName}
                helperText={registerForm.formState.errors.firstName?.message}
                {...registerForm.register("firstName")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                error={!!registerForm.formState.errors.lastName}
                helperText={registerForm.formState.errors.lastName?.message}
                {...registerForm.register("lastName")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                error={!!registerForm.formState.errors.companyName}
                helperText={registerForm.formState.errors.companyName?.message}
                {...registerForm.register("companyName")}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                Continue
              </Button>
            </Grid>
          </Grid>
        </Box>
      );
    }

    // Card-based selection steps
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          {step.title}
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {step.options?.map((option) => (
            <Grid item xs={12} sm={6} key={option.id}>
              <SelectionCard
                option={option}
                selected={registerForm.getValues(step.field as any) === option.id}
                onClick={() => handleOptionSelect(step.field, option.id)}
              />
            </Grid>
          ))}
        </Grid>

        {currentStep > 0 && (
          <Button
            variant="outlined"
            onClick={() => setCurrentStep(prev => prev - 1)}
            sx={{ mt: 4 }}
          >
            Back
          </Button>
        )}
      </Box>
    );
  };

  async function onLogin(data: { email: string; password: string }) {
    try {
      setIsLoading(true);
      const result = await login(data);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message,
        });
      } else {
        navigate("/");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister(data: any) {
    try {
      setIsLoading(true);
      sessionStorage.setItem('registrationData', JSON.stringify(data));
      window.location.href = '/subscribe';
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        backgroundColor: theme.palette.login.main,
      }}
    >
      {/* Left side - Feature highlights */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          color: 'white',
        }}
      >
        <Logo sx={{ mb: 4, color: 'white' }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome to Wastetraq
        </Typography>
        <Typography variant="body1" sx={{ mb: 6, opacity: 0.8 }}>
          Your comprehensive waste management solution
        </Typography>
        <Grid container spacing={3} sx={{ maxWidth: 600 }}>
          {featureHighlights.map((feature, index) => (
            <Grid item xs={6} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h1" sx={{ mb: 1 }}>{feature.icon}</Typography>
                <Typography variant="h6" gutterBottom>{feature.title}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{feature.description}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Right side - Auth forms */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          p: 4,
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ maxWidth: 400, mx: 'auto', width: '100%' }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4, textAlign: 'center' }}>
            <Logo sx={{ color: theme.palette.login.main }} />
          </Box>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    error={!!loginForm.formState.errors.email}
                    helperText={loginForm.formState.errors.email?.message}
                    {...loginForm.register("email")}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    error={!!loginForm.formState.errors.password}
                    helperText={loginForm.formState.errors.password?.message}
                    {...loginForm.register("password")}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={isLoading}
                    sx={{
                      backgroundColor: theme.palette.login.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.login.main, 0.9),
                      },
                    }}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
              <Divider sx={{ my: 3 }}>
                <Chip label="OR" />
              </Divider>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<FaGoogle />}
                  sx={{
                    borderColor: theme.palette.login.main,
                    color: theme.palette.login.main,
                    '&:hover': {
                      borderColor: alpha(theme.palette.login.main, 0.9),
                      backgroundColor: alpha(theme.palette.login.main, 0.05),
                    },
                  }}
                >
                  Google
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FaMicrosoft />}
                  sx={{
                    borderColor: theme.palette.login.main,
                    color: theme.palette.login.main,
                    '&:hover': {
                      borderColor: alpha(theme.palette.login.main, 0.9),
                      backgroundColor: alpha(theme.palette.login.main, 0.05),
                    },
                  }}
                >
                  Microsoft
                </Button>
              </Box>
            </TabsContent>
            <TabsContent value="register">
              {renderRegistrationContent()}
            </TabsContent>
          </Tabs>
        </Box>
      </Box>
    </Box>
  );
}