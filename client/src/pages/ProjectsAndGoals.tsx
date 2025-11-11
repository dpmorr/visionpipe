import { useState } from "react";
import { Box, Container, Tabs, Tab, Typography, Button } from "@mui/material";
import { Target as TargetIcon } from 'lucide-react';
import { GoalSetter } from "./GoalSetter";
import { GoalsDisplay } from "../components/GoalsDisplay";
import ProjectManagement from "./ProjectManagement";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`projects-goals-tabpanel-${index}`}
      aria-labelledby={`projects-goals-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `projects-goals-tab-${index}`,
    'aria-controls': `projects-goals-tabpanel-${index}`,
  };
}

export default function ProjectsAndGoals() {
  const [value, setValue] = useState(0);
  const [isGoalSetterOpen, setIsGoalSetterOpen] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box 
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          px: 3
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}
        >
          <Tabs value={value} onChange={handleChange} aria-label="projects and goals tabs">
            <Tab label="Projects" {...a11yProps(0)} />
            <Tab label="Goals" {...a11yProps(1)} />
          </Tabs>
          {value === 1 && (
            <Button
              variant="contained"
              startIcon={<TargetIcon />}
              onClick={() => setIsGoalSetterOpen(true)}
            >
              Set New Goal
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.default' }}>
        {value === 0 ? (
          <TabPanel value={value} index={0}>
            <ProjectManagement />
          </TabPanel>
        ) : (
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <TabPanel value={value} index={1}>
              <Box>
                <GoalSetter open={isGoalSetterOpen} onClose={() => setIsGoalSetterOpen(false)} />
                <GoalsDisplay />
              </Box>
            </TabPanel>
          </Container>
        )}
      </Box>
    </Box>
  );
}