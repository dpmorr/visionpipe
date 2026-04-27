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
  Divider,
  useTheme,
  alpha,
  Chip,
  Stack,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  ShieldOutlined as ShieldOutlinedIcon,
  HubOutlined as HubOutlinedIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from "@mui/icons-material";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import Logo from "@/components/Logo";

const featureHighlights = [
  {
    title: "Computer Vision",
    description: "Real-time object detection and waste classification at the edge.",
    Icon: AutoAwesomeIcon,
  },
  {
    title: "Telemetry",
    description: "Stream sensor data into a unified time-series fabric.",
    Icon: InsightsIcon,
  },
  {
    title: "Compliance",
    description: "Audit-ready reports across every facility and jurisdiction.",
    Icon: ShieldOutlinedIcon,
  },
  {
    title: "Integrations",
    description: "Native connectors for ERP, scales, and route optimization.",
    Icon: HubOutlinedIcon,
  },
];

const registrationSteps = [
  {
    title: "Create your account",
    type: "credentials",
    fields: ["email", "password", "firstName", "lastName", "companyName"],
  },
  {
    title: "What best describes your role?",
    type: "cards",
    field: "role",
    options: [
      { id: "user", label: "Operator", description: "Manage waste and CV pipelines for my organization." },
      { id: "vendor", label: "Service Provider", description: "Provide waste hauling, recycling, or processing services." },
    ],
  },
  {
    title: "Industry vertical",
    type: "cards",
    field: "industry",
    options: [
      { id: "manufacturing", label: "Manufacturing", description: "Production, assembly, and process operations." },
      { id: "retail", label: "Retail", description: "Distribution, stores, and consumer goods." },
      { id: "healthcare", label: "Healthcare", description: "Clinical, lab, and pharmaceutical waste." },
      { id: "technology", label: "Technology", description: "Data centers, electronics, and circular tech." },
    ],
  },
] as const;

const SelectionCard = ({
  option,
  selected,
  onClick,
}: {
  option: { id: string; label: string; description: string };
  selected: boolean;
  onClick: () => void;
}) => {
  const theme = useTheme();
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        p: 2.5,
        height: "100%",
        transition: "all 0.15s ease",
        border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        backgroundColor: selected
          ? alpha(theme.palette.primary.main, 0.08)
          : theme.palette.background.paper,
        boxShadow: selected
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`
          : "none",
        "&:hover": {
          borderColor: theme.palette.primary.main,
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {option.label}
        </Typography>
        {selected && (
          <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "primary.main" }} />
        )}
      </Stack>
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
    resolver: zodResolver(
      insertUserSchema.pick({ email: true, password: true })
    ),
    defaultValues: { email: "", password: "" },
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
      setCurrentStep((prev) => prev + 1);
    } else {
      onRegister(registerForm.getValues());
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 0) {
      const fields = registrationSteps[0].fields as readonly string[];
      const isValid = await registerForm.trigger(fields as any);
      if (isValid) setCurrentStep((prev) => prev + 1);
    }
  };

  const renderRegistrationContent = () => {
    const step = registrationSteps[currentStep];

    if (step.type === "credentials") {
      return (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {step.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Step {currentStep + 1} of {registrationSteps.length}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                error={!!registerForm.formState.errors.email}
                helperText={registerForm.formState.errors.email?.message as string}
                {...registerForm.register("email")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                error={!!registerForm.formState.errors.password}
                helperText={registerForm.formState.errors.password?.message as string}
                {...registerForm.register("password")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First name"
                error={!!registerForm.formState.errors.firstName}
                helperText={registerForm.formState.errors.firstName?.message as string}
                {...registerForm.register("firstName")}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last name"
                error={!!registerForm.formState.errors.lastName}
                helperText={registerForm.formState.errors.lastName?.message as string}
                {...registerForm.register("lastName")}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company"
                error={!!registerForm.formState.errors.companyName}
                helperText={registerForm.formState.errors.companyName?.message as string}
                {...registerForm.register("companyName")}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                size="large"
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

    return (
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {step.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Step {currentStep + 1} of {registrationSteps.length}
        </Typography>
        <Grid container spacing={2}>
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
            onClick={() => setCurrentStep((prev) => prev - 1)}
            sx={{ mt: 3 }}
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
        toast({ variant: "destructive", title: "Login failed", description: result.message });
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
      sessionStorage.setItem("registrationData", JSON.stringify(data));
      window.location.href = "/subscribe";
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
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Left — hero */}
      <Box
        sx={{
          flex: 1.1,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
          p: 6,
          borderRight: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* grid + glow background */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(ellipse 80% 60% at 30% 20%, ${alpha(
              "#A855F7",
              0.18
            )} 0%, transparent 60%),
              linear-gradient(${alpha("#26262F", 0.7)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha("#26262F", 0.7)} 1px, transparent 1px)`,
            backgroundSize: "100% 100%, 32px 32px, 32px 32px",
            maskImage:
              "radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 75%)",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Logo size={36} />
        </Box>

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 560 }}>
          <Chip
            label="COMPUTER VISION · WASTE INTELLIGENCE"
            size="small"
            sx={{
              mb: 3,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              fontWeight: 600,
              color: "primary.light",
              backgroundColor: alpha("#A855F7", 0.1),
              border: `1px solid ${alpha("#A855F7", 0.4)}`,
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              mb: 2,
              fontSize: { md: "2.75rem", lg: "3.25rem" },
            }}
          >
            Industrial-grade vision
            <br />
            for the{" "}
            <Box
              component="span"
              sx={{
                background:
                  "linear-gradient(135deg, hsl(271, 91%, 70%) 0%, hsl(292, 84%, 73%) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              circular economy
            </Box>
            .
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", mb: 5, maxWidth: 480 }}
          >
            Track every gram of waste, every second of detection, and every
            kilometer of haul — across every facility, in real time.
          </Typography>

          <Grid container spacing={2} sx={{ maxWidth: 540 }}>
            {featureHighlights.map(({ title, description, Icon }) => (
              <Grid item xs={6} key={title}>
                <Box
                  sx={{
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    backgroundColor: alpha("#FFFFFF", 0.02),
                    height: "100%",
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: 20,
                      color: "primary.light",
                      mb: 1,
                    }}
                  />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
                    {title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                    {description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
            color: "text.disabled",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
            }}
          >
            SOC 2 · ISO 27001 · GDPR
          </Typography>
        </Box>
      </Box>

      {/* Right — auth */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: { xs: 3, md: 6 },
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ maxWidth: 420, mx: "auto", width: "100%" }}>
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 4 }}>
            <Logo size={32} />
          </Box>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-surface-elevated border border-border">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Welcome back
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Sign in to your VisionPipe workspace.
              </Typography>

              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4"
                >
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    autoComplete="email"
                    error={!!loginForm.formState.errors.email}
                    helperText={loginForm.formState.errors.email?.message as string}
                    {...loginForm.register("email")}
                  />
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    error={!!loginForm.formState.errors.password}
                    helperText={loginForm.formState.errors.password?.message as string}
                    {...loginForm.register("password")}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </Form>

              <Divider sx={{ my: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.disabled",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    letterSpacing: "0.1em",
                  }}
                >
                  OR CONTINUE WITH
                </Typography>
              </Divider>

              <Stack direction="row" spacing={1.5}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FaGoogle />}
                >
                  Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FaMicrosoft />}
                >
                  Microsoft
                </Button>
              </Stack>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              {renderRegistrationContent()}
            </TabsContent>
          </Tabs>

          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 4,
              color: "text.disabled",
              textAlign: "center",
            }}
          >
            By continuing you agree to our Terms and Privacy Policy.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
