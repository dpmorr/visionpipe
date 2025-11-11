import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Box,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Paper,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  ListItemButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assessment,
  Timeline,
  ShowChart,
  BarChart,
  PieChart,
  TableChart,
  Speed,
  DateRange,
  List as ListIcon,
  Info as InfoIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Line } from '@ant-design/plots';
import { moduleNames, type HomePageModule } from '@/lib/homePageStore';
import { MetricsSection } from './MetricsSection';
import { TrendsSection } from './TrendsSection';
import { PickupsSection } from './PickupsSection';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

// Sample data for previews
const sampleChartConfigs = {
  waste: {
    data: [
      { date: '2024-01', value: 100, type: 'Waste' },
      { date: '2024-02', value: 80, type: 'Waste' },
      { date: '2024-03', value: 120, type: 'Waste' },
      { date: '2024-04', value: 90, type: 'Waste' },
    ],
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: '#37b5fe',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#37b5fe33 1:#37b5fe66',
    },
  },
  recycling: {
    data: [
      { date: '2024-01', value: 60, type: 'Recycling' },
      { date: '2024-02', value: 70, type: 'Recycling' },
      { date: '2024-03', value: 65, type: 'Recycling' },
      { date: '2024-04', value: 75, type: 'Recycling' },
    ],
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: '#6366F1',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#6366F133 1:#6366F166',
    },
  },
};

const samplePickups = [
  {
    id: '1',
    date: '2024-04-25',
    type: 'General Waste',
    status: 'scheduled',
    location: 'Main Building',
  },
  {
    id: '2',
    date: '2024-04-26',
    type: 'Recycling',
    status: 'scheduled',
    location: 'Warehouse',
  },
];

// Create preview versions of the sections
const MetricsPreview = () => <MetricsSection isPreview />;
const TrendsPreview = () => <TrendsSection chartConfigs={sampleChartConfigs} isPreview />;
const PickupsPreview = () => <PickupsSection upcomingPickups={samplePickups} isPreview />;

// Placeholder components for sections that don't exist yet
const DisposalAnalyticsPreview = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body1">Disposal Analytics Preview</Typography>
  </Box>
);

const GoalsPreview = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body1">Goals Preview</Typography>
  </Box>
);

const InitiativesPreview = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body1">Initiatives Preview</Typography>
  </Box>
);

const ImpactMeterPreview = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body1">Impact Meter Preview</Typography>
  </Box>
);

const LeaderboardPreview = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body1">Leaderboard Preview</Typography>
  </Box>
);

const RecommendationsPreview = () => (
  <Box sx={{ p: 2, textAlign: 'center' }}>
    <Typography variant="body1">Recommendations Preview</Typography>
  </Box>
);

interface WidgetCategory {
  name: string;
  widgets: {
    id: HomePageModule;
    title: string;
    description: string;
    icon: JSX.Element;
    preview?: JSX.Element;
  }[];
}

const widgetCategories: WidgetCategory[] = [
  {
    name: 'Analytics',
    widgets: [
      {
        id: 'metrics',
        title: 'Key Metrics',
        description: 'Display essential sustainability metrics and KPIs',
        icon: <Assessment />,
        preview: <MetricsPreview />,
      },
      {
        id: 'trends',
        title: 'Sustainability Trends',
        description: 'Track and visualize sustainability performance over time',
        icon: <Timeline />,
        preview: <TrendsPreview />,
      },
      {
        id: 'disposalAnalytics',
        title: 'Disposal Analytics',
        description: 'Analyze waste disposal patterns and costs',
        icon: <ShowChart />,
        preview: <DisposalAnalyticsPreview />,
      },
    ],
  },
  {
    name: 'Tracking',
    widgets: [
      {
        id: 'goals',
        title: 'Goal Tracking',
        description: 'Monitor progress towards sustainability goals',
        icon: <Speed />,
        preview: <GoalsPreview />,
      },
      {
        id: 'pickups',
        title: 'Upcoming Pickups',
        description: 'View and manage scheduled waste pickups',
        icon: <DateRange />,
        preview: <PickupsPreview />,
      },
      {
        id: 'initiatives',
        title: 'Circular Initiatives',
        description: 'Track ongoing sustainability initiatives',
        icon: <ListIcon />,
        preview: <InitiativesPreview />,
      },
    ],
  },
  {
    name: 'Impact',
    widgets: [
      {
        id: 'impactMeter',
        title: 'Impact Meter',
        description: 'Visualize environmental impact metrics',
        icon: <PieChart />,
        preview: <ImpactMeterPreview />,
      },
      {
        id: 'leaderboard',
        title: 'Sustainability Leaderboard',
        description: 'Compare performance with industry benchmarks',
        icon: <BarChart />,
        preview: <LeaderboardPreview />,
      },
      {
        id: 'recommendations',
        title: 'AI Recommendations',
        description: 'Get AI-powered sustainability insights',
        icon: <TableChart />,
        preview: <RecommendationsPreview />,
      },
    ],
  },
];

interface DashboardLibraryModalProps {
  open: boolean;
  onClose: () => void;
  visibleModules: HomePageModule[];
  onToggleModule: (module: HomePageModule) => void;
}

export default function DashboardLibraryModal({
  open,
  onClose,
  visibleModules,
  onToggleModule,
}: DashboardLibraryModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWidget, setSelectedWidget] = useState<HomePageModule | null>(null);
  const [hoveredWidget, setHoveredWidget] = useState<HomePageModule | null>(null);
  const [lastPreviewWidget, setLastPreviewWidget] = useState<HomePageModule | null>(null);
  const theme = useTheme();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSelectedWidget(null);
    setHoveredWidget(null);
    setLastPreviewWidget(null);
  };

  const handleMouseEnter = (widgetId: HomePageModule) => {
    setHoveredWidget(widgetId);
    setLastPreviewWidget(widgetId);
  };

  const handleMouseLeave = () => {
    setHoveredWidget(null);
  };

  const currentCategory = widgetCategories[activeTab];
  const previewWidget = hoveredWidget || selectedWidget || lastPreviewWidget;
  const widgetToShow = previewWidget
    ? currentCategory.widgets.find(w => w.id === previewWidget)
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          borderRadius: 2,
          transition: 'all 0.3s ease',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Widget Library</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 3, 
        height: '80vh', 
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden' // Prevent double scrollbars
      }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontWeight: 500,
                transition: 'all 0.2s ease',
              },
              '& .Mui-selected': {
                color: 'primary.main',
              },
            }}
          >
            {widgetCategories.map((category, index) => (
              <Tab 
                key={category.name} 
                label={category.name}
                icon={index === 0 ? <Assessment /> : index === 1 ? <Speed /> : <PieChart />}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Widget List */}
            <Grid item xs={12} md={6}>
              <List sx={{ height: '100%', overflowY: 'auto', pr: 2 }}>
                {currentCategory.widgets.map((widget, index) => (
                  <Box key={widget.id}>
                    {index > 0 && <Divider />}
                    <ListItemButton
                      sx={{
                        py: 2,
                        cursor: 'pointer',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'action.hover',
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                          pointerEvents: 'none',
                        },
                        '&:hover::after': {
                          opacity: 0.08,
                        },
                        '&.Mui-selected::after': {
                          opacity: 0.12,
                          backgroundColor: 'primary.main',
                        },
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'translateX(4px)',
                        },
                      }}
                      selected={selectedWidget === widget.id}
                      onClick={() => setSelectedWidget(widget.id)}
                      onMouseEnter={() => handleMouseEnter(widget.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            backgroundColor: 'primary.main',
                            borderRadius: 1,
                            p: 1,
                            color: 'white',
                            display: 'flex',
                          }}
                        >
                          {widget.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={widget.title}
                        secondary={widget.description}
                        primaryTypographyProps={{
                          fontWeight: 500,
                        }}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="View details">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              // Show more details
                            }}>
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Checkbox
                            checked={visibleModules.includes(widget.id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => onToggleModule(widget.id)}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItemButton>
                  </Box>
                ))}
              </List>
            </Grid>

            {/* Preview Area */}
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  transition: 'all 0.3s ease',
                  opacity: previewWidget ? 1 : 0.7,
                  overflow: 'auto',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Widget Preview
                </Typography>
                {widgetToShow ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Preview of how the {widgetToShow.title} widget will appear on your dashboard
                    </Typography>
                    <Box 
                      sx={{ 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transform: 'scale(0.8)',
                        transformOrigin: 'top left',
                        width: '125%',
                        height: '125%',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: 2,
                          transition: 'all 0.3s ease',
                          '& .MuiCardContent-root': {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            p: 2,
                          },
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Box
                              sx={{
                                backgroundColor: 'primary.main',
                                borderRadius: 1,
                                p: 1,
                                color: 'white',
                                display: 'flex',
                              }}
                            >
                              {widgetToShow.icon}
                            </Box>
                            <Typography variant="h6">{widgetToShow.title}</Typography>
                          </Box>
                          {widgetToShow.preview ? (
                            <Box 
                              sx={{ 
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: 200,
                                p: 2,
                                bgcolor: 'background.default',
                                borderRadius: 1,
                              }}
                            >
                              {widgetToShow.preview}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center">
                              Preview not available for this widget type
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  </>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0.7,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Select a widget to see its preview
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={onClose} variant="contained">
            Save Changes
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}