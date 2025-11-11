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
  Paper,
  Chip,
  alpha
} from "@mui/material";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from '@/components/Logo';

export default function LiteAuthPage() {
  const { login } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

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
    },
  });

  async function onLogin(data: { email: string; password: string }) {
    try {
      setIsLoading(true);
      // Store lite mode preference before login
      sessionStorage.setItem('isLiteMode', 'true');
      const result = await login(data);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message,
        });
      } else {
        navigate("/lite");
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
      const registrationData = {
        ...data,
        type: 'lite'
      };
      // Store lite mode preference before registration
      sessionStorage.setItem('isLiteMode', 'true');
      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
      window.location.href = '/lite';
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
        bgcolor: 'background.default',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Version chip */}
      <Chip
        label="CONNECT"
        color="primary"
        variant="outlined"
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          borderRadius: '16px',
          padding: '16px 24px',
          height: 'auto',
          fontSize: '1rem',
          fontWeight: 'bold',
          borderWidth: 2,
          borderColor: (theme) => theme.palette.primary.main,
          color: (theme) => theme.palette.primary.main,
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
          }
        }}
      />

      <Container maxWidth="sm">
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Logo height={80} />
            </Box>
            <Typography variant="h5" sx={{ mb: 1 }}>
              wastetraq Connect Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your organization's waste management data
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-4">
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
                      variant="outlined"
                      error={!!loginForm.formState.errors.email}
                      helperText={loginForm.formState.errors.email?.message}
                      {...loginForm.register("email")}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      variant="outlined"
                      error={!!loginForm.formState.errors.password}
                      helperText={loginForm.formState.errors.password?.message}
                      {...loginForm.register("password")}
                    />
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={isLoading}
                      sx={{ mt: 2 }}
                    >
                      {isLoading ? "Loading..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <Grid container spacing={2}>
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
                          type="submit"
                          variant="contained"
                          disabled={isLoading}
                        >
                          {isLoading ? "Loading..." : "Register"}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
}