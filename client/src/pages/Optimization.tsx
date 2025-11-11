import { useState } from 'react';
import { Box, Tab, Tabs, Card, Menu, MenuItem, IconButton } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { ReactFlowProvider } from 'reactflow';
import FlowChart from '@/components/FlowChart';
import { useQuery } from '@tanstack/react-query';

interface WastePoint {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: string;
  unit: string;
  vendor: string;
  notes: string | null;
  sensor?: {
    id: number;
    name: string;
    type: string;
    location: string;
    lastReading?: number;
    lastReadingUnit?: string;
  } | null;
}

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
      id={`optimization-tabpanel-${index}`}
      aria-labelledby={`optimization-tab-${index}`}
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
    id: `optimization-tab-${index}`,
    'aria-controls': `optimization-tabpanel-${index}`,
  };
}

export default function Locations() {
  const [tabValue, setTabValue] = useState(0);
  const [optMenuAnchor, setOptMenuAnchor] = useState<null | HTMLElement>(null);
  const [optMenuSelection, setOptMenuSelection] = useState<'routing' | 'paths' | 'stations'>('routing');

  // Fetch waste points data
  const { data: wastePoints = [], isLoading } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const hasWastePoints = wastePoints.length > 0;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOptMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOptMenuAnchor(event.currentTarget);
  };
  const handleOptMenuClose = () => {
    setOptMenuAnchor(null);
  };
  const handleOptMenuSelect = (option: 'routing' | 'paths' | 'stations') => {
    setOptMenuSelection(option);
    setOptMenuAnchor(null);
    setTabValue(1);
  };

  return (
    <>
      <style>{`.css-19kzrtu { padding: 0px !important; }`}</style>
      <Box sx={{ minHeight: '100vh' }} className="waste-flow-page">
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
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Overview" {...a11yProps(0)} />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Optimization
                    <IconButton
                      size="small"
                      onClick={handleOptMenuOpen}
                      sx={{ ml: 0.5 }}
                    >
                      <ArrowDropDownIcon />
                    </IconButton>
                  </Box>
                }
                {...a11yProps(1)}
                aria-controls={optMenuAnchor ? 'optimization-menu' : undefined}
                aria-haspopup="true"
              />
            </Tabs>
            <Menu
              id="optimization-menu"
              anchorEl={optMenuAnchor}
              open={Boolean(optMenuAnchor)}
              onClose={handleOptMenuClose}
            >
              <MenuItem onClick={() => handleOptMenuSelect('routing')}>Routing</MenuItem>
              <MenuItem onClick={() => handleOptMenuSelect('paths')}>Paths</MenuItem>
              <MenuItem onClick={() => handleOptMenuSelect('stations')}>Stations</MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box sx={{ bgcolor: 'background.default' }}>
          <Box sx={{ p: 3 }}>
            <TabPanel value={tabValue} index={0}>
              <Card sx={{ borderRadius: 0 }}>
                {hasWastePoints ? (
                  <ReactFlowProvider>
                    <FlowChart wastePoints={wastePoints} isMultiSite={true} />
                  </ReactFlowProvider>
                ) : (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    Please add at least one waste point before accessing the overview.
                  </Box>
                )}
              </Card>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Card sx={{ borderRadius: 0, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box>
                  {optMenuSelection === 'routing' && <Box>Routing optimization content coming soon...</Box>}
                  {optMenuSelection === 'paths' && <Box>Paths optimization content coming soon...</Box>}
                  {optMenuSelection === 'stations' && <Box>Stations optimization content coming soon...</Box>}
                </Box>
              </Card>
            </TabPanel>
          </Box>
        </Box>
      </Box>
    </>
  );
} 