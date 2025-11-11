import { useState, useEffect } from 'react';
import { 
  Box,
  Stepper, 
  Step, 
  StepLabel, 
  Typography,
  styled,
  Paper
} from '@mui/material';
import { ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Link as WouterLink } from 'wouter';
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const InteractiveStep = styled(Step)(({ theme }) => ({
  '& .MuiStepLabel-root': {
    cursor: 'pointer',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      '& .MuiStepLabel-label': {
        color: theme.palette.primary.main,
      },
      '& .MuiStepIcon-root': {
        color: theme.palette.primary.main,
      },
    },
  },
  '& .MuiStepIcon-root': {
    transition: 'color 0.2s ease-in-out',
  },
  '& .MuiStepLabel-label': {
    transition: 'color 0.2s ease-in-out',
  },
}));

const steps = [
  {
    label: 'Complete Profile',
    description: 'Set up your organization profile and preferences',
    link: '/organization-settings',
    completed: true
  },
  {
    label: 'Configure Services',
    description: 'Select and customize your sustainability services',
    link: '/marketplace',
    completed: true
  },
  {
    label: 'Connect Data Sources',
    description: 'Link your data sources for accurate tracking',
    link: '/integrations',
    completed: true
  },
  {
    label: 'Configure Waste Points',
    description: 'Set up and manage your waste collection points',
    link: '/waste-points',
    completed: true
  },
  {
    label: 'Set Goals',
    description: 'Define your environmental targets and KPIs',
    link: '/goal-setter',
    completed: true
  }
];

export default function OnboardingSteps() {
  const [activeStep, setActiveStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [stepsState, setStepsState] = useState(steps);

  const completedCount = stepsState.filter(step => step.completed).length;

  useEffect(() => {
    console.log(`Steps completed: ${completedCount}/${steps.length}`);
    if (completedCount === steps.length) {
      console.log('All steps completed, collapsing section');
      setIsOpen(false);
    }
  }, [completedCount]);

  const handleStepClick = (index: number) => {
    setStepsState(prev => prev.map((step, i) => 
      i === index ? { ...step, completed: !step.completed } : step
    ));
    window.location.href = steps[index].link;
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3,
        backgroundColor: 'background.paper',
        borderRadius: 2
      }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 3,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {completedCount} of {steps.length} completed
          </Typography>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground"
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isOpen ? "Collapse" : "Expand"} getting started guide
              </span>
            </Button>
          </CollapsibleTrigger>
        </Box>

        <CollapsibleContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {stepsState.map((step, index) => (
              <InteractiveStep key={step.label}>
                <StepLabel
                  onClick={() => handleStepClick(index)}
                  StepIconProps={{
                    sx: {
                      '&.MuiStepIcon-root': {
                        color: 'primary.main',
                        '&.Mui-completed': {
                          color: 'success.main',
                        },
                      },
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {step.description}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        mt: 0.5,
                        opacity: 0.8
                      }}
                    >
                      Click to configure <ChevronRight size={14} />
                    </Typography>
                  </Box>
                </StepLabel>
              </InteractiveStep>
            ))}
          </Stepper>
        </CollapsibleContent>
      </Collapsible>
    </Paper>
  );
}