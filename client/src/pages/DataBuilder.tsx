import { useState } from 'react';
import { Box, Tab, Tabs, Card } from '@mui/material';
import { ReactFlowProvider } from 'reactflow';
import FlowChart from '@/components/FlowChart';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

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

// Helper for drag start
function onLibraryDragStart(event: React.DragEvent, nodeType: string) {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

export default function Optimization() {
  console.log('DataBuilder component mounting...');
  const [tabValue, setTabValue] = useState(0);
  const [location] = useLocation();
  
  // Extract ID from URL path
  const pathParts = location.split('/');
  const id = pathParts[pathParts.length - 1] === 'data-builder' ? undefined : pathParts[pathParts.length - 1];
  
  console.log('Location info:', { location, pathParts, id });

  // Fetch model if id is present
  const modelQuery = useQuery({
    queryKey: id ? ["data-model", id] : [],
    queryFn: id ? () => fetch(`/api/data-models/${id}`, {
      credentials: 'include'
    }).then(res => res.json()) : undefined,
    enabled: !!id
  });
  const model = modelQuery.data && typeof modelQuery.data === 'object' ? modelQuery.data : undefined;

  // Debug logging
  console.log('DataBuilder Debug:', {
    id,
    location,
    modelQuery: {
      isLoading: modelQuery.isLoading,
      isError: modelQuery.isError,
      error: modelQuery.error,
      data: modelQuery.data
    },
    model,
    builderConfig: model?.builderConfig
  });

  // Fetch waste points data (optional, keep for now)
  const wastePointsQuery = useQuery({
    queryKey: ['/api/waste-points'],
  });
  const wastePoints = Array.isArray(wastePointsQuery.data) ? wastePointsQuery.data : [];

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <style>{`.css-19kzrtu { padding: 0px !important; } .css-1cneql5 { padding: 0px !important; }`}</style>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Debug info */}
        <Box sx={{ position: 'fixed', top: 10, left: 10, zIndex: 9999, bgcolor: 'red', color: 'white', p: 1 }}>
          DataBuilder ID: {id || 'none'} | Location: {location}
        </Box>
        {/* Main Content Only - Remove Library Sidebar */}
        <Box sx={{ flex: 1, bgcolor: 'background.default', p: 3 }}>
          {/* <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Flows" />
          </Tabs> */}
          {/* <Box role="tabpanel" hidden={tabValue !== 0}> */}
          <Card sx={{ borderRadius: 0 }}>
            <ReactFlowProvider>
              <FlowChart
                wastePoints={wastePoints}
                initialConfig={model?.builderConfig}
              />
            </ReactFlowProvider>
          </Card>
          {/* </Box> */}
        </Box>
      </Box>
    </>
  );
} 