import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  FileCopy as ReconciliationIcon,
  Recycling as SyncIcon,
  Cloud as CloudIcon,
  AttachMoney as DollarIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  FileDownload as FileDownloadIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useToast } from "@/hooks/use-toast";

interface MetricData {
  wasteReduction: number;
  recyclingRate: number;
  carbonFootprint: number;
  costSavings: number;
  vendorPerformance: number;
  goalProgress: number;
  history: Record<string, Array<{ timestamp: string; value: number }>>;
}

// Define which metrics should be summed vs averaged
const summedMetrics = ['wasteReduction', 'carbonFootprint', 'costSavings'];

const calculateMetricValue = (
  data: MetricData | undefined, 
  metricKey: keyof MetricData, 
  timeframe: string,
  defaultValue: number
): number => {
  if (!data || !data.history || !data.history[metricKey]) return defaultValue;

  const now = new Date();
  const timeframeInHours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 24h, 7d (7*24), or 30d (30*24)
  const cutoffTime = new Date(now.getTime() - (timeframeInHours * 60 * 60 * 1000));

  // Filter values within the selected timeframe
  const filteredValues = data.history[metricKey]
    .filter(item => new Date(item.timestamp) >= cutoffTime)
    .map(item => item.value);

  if (summedMetrics.includes(metricKey)) {
    // Sum for quantity metrics
    return filteredValues.reduce((sum, value) => sum + value, 0);
  } else {
    // Average for rate/percentage metrics
    return filteredValues.length > 0 
      ? filteredValues.reduce((sum, value) => sum + value, 0) / filteredValues.length 
      : defaultValue;
  }
};

interface Metric {
  metricKey: keyof MetricData;
  title: string;
  defaultValue: number;
  unit?: string;
  icon: React.ReactNode;
  background: string;
  analyticsPath: string;
}

const metrics: Metric[] = [
  {
    metricKey: 'wasteReduction',
    title: 'Waste Quantity',
    defaultValue: 0,
    unit: 'kg',
    icon: <ReconciliationIcon />,
    background: 'linear-gradient(135deg, #37b5fe 0%, #0094e5 100%)',
    analyticsPath: '/analytics/waste-reduction',
  },
  {
    metricKey: 'recyclingRate',
    title: 'Recycling Rate',
    defaultValue: 0,
    unit: '%',
    icon: <SyncIcon />,
    background: 'linear-gradient(135deg, #37b5fe 0%, #0094e5 100%)',
    analyticsPath: '/analytics/recycling',
  },
  {
    metricKey: 'carbonFootprint',
    title: 'Carbon Quantity',
    defaultValue: 0,
    unit: 'tons',
    icon: <CloudIcon />,
    background: 'linear-gradient(135deg, #37b5fe 0%, #0094e5 100%)',
    analyticsPath: '/analytics/carbon',
  },
  {
    metricKey: 'costSavings',
    title: 'Costs',
    defaultValue: 0,
    unit: '$',
    icon: <DollarIcon />,
    background: 'linear-gradient(135deg, #37b5fe 0%, #0094e5 100%)',
    analyticsPath: '/analytics/cost-savings',
  },
];

const MetricCard: React.FC<{
  metricKey: keyof MetricData;
  title: string;
  defaultValue: number;
  unit?: string;
  icon: React.ReactNode;
  background: string;
  analyticsPath: string;
  isLocked: boolean;
  onDelete?: () => void;
}> = ({
  metricKey,
  title,
  defaultValue,
  unit,
  icon,
  background,
  analyticsPath,
  isLocked,
  onDelete
}) => {
  const { toast } = useToast();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [metricsTimeframe, setMetricsTimeframe] = useState('24h');
  const open = Boolean(anchorEl);

  const { data: metricsData, isLoading, isError, refetch } = useQuery<MetricData>({
    queryKey: ['/api/metrics/sustainability', metricsTimeframe],
    queryFn: async () => {
      console.log(`🔍 Fetching sustainability metrics for timeframe: ${metricsTimeframe}`);
      try {
        const response = await fetch(`/api/metrics/sustainability/${metricsTimeframe}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('📊 Received metrics data:', {
          timeframe: metricsTimeframe,
          data: data,
          metricKey: metricKey,
          value: data[metricKey]
        });
        return data;
      } catch (error) {
        console.error('❌ Error fetching metrics:', error);
        throw error;
      }
    },
    staleTime: 30000
  });

  const currentValue = calculateMetricValue(metricsData, metricKey, metricsTimeframe, defaultValue);
  const historyData = metricsData?.history?.[metricKey] || [];

  // Filter history data for chart based on timeframe
  const now = new Date();
  const timeframeInHours = metricsTimeframe === '24h' ? 24 : metricsTimeframe === '7d' ? 168 : 720;
  const cutoffTime = new Date(now.getTime() - (timeframeInHours * 60 * 60 * 1000));
  const filteredHistoryData = historyData.filter(item => new Date(item.timestamp) >= cutoffTime);

  return (
    <Card
      sx={{
        height: '100%',
        background,
        color: 'white',
        '& .MuiCardHeader-action': {
          margin: 0
        },
        position: 'relative'
      }}
    >
      {!isLocked && onDelete && (
        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      )}
      <CardHeader
        action={
          <>
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              aria-label="card options"
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem disabled>
                <FilterIcon sx={{ mr: 1 }} /> Timeframe
              </MenuItem>
              <MenuItem onClick={() => { setMetricsTimeframe('24h'); setAnchorEl(null); }}>
                Last 24 hours {metricsTimeframe === '24h' && "✓"}
              </MenuItem>
              <MenuItem onClick={() => { setMetricsTimeframe('7d'); setAnchorEl(null); }}>
                Last 7 days {metricsTimeframe === '7d' && "✓"}
              </MenuItem>
              <MenuItem onClick={() => { setMetricsTimeframe('30d'); setAnchorEl(null); }}>
                Last 30 days {metricsTimeframe === '30d' && "✓"}
              </MenuItem>
              <MenuItem component={Link} to={analyticsPath}>
                <AnalyticsIcon sx={{ mr: 1 }} /> Detailed Analysis
              </MenuItem>
              <MenuItem onClick={() => {
                refetch();
                setAnchorEl(null);
                toast({
                  title: "Refreshing data",
                  description: "Fetching latest metrics...",
                });
              }}>
                <RefreshIcon sx={{ mr: 1 }} /> Refresh Data
              </MenuItem>
            </Menu>
          </>
        }
        title={
          <Box display="flex" alignItems="center" gap={1}>
            {icon}
            <Typography variant="h6" sx={{ color: 'white', m: 0 }}>
              {title}
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}>
            <Typography>Loading...</Typography>
          </Box>
        ) : isError ? (
          <Typography color="error">Failed to load metrics</Typography>
        ) : (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h3" sx={{ color: 'white', mb: 0.5 }}>
                {currentValue?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {unit && (
                  <Typography component="span" variant="body2" sx={{ ml: 1 }}>{unit}</Typography>
                )}
              </Typography>
              <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                Last {metricsTimeframe === '24h' ? '24 hours' : metricsTimeframe === '7d' ? '7 days' : '30 days'}
              </Typography>
            </Box>
            <Box sx={{ height: 60, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredHistoryData}>
                  <defs>
                    <linearGradient id={`sparkline-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#sparkline-${metricKey})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface MetricsSectionProps {
  isLocked?: boolean;
  onDeleteMetric?: (metricKey: string, event: React.MouseEvent) => void;
  isPreview?: boolean;
}

export const MetricsSection: React.FC<MetricsSectionProps> = ({ 
  isLocked = false, 
  onDeleteMetric,
  isPreview = false 
}) => {
  const [metricsState, setMetricsState] = useState<Metric[]>(metrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('week');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deletedMetrics, setDeletedMetrics] = useState<string[]>(() => {
    const saved = localStorage.getItem('deleted-metrics');
    return saved ? JSON.parse(saved) : [];
  });

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleExport = () => {
    // Implement export handler
    handleMenuClose();
  };

  const handleRefresh = () => {
    // Implement refresh handler
    handleMenuClose();
  };

  const handleDelete = (metricKey: string) => {
    setDeletedMetrics(prev => [...prev, metricKey]);
    onDeleteMetric?.(metricKey, {} as React.MouseEvent);
  };

  const filteredMetrics = metricsState.filter(metric => !deletedMetrics.includes(metric.metricKey));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Key Metrics
        </Typography>
        <Box>
          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleExport}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleRefresh}>
              <ListItemIcon>
                <RefreshIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Refresh</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {filteredMetrics.map((metric) => (
          <Grid item xs={6} key={metric.metricKey}>
            <MetricCard
              metricKey={metric.metricKey}
              title={metric.title}
              defaultValue={metric.defaultValue}
              unit={metric.unit}
              icon={metric.icon}
              background={metric.background}
              analyticsPath={metric.analyticsPath}
              isLocked={isLocked}
              onDelete={() => handleDelete(metric.metricKey)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};