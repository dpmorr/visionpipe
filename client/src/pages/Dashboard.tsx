import { useState } from 'react';
import {
  Stack,
  Button,
  Drawer,
  Checkbox,
  Typography,
  Card,
  CardContent,
  CardHeader,
  FormGroup,
  FormControlLabel,
  Box,
  IconButton
} from '@mui/material';
import {
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Assessment as ReconciliationIcon,
  EmojiEvents as TrophyIcon,
  ShowChart as LineChartIcon,
  BoltOutlined as ThunderboltIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import PageHeader from '@/components/PageHeader';
import { useDashboardStore, type DashboardModule, type DashboardMetrics, type QuickAction } from '@/lib/dashboardStore';
import { MetricsSection } from '@/components/DashboardModules/MetricsSection';
import { QuickActionsSection } from '@/components/DashboardModules/QuickActionsSection';
import { GoalTrackingSection } from '@/components/DashboardModules/GoalTrackingSection';
import { InitiativeTrackingSection } from '@/components/DashboardModules/InitiativeTrackingSection';
import { TrendsSection } from '@/components/DashboardModules/TrendsSection';
import { PickupsSection } from '@/components/DashboardModules/PickupsSection';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

// Update sparkline settings with enhanced styling
const sparklineSettings = {
  height: 60,
  showTooltip: true,
  showHighlight: true,
  colors: ['#fff'],
  curve: "natural" as const,
  title: "Trend",
  sx: {
    '& .MuiChartsAxis-line': {
      display: 'none',
    },
    '& .MuiChartsAxis-tick': {
      display: 'none',
    },
    '& .MuiLineElement-root': {
      strokeWidth: 2,
      filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.2))',
    },
    '& .MuiChartsLegend-mark': {
      display: 'none',
    },
    '& .MuiChartsLegend-label': {
      fill: 'rgba(255, 255, 255, 0.8)',
      fontSize: '12px',
    }
  }
};

const sparklineData = [400, 300, 500, 350, 450, 569];
const recoveredSparklineData = [200, 150, 250, 175, 225, 277];

const moduleNames: Record<DashboardModule, string> = {
  metrics: 'Key Metrics',
  quickActions: 'Quick Actions',
  goals: 'Goal Tracking',
  initiatives: 'Initiative Tracking',
  trends: 'Sustainability Trends',
  pickups: 'Upcoming Pickups'
};

// Sample data
const wasteData = [
  { week: 'Week 1', landfill: 0, recycled: 18, repurposed: 12 },
  { week: 'Week 2', landfill: 12, recycled: 30, repurposed: 15 },
  { week: 'Week 3', landfill: 35, recycled: 25, repurposed: 20 },
  { week: 'Week 4', landfill: 30, recycled: 38, repurposed: 15 },
];

const topProducts = [
  { id: 1, name: 'Shampoo', volume: 450 },
  { id: 2, name: 'Medicine', volume: 380 },
  { id: 3, name: 'Body Care', volume: 290 },
];

const upcomingPickups = [
  { date: '2024-01-15', type: 'General Waste', status: 'scheduled', quantity: '2.5 tons' },
  { date: '2024-01-18', type: 'Recyclables', status: 'pending', quantity: '1.8 tons' },
  { date: '2024-01-20', type: 'Hazardous', status: 'confirmed', quantity: '0.5 tons' },
  { date: '2024-01-22', type: 'Organic Waste', status: 'scheduled', quantity: '1.2 tons' },
];

const ResponsiveGridLayout = WidthProvider(Responsive);

function Dashboard() {
  const [configVisible, setConfigVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const { visibleModules, toggleModule } = useDashboardStore();
  const [layouts, setLayouts] = useState(() => {
    // Try to load saved layout from localStorage
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        return JSON.parse(savedLayout);
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
      }
    }
    // Default layout if no saved layout exists
    return {
      lg: [
        { i: 'metrics', x: 0, y: 0, w: 12, h: 1 },
        { i: 'quickActions', x: 0, y: 1, w: 12, h: 1 },
        { i: 'wasteChart', x: 0, y: 2, w: 8, h: 2 },
        { i: 'costCards', x: 8, y: 2, w: 4, h: 2 },
        { i: 'goals', x: 0, y: 4, w: 6, h: 2 },
        { i: 'efficiency', x: 6, y: 4, w: 6, h: 2 },
        { i: 'initiatives', x: 0, y: 6, w: 12, h: 2 },
        { i: 'trends', x: 0, y: 8, w: 8, h: 2 },
        { i: 'topProducts', x: 8, y: 8, w: 4, h: 2 },
        { i: 'pickups', x: 0, y: 10, w: 12, h: 2 }
      ]
    };
  });

  const onLayoutChange = (layout: any, layouts: any) => {
    setLayouts(layouts);
    // Save the new layout to localStorage
    localStorage.setItem('dashboard-layout', JSON.stringify(layouts));
  };

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ['/api/metrics/sustainability']
  });

  const quickActions: QuickAction[] = [
    {
      title: 'Material Analysis',
      icon: <ReconciliationIcon sx={{ fontSize: 28 }} />,
      description: 'Analyze product components and recyclability',
      link: '/material-analysis',
      color: '#04a2fe',
      bgColor: '#E6F7FF'
    },
    {
      title: 'Training Simulator',
      icon: <TrophyIcon sx={{ fontSize: 28 }} />,
      description: 'Interactive waste management training',
      link: '/training',
      color: '#04a2fe',
      bgColor: '#E6F7FF'
    },
    {
      title: 'Reports',
      icon: <LineChartIcon sx={{ fontSize: 28 }} />,
      description: 'Generate sustainability reports',
      link: '/reports',
      color: '#04a2fe',
      bgColor: '#E6F7FF'
    }
  ];

  // Chart configurations for trends
  const trendChartConfigs = {
    waste: {
      data: [
        { date: '2024-01', value: 2500, type: 'Waste' },
        { date: '2024-02', value: 2200, type: 'Waste' },
        { date: '2024-03', value: 1800, type: 'Waste' },
        { date: '2024-04', value: 1500, type: 'Waste' },
        { date: '2024-05', value: 1200, type: 'Waste' },
      ],
      xField: 'date',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      color: '#04a2fe',
      areaStyle: {
        fill: 'l(270) 0:#ffffff 0.5:#B3E0FF 1:#04a2fe',
      },
    },
    recycling: {
      data: [
        { date: '2024-01', value: 65, type: 'Recycling' },
        { date: '2024-02', value: 68, type: 'Recycling' },
        { date: '2024-03', value: 72, type: 'Recycling' },
        { date: '2024-04', value: 75, type: 'Recycling' },
        { date: '2024-05', value: 78, type: 'Recycling' },
      ],
      xField: 'date',
      yField: 'value',
      seriesField: 'type',
      smooth: true,
      color: '#04a2fe',
      areaStyle: {
        fill: 'l(270) 0:#ffffff 0.5:#B3E0FF 1:#04a2fe',
      },
    }
  };

  return (
    <div className="space-y-6 p-6 dashboard-page">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your organization's sustainability metrics"
        extra={[
          <Button
            key="lock"
            startIcon={isLocked ? <LockIcon /> : <LockOpenIcon />}
            onClick={() => setIsLocked(!isLocked)}
            variant="outlined"
            sx={{ mr: 1 }}
          >
            {isLocked ? 'Unlock Layout' : 'Lock Layout'}
          </Button>,
          <Button
            key="customize"
            startIcon={<SettingsIcon />}
            onClick={() => setConfigVisible(true)}
            variant="outlined"
          >
            Customize Dashboard
          </Button>
        ]}
      />

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        margin={[16, 16]}
        onLayoutChange={onLayoutChange}
        isDraggable={!isLocked}
        isResizable={!isLocked}
        useCSSTransforms={true}
        compactType={null}
      >
        {visibleModules.includes('metrics') && (
          <div key="metrics">
            <MetricsSection metrics={metrics} />
          </div>
        )}

        {visibleModules.includes('quickActions') && (
          <div key="quickActions">
            <QuickActionsSection actions={quickActions} />
          </div>
        )}

        {visibleModules.includes('initiatives') && (
          <div key="wasteChart">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <Typography variant="h6">Waste (Tonnes)</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Waste distribution over time
                    </Typography>
                  </div>
                  <select className="text-sm border rounded-md p-1">
                    <option>This Month</option>
                    <option>Last 3 Months</option>
                    <option>This Year</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wasteData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="landfill" stroke="#37b5fe" name="Landfill" />
                      <Line type="monotone" dataKey="recycled" stroke="#6366F1" name="Recycled" />
                      <Line type="monotone" dataKey="repurposed" stroke="#F59E0B" name="Repurposed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {visibleModules.includes('metrics') && (
          <div key="costCards">
            <Stack spacing={2}>
              <Card sx={{
                background: 'linear-gradient(135deg, #37b5fe 0%, #0094e5 100%)',
                color: 'white',
                '& .MuiCardHeader-action': {
                  margin: 0
                }
              }}>
                <CardHeader
                  action={
                    <IconButton size="small" sx={{ color: 'white' }}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  title={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ color: 'white', m: 0 }}>Total Disposal Cost</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" sx={{ color: 'white', mb: 0.5 }}>$569,548.49</Typography>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                      From All Product Categories
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <SparkLineChart
                      data={sparklineData}
                      {...sparklineSettings}
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{
                background: 'linear-gradient(135deg, #37b5fe 0%, #0094e5 100%)',
                color: 'white',
                '& .MuiCardHeader-action': {
                  margin: 0
                }
              }}>
                <CardHeader
                  action={
                    <IconButton size="small" sx={{ color: 'white' }}>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  title={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ color: 'white', m: 0 }}>Costs Recovered</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h3" sx={{ color: 'white', mb: 0.5 }}>$277,943.50</Typography>
                    <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                      From Recycling Schemes
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <SparkLineChart
                      data={recoveredSparklineData}
                      {...sparklineSettings}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </div>
        )}

        {visibleModules.includes('goals') && (
          <>
            <div key="goals">
              <GoalTrackingSection />
            </div>
            <div key="efficiency">
              <Card>
                <CardHeader>
                  <Typography variant="h6">Waste Management Efficiency</Typography>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center p-4">
                    <div style={{ width: 200, height: 200 }}>
                      <CircularProgressbar
                        value={63}
                        text="63%"
                        styles={buildStyles({
                          pathColor: '#37b5fe',
                          textColor: '#37b5fe',
                          trailColor: '#E5E7EB',
                        })}
                      />
                    </div>
                  </div>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    On average, less than industry landfilled
                  </Typography>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {visibleModules.includes('initiatives') && (
          <div key="initiatives">
            <InitiativeTrackingSection />
          </div>
        )}

        {visibleModules.includes('trends') && (
          <>
            <div key="trends">
              <TrendsSection chartConfigs={trendChartConfigs} />
            </div>
            <div key="topProducts">
              <Card>
                <CardHeader>
                  <Typography variant="h6">Top Products</Typography>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Typography variant="body2">{index + 1}.</Typography>
                          <Typography>{product.name}</Typography>
                        </div>
                        <Typography variant="body2" color="text.secondary">
                          {product.volume} units
                        </Typography>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {visibleModules.includes('pickups') && (
          <div key="pickups">
            <PickupsSection pickups={upcomingPickups} />
          </div>
        )}
      </ResponsiveGridLayout>

      <Drawer
        anchor="right"
        open={configVisible}
        onClose={() => setConfigVisible(false)}
      >
        <Box sx={{ width: 300, p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Visible Modules</Typography>
            <FormGroup>
              {(Object.keys(moduleNames) as DashboardModule[]).map((module) => (
                <FormControlLabel
                  key={module}
                  control={
                    <Checkbox
                      checked={visibleModules.includes(module)}
                      onChange={() => toggleModule(module)}
                    />
                  }
                  label={moduleNames[module]}
                />
              ))}
            </FormGroup>
          </Stack>
        </Box>
      </Drawer>
    </div>
  );
}

export default Dashboard;