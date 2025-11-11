import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@db/schema";
import {
  Box,
  Chip,
  Container,
  Paper,
  Typography,
  alpha,
} from "@mui/material";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from '@/components/Logo';

export default function ConnectAuthPage() {
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
      // Store Connect mode preference before login
      sessionStorage.setItem('isConnectMode', 'true');
      const result = await login(data);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: result.message,
        });
      } else {
        navigate("/connect");
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
        type: 'connect'
      };
      // Store Connect mode preference before registration
      sessionStorage.setItem('isConnectMode', 'true');
      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
      navigate('/connect');
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

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    {...loginForm.register("email")}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    {...loginForm.register("password")}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Loading..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-2 border rounded"
                    {...registerForm.register("email")}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-2 border rounded"
                    {...registerForm.register("password")}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      placeholder="First Name"
                      className="w-full p-2 border rounded"
                      {...registerForm.register("firstName")}
                    />
                    <input
                      placeholder="Last Name"
                      className="w-full p-2 border rounded"
                      {...registerForm.register("lastName")}
                    />
                  </div>
                  <input
                    placeholder="Company Name"
                    className="w-full p-2 border rounded"
                    {...registerForm.register("companyName")}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "Loading..." : "Register"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </Paper>
      </Container>
    </Box>
  );
}