import { Box, Container, Grid, Typography, Card, CardContent, Stack, Paper, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel, Button, Link as MuiLink, IconButton } from '@mui/material';
import { Link } from 'wouter';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { MetricsSection } from '@/components/DashboardModules/MetricsSection';
import { TrendsSection } from '@/components/DashboardModules/TrendsSection';
import { CircularInitiativesSection } from '@/components/CircularInitiativesSection';
import WasteImpactMeter from '@/components/WasteImpactMeter';
import SustainabilityLeaderboard from '@/components/SustainabilityLeaderboard';
import { GoalTrackingSection } from '@/components/DashboardModules/GoalTrackingSection';
import OnboardingSteps from "@/components/OnboardingSteps";
import NotificationCenter from "@/components/NotificationCenter";
import type { DashboardMetrics, CarbonImpact } from '@/lib/dashboardStore';
import { useState } from 'react';
import { TuneRounded as TuneIcon, Lock as LockIcon, LockOpen as LockOpenIcon, Edit, Delete as DeleteIcon } from '@mui/icons-material';
import { useHomePageStore, type HomePageModule } from '@/lib/homePageStore';
import { PickupsSection } from '@/components/DashboardModules/PickupsSection';
import SankeyChart from '@/components/DashboardModules/SankeyChart';
import DashboardLibraryModal from '@/components/DashboardModules/DashboardLibraryModal';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Recommendation {
  title: string;
  description: string;
  impact: string;
  roi: string;
}

export default function HomePage() {
  const [timeframe, setTimeframe] = useState('1m');
  const [showTrendline, setShowTrendline] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [deletedMetrics, setDeletedMetrics] = useState<string[]>(() => {
    const saved = localStorage.getItem('deleted-metrics');
    return saved ? JSON.parse(saved) : [];
  });
  const { visibleModules, toggleModule } = useHomePageStore();
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
        { i: 'metrics', x: 0, y: 0, w: 1, h: 1 },
        { i: 'impactMeter', x: 1, y: 0, w: 1, h: 1 },
        { i: 'sankey', x: 2, y: 0, w: 1, h: 1 },
        { i: 'goals', x: 0, y: 1, w: 1, h: 1 },
        { i: 'disposalAnalytics', x: 1, y: 1, w: 1, h: 1 },
        { i: 'trends', x: 2, y: 1, w: 1, h: 1 },
        { i: 'initiatives', x: 0, y: 2, w: 1, h: 1 },
        { i: 'leaderboard', x: 1, y: 2, w: 1, h: 1 },
        { i: 'pickups', x: 2, y: 2, w: 1, h: 1 }
      ]
    };
  });

  const onLayoutChange = (layout: any, layouts: any) => {
    setLayouts(layouts);
    // Save the new layout to localStorage
    localStorage.setItem('dashboard-layout', JSON.stringify(layouts));
  };

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/metrics/sustainability', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/sustainability/${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    }
  });

  const { data: disposalTrends = [], isLoading: trendsLoading } = useQuery<Array<{
    timestamp: string;
    total: number;
    recyclable: number;
    nonrecyclable: number;
  }>>({
    queryKey: ['/api/metrics/disposal-trends', timeframe],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/disposal-trends/${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch disposal trends');
      const data = await response.json();

      return data.history.wasteReduction.map((waste: any, index: number) => ({
        timestamp: new Date(waste.timestamp).toLocaleString(),
        total: parseFloat(waste.value),
        recyclable: parseFloat(data.history.recyclingRate[index].value) * parseFloat(waste.value) / 100,
        nonrecyclable: parseFloat(waste.value) * (1 - parseFloat(data.history.recyclingRate[index].value) / 100)
      }));
    }
  });

  const { data: carbonImpact } = useQuery<CarbonImpact>({
    queryKey: ['/api/carbon-impact/latest']
  });

  const { data: recommendations } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations']
  });

  const calculateMonthlyChange = (historicalData: any[]): number => {
    if (!historicalData || historicalData.length === 0) return 0;

    // Sort data by timestamp
    const sortedData = [...historicalData].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Get the latest month's data
    const latestDate = new Date(sortedData[0].timestamp);
    const previousMonth = new Date(latestDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    // Filter data for current and previous month
    const currentMonthData = sortedData.filter(item => {
      const date = new Date(item.timestamp);
      return date.getMonth() === latestDate.getMonth() && date.getFullYear() === latestDate.getFullYear();
    });

    const previousMonthData = sortedData.filter(item => {
      const date = new Date(item.timestamp);
      return date.getMonth() === previousMonth.getMonth() && date.getFullYear() === previousMonth.getFullYear();
    });

    if (currentMonthData.length === 0 || previousMonthData.length === 0) return 0;

    // Calculate averages
    const currentAvg = currentMonthData.reduce((sum, item) => sum + parseFloat(item.value), 0) / currentMonthData.length;
    const previousAvg = previousMonthData.reduce((sum, item) => sum + parseFloat(item.value), 0) / previousMonthData.length;

    return ((currentAvg - previousAvg) / previousAvg) * 100;
  };

  const calculateCarbonScore = (impact: CarbonImpact): number => {
    if (!impact) return 0;
    const baseline = 100;
    const reductionImpact = Math.min((impact.wasteReduction / 150) * 30, 30);
    const savingsImpact = Math.min((impact.carbonSavings / 75) * 40, 40);
    const energyImpact = Math.min((impact.energySavings / 50) * 30, 30);
    return Math.round(Math.max(0, Math.min(100, baseline - (reductionImpact + savingsImpact + energyImpact))));
  };

  const getOptimizedData = (data: any[]) => {
    if (!data || data.length === 0) return [];

    let interval = 1; // Default interval (show all points)

    // Adjust interval based on timeframe
    switch (timeframe) {
      case '6m':
        interval = 3; // Show every 3rd point
        break;
      case '1y':
        interval = 6; // Show every 6th point
        break;
      default:
        interval = 1; // Show all points for shorter timeframes
    }

    return data.filter((_, index) => index % interval === 0);
  };

  const calculateTrendLines = (data: any[]) => {
    if (!data || data.length < 2) return [];

    const calculateTrend = (values: number[]) => {
      const xCoords = values.map((_, i) => i);
      const n = values.length;
      const sumX = xCoords.reduce((a, b) => a + b, 0);
      const sumY = values.reduce((a, b) => a + b, 0);
      const sumXY = xCoords.reduce((sum, x, i) => sum + x * values[i], 0);
      const sumXX = xCoords.reduce((sum, x) => sum + x * x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      return xCoords.map(x => slope * x + intercept);
    };

    const totalValues = data.map(d => d.total);
    const recyclableValues = data.map(d => d.recyclable);
    const nonrecyclableValues = data.map(d => d.nonrecyclable);

    const totalTrend = calculateTrend(totalValues);
    const recyclableTrend = calculateTrend(recyclableValues);
    const nonrecyclableTrend = calculateTrend(nonrecyclableValues);

    return data.map((d, i) => ({
      ...d,
      totalTrend: totalTrend[i],
      recyclableTrend: recyclableTrend[i],
      nonrecyclableTrend: nonrecyclableTrend[i]
    }));
  };

  const optimizedData = getOptimizedData(disposalTrends);
  const dataWithTrends = showTrendline ? calculateTrendLines(optimizedData) : optimizedData;

  const handleDeleteMetric = (metricKey: string, event: React.MouseEvent) => {
    // Prevent the drag behavior
    event.stopPropagation();
    
    // Add to deleted metrics
    const newDeleted = [...deletedMetrics, metricKey];
    setDeletedMetrics(newDeleted);
    localStorage.setItem('deleted-metrics', JSON.stringify(newDeleted));
    
    // Remove the module from visibleModules
    toggleModule(metricKey as HomePageModule);
    
    // Force a re-render by updating the layout
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter((item: { i: string }) => item.i !== metricKey);
    });
    setLayouts(newLayouts);
    localStorage.setItem('dashboard-layout', JSON.stringify(newLayouts));
  };

  // Filter out deleted metrics from visible modules
  const filteredVisibleModules = visibleModules.filter(module => !deletedMetrics.includes(module));

  return (
    <Box sx={{ pt: 3 }} className="home-page">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Home
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton 
            size="small" 
            onClick={() => setIsLocked(!isLocked)}
            sx={{ 
              color: isLocked ? 'text.secondary' : 'primary.main',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            {isLocked ? <LockIcon fontSize="medium" /> : <LockOpenIcon fontSize="medium" />}
          </IconButton>
          <IconButton 
            size="small"
            onClick={() => setConfigVisible(true)}
            sx={{ 
              color: 'primary.main',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <TuneIcon fontSize="medium" />
          </IconButton>
        </Box>
      </Box>

      <Stack spacing={4}>
        <NotificationCenter />

        <Box sx={{ 
          width: '100%',
          '& .react-grid-item': {
            transition: 'all 200ms ease',
            transitionProperty: 'left, top',
            background: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 8,
            padding: 1,
            '&.react-grid-placeholder': {
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: 8,
            },
            '& .react-resizable-handle': {
              display: 'none',
            },
            '& > div': {
              height: '100%',
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              }
            }
          },
          '& .react-grid-layout': {
            background: 'transparent',
            position: 'relative',
          },
          '& .react-grid-item.react-draggable-dragging': {
            zIndex: 1,
            '& > div': {
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            }
          }
        }}>
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
            rowHeight={600}
            margin={[8, 8]}
            onLayoutChange={onLayoutChange}
            isDraggable={!isLocked}
            isResizable={false}
            useCSSTransforms={true}
            compactType={null}
          >
            {!deletedMetrics.includes('key-metrics') && (
              <div key="key-metrics">
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Key Metrics
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('key-metrics', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Waste Quantity
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1 }}>
                            {metrics?.wasteReduction?.toFixed(0) ?? '0'} kg
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Recycling Rate
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1 }}>
                            {metrics?.recyclingRate?.toFixed(1) ?? '0'}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Carbon Offset
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1 }}>
                            {metrics?.carbonFootprint?.toFixed(1) ?? '0'} tCO₂e
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Cost Savings
                          </Typography>
                          <Typography variant="h4" sx={{ mt: 1 }}>
                            ${metrics?.costSavings?.toFixed(0) ?? '0'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('metrics') && (
              <div key="metrics">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Metrics
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('metrics', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <MetricsSection 
                      isLocked={isLocked}
                      onDeleteMetric={handleDeleteMetric}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('impactMeter') && (
              <div key="impactMeter">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Impact Meter
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('impactMeter', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    {carbonImpact ? (
                      <WasteImpactMeter
                        carbonScore={calculateCarbonScore(carbonImpact)}
                        totalEmissions={metrics?.carbonFootprint ?? 0}
                        recyclingOffset={carbonImpact.wasteReduction}
                        netImpact={(metrics?.carbonFootprint ?? 0) - (carbonImpact.carbonSavings ?? 0)}
                        carbonOffset={carbonImpact.carbonSavings ?? 0}
                        waterSaved={carbonImpact.energySavings ?? 0}
                        airQualityImpact={100 - ((metrics?.carbonFootprint ?? 0) / 1000)}
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">Loading impact data...</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('sankey') && (
              <div key="sankey">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Sankey Chart
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('sankey', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <SankeyChart data={optimizedData} />
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('goals') && (
              <div key="goals">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Goals
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('goals', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <GoalTrackingSection />
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('disposalAnalytics') && (
              <div key="disposalAnalytics">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Disposal Analytics
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('disposalAnalytics', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">
                        Total Disposal Analytics
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showTrendline}
                              onChange={(e) => setShowTrendline(e.target.checked)}
                              color="primary"
                            />
                          }
                          label="Show Trend Line"
                        />
                        <FormControl sx={{ minWidth: 120 }} size="small">
                          <InputLabel>Timeframe</InputLabel>
                          <Select
                            value={timeframe}
                            label="Timeframe"
                            onChange={(e) => {
                              setTimeframe(e.target.value);
                            }}
                          >
                            <MenuItem value="1m">1 Month</MenuItem>
                            <MenuItem value="3m">3 Months</MenuItem>
                            <MenuItem value="6m">6 Months</MenuItem>
                            <MenuItem value="1y">1 Year</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ p: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Monthly Disposal Trends
                          </Typography>
                          <div style={{ width: '100%', height: 400 }}>
                            <ResponsiveContainer>
                              <LineChart data={dataWithTrends}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                  dataKey="timestamp"
                                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                  interval="preserveStartEnd"
                                />
                                <YAxis />
                                <Tooltip
                                  labelFormatter={(value) => new Date(value).toLocaleString()}
                                  formatter={(value: number, name: string) => {
                                    if (!name.includes('Trend')) {
                                      return [value.toFixed(2), 'kg'];
                                    }
                                    return ['', ''];
                                  }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="total"
                                  name="Total Waste"
                                  stroke="#1890ff"
                                  strokeWidth={2}
                                  dot={{ r: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="recyclable"
                                  name="Recyclable"
                                  stroke="#52c41a"
                                  strokeWidth={2}
                                  dot={{ r: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="nonrecyclable"
                                  name="Non-Recyclable"
                                  stroke="#f5222d"
                                  strokeWidth={2}
                                  dot={{ r: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                                {showTrendline && (
                                  <>
                                    <Line
                                      type="linear"
                                      dataKey="totalTrend"
                                      name="Total Trend"
                                      stroke="#722ed1"
                                      strokeWidth={2}
                                      dot={false}
                                      activeDot={false}
                                      legendType="none"
                                    />
                                    <Line
                                      type="linear"
                                      dataKey="recyclableTrend"
                                      name="Recyclable Trend"
                                      stroke="#13c2c2"
                                      strokeWidth={2}
                                      dot={false}
                                      activeDot={false}
                                      legendType="none"
                                    />
                                    <Line
                                      type="linear"
                                      dataKey="nonrecyclableTrend"
                                      name="Non-Recyclable Trend"
                                      stroke="#fa8c16"
                                      strokeWidth={2}
                                      dot={false}
                                      activeDot={false}
                                      legendType="none"
                                    />
                                  </>
                                )}
                                <Legend />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          {trendsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Typography>Loading trends data...</Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stack spacing={2}>
                          <Paper
                            elevation={3}
                            sx={{
                              p: 2,
                              background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%)',
                              border: '1px solid rgba(24, 144, 255, 0.2)',
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="subtitle2" color="text.secondary">
                              Total Disposal Cost
                            </Typography>
                            <Typography variant="h4">
                              ${metrics?.costSavings?.toFixed(2) ?? '0.00'}
                            </Typography>
                            {metrics?.history?.costSavings && (
                              <Typography
                                variant="body2"
                                color={calculateMonthlyChange(metrics.history.costSavings) >= 0 ? "error.main" : "success.main"}
                                sx={{ mt: 1 }}
                              >
                                {Math.abs(calculateMonthlyChange(metrics.history.costSavings)).toFixed(1)}% {calculateMonthlyChange(metrics.history.costSavings) >= 0 ? "increase" : "decrease"} from last period
                              </Typography>
                            )}
                          </Paper>
                          <Paper
                            elevation={3}
                            sx={{
                              p: 2,
                              background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%)',
                              border: '1px solid rgba(82, 196, 26, 0.2)',
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="subtitle2" color="text.secondary">
                              Recycling Rate
                            </Typography>
                            <Typography variant="h4">
                              {metrics?.recyclingRate?.toFixed(1) ?? '0.0'}%
                            </Typography>
                            {metrics?.history?.recyclingRate && (
                              <Typography
                                variant="body2"
                                color={calculateMonthlyChange(metrics.history.recyclingRate) >= 0 ? "success.main" : "error.main"}
                                sx={{ mt: 1 }}
                              >
                                {Math.abs(calculateMonthlyChange(metrics.history.recyclingRate)).toFixed(1)}% {calculateMonthlyChange(metrics.history.recyclingRate) >= 0 ? "increase" : "decrease"} from last period
                              </Typography>
                            )}
                          </Paper>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('trends') && (
              <div key="trends">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Trends
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('trends', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <TrendsSection chartConfigs={trendChartConfigs} />
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('initiatives') && (
              <div key="initiatives">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Initiatives
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('initiatives', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <CircularInitiativesSection />
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('leaderboard') && (
              <div key="leaderboard">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Leaderboard
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('leaderboard', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <SustainabilityLeaderboard />
                  </CardContent>
                </Card>
              </div>
            )}
            {filteredVisibleModules.includes('pickups') && (
              <div key="pickups">
                <Card sx={{ 
                  height: '100%', 
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Upcoming Pickups
                      </Typography>
                      {!isLocked && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleDeleteMetric('pickups', e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    <PickupsSection upcomingPickups={upcomingPickups} />
                  </CardContent>
                </Card>
              </div>
            )}
          </ResponsiveGridLayout>
        </Box>
      </Stack>

      <DashboardLibraryModal
        open={configVisible}
        onClose={() => setConfigVisible(false)}
        visibleModules={visibleModules}
        onToggleModule={toggleModule}
      />
    </Box>
  );
}

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
    color: '#2F54EB',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#ADC6FF 1:#2F54EB',
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
    color: '#52C41A',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#B7EB8F 1:#52C41A',
    },
  },
  carbon: {
    data: [
      { date: '2024-01', value: 450, type: 'Carbon' },
      { date: '2024-02', value: 420, type: 'Carbon' },
      { date: '2024-03', value: 380, type: 'Carbon' },
      { date: '2024-04', value: 350, type: 'Carbon' },
      { date: '2024-05', value: 310, type: 'Carbon' },
    ],
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    smooth: true,
    color: '#F5222D',
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#FFA39E 1:#F5222D',
    },
  }
};

const upcomingPickups = [
  {
    id: '1',
    date: '2024-04-25',
    type: 'General Waste',
    status: 'scheduled',
    location: 'Main Building'
  },
  {
    id: '2',
    date: '2024-04-26',
    type: 'Recycling',
    status: 'scheduled',
    location: 'Warehouse'
  }
];