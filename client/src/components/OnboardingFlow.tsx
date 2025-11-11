import { useState } from "react";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FaBuilding, FaRecycle, FaChartLine } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { queryClient } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-user";

const steps = [
  {
    title: "Welcome to wastetraq",
    description: "Let's get started with your sustainability journey",
    icon: FaBuilding,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          wastetraq helps businesses track and improve their environmental impact through intelligent analytics and actionable insights.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <FaRecycle className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Waste Management</h4>
              <p className="text-sm text-muted-foreground">Track and optimize your waste disposal</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FaChartLine className="w-5 h-5 text-primary mt-1" />
            <div>
              <h4 className="font-medium">Analytics</h4>
              <p className="text-sm text-muted-foreground">Get insights into your sustainability metrics</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Company Profile",
    description: "Tell us about your business",
    icon: FaBuilding,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          We'll customize your experience based on your company's profile and needs.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Personalized sustainability recommendations</li>
          <li>• Industry-specific benchmarks</li>
          <li>• Tailored waste management solutions</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Set Your Goals",
    description: "Define your sustainability targets",
    icon: FaChartLine,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Setting clear goals helps track your progress and celebrate achievements.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Waste Reduction</span>
            <span className="text-primary">25%</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>
      </div>
    ),
  },
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/complete-onboarding', {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        await queryClient.invalidateQueries({ queryKey: ['user'] });

        toast({
          title: "Welcome to wastetraq!",
          description: "Your onboarding is complete. Let's get started!",
        });

        // Navigate based on user role
        if (user?.role === 'vendor') {
          navigate("/vendor/dashboard");
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to complete onboarding. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSkip = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await queryClient.invalidateQueries({ queryKey: ['user'] });

      toast({
        title: "Welcome to wastetraq!",
        description: "You can always complete your profile later.",
      });

      // Navigate based on user role
      if (user?.role === 'vendor') {
        navigate("/vendor/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const Step = steps[currentStep];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center relative pb-0">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
              Skip
            </Button>
          </div>
          <Progress value={progress} className="mb-4" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center mb-6">
                <Step.icon className="w-12 h-12 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold">{Step.title}</CardTitle>
              <CardDescription className="text-lg mt-2">
                {Step.description}
              </CardDescription>
            </motion.div>
          </AnimatePresence>
        </CardHeader>
        <CardContent className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {Step.content}
              <div className="flex justify-end space-x-4">
                <Button
                  onClick={handleNext}
                  className="min-w-[120px]"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : currentStep === steps.length - 1 ? "Get Started" : "Next"}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}