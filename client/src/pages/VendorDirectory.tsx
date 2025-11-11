import { useState } from 'react';
import { Box, Tab, Tabs, Typography, Card, CardContent, Container } from '@mui/material';
import Vendors from "./Vendors";
import Invoicing from "./Invoicing";

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
      id={`vendor-tabpanel-${index}`}
      aria-labelledby={`vendor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vendor-tab-${index}`,
    'aria-controls': `vendor-tabpanel-${index}`,
  };
}

export default function VendorDirectory() {
  const [value, setValue] = useState(0);

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
          <Tabs value={value} onChange={handleChange}>
            <Tab label="Vendors" />
            <Tab label="Invoicing" />
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ bgcolor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <TabPanel value={value} index={0}>
            <Vendors />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Invoicing />
          </TabPanel>
        </Container>
      </Box>
    </Box>
  );
}