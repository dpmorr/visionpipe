import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Stack,
  LinearProgress,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Alert,
  AlertTitle,
  FormControl,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  PlayCircle as PlayCircleIcon,
  Refresh as RefreshIcon,
  LightbulbOutlined as LightbulbIcon,
  AddCircle as AddCircleIcon,
  AccessTime as ClockIcon,
  AttachMoney as DollarIcon,
  FlashOn as FlashOnIcon,
  Description as FileTextIcon,
  Group as UsersIcon,
  BarChart as BarChartIcon,
  Loop as LoopIcon,
} from '@mui/icons-material';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import PageHeader from '@/components/PageHeader';
import { CircularInitiativesSection } from '@/components/CircularInitiativesSection';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

// Enhanced sparkline settings
const sparklineSettings = {
  height: 60,
  showTooltip: true,
  showHighlight: true,
  colors: ['#1976d2'],
  curve: "natural" as const,
  title: "Progress Trend",
  sx: {
    '& .MuiChartsAxis-line': {
      display: 'none',
    },
    '& .MuiChartsAxis-tick': {
      display: 'none',
    },
    '& .MuiLineElement-root': {
      strokeWidth: 2,
    },
    '& .MuiChartsLegend-mark': {
      display: 'none',
    },
    '& .MuiChartsLegend-label': {
      fontSize: '12px',
    }
  }
};

// Sample sparkline data
const sparklineData = [400, 300, 500, 350, 450, 569];

interface Recommendation {
  title: string;
  description: string;
  impact: string;
  category: string;
  timeframe: string;
  roi: string;
}

// Initial recommendations remain the same
const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    title: "Implement Material Sorting System",
    description: "Establish a comprehensive sorting system for different types of recyclable materials using color-coded bins and clear signage.",
    impact: "High",
    category: "Recycling",
    timeframe: "1-2 months",
    roi: "Medium",
  },
  {
    title: "Partner with Local Recyclers",
    description: "Build relationships with specialized recycling facilities to ensure proper handling of specific materials.",
    impact: "Medium",
    category: "Partnerships",
    timeframe: "2-3 months",
    roi: "High",
  },
  {
    title: "Waste-to-Resource Program",
    description: "Convert organic waste into compost or energy through biodigestion.",
    impact: "High",
    category: "Circular Economy",
    timeframe: "3-6 months",
    roi: "High",
  },
];

function RecyclingCircular() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [convertingTitle, setConvertingTitle] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(INITIAL_RECOMMENDATIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState('Environmental');

  // Mutation to generate new recommendations using OpenAI
  const generateRecommendationMutation = useMutation({
    mutationFn: async () => {
      const requests = Array(3).fill(null).map(async () => {
        const response = await fetch('/api/generate-recommendation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to generate recommendation');
        }

        return response.json() as Promise<Recommendation>;
      });

      return Promise.all(requests);
    },
    onSuccess: (newRecommendations) => {
      if (newRecommendations && newRecommendations.length) {
        setRecommendations(newRecommendations);
        toast({
          title: "Success",
          description: "Generated new recommendations successfully"
        });
      }
      setIsRefreshing(false);
    },
    onError: (error) => {
      console.error('Error generating new recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to generate new recommendations",
        variant: "destructive"
      });
      setIsRefreshing(false);
    }
  });

  const createInitiativeMutation = useMutation({
    mutationFn: async (recommendation: Recommendation) => {
      const startDate = new Date();
      const targetDate = new Date();
      const timeframeMonths = parseInt(recommendation.timeframe.split('-')[1]);
      targetDate.setMonth(targetDate.getMonth() + timeframeMonths);

      const response = await fetch('/api/initiatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: recommendation.title,
          description: recommendation.description,
          category: recommendation.category.toLowerCase(),
          status: 'planning',
          startDate: startDate.toISOString(),
          targetDate: targetDate.toISOString(),
          estimatedImpact: {
            wasteReduction: recommendation.impact === 'High' ? 1000 : 500,
            costSavings: recommendation.roi === 'High' ? 10000 : 5000,
            carbonReduction: recommendation.impact === 'High' ? 2000 : 1000
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.details || 'Failed to create initiative');
      }

      return response.json();
    },
    onSuccess: (_, recommendation) => {
      setRecommendations(prev => prev.filter(r => r.title !== recommendation.title));
      queryClient.invalidateQueries({ queryKey: ['/api/initiatives'] });
      generateRecommendationMutation.mutate();

      toast({
        title: "Success",
        description: "Recommendation converted to initiative successfully"
      });
      setConvertingTitle(null);
    },
    onError: (error) => {
      console.error('Error creating initiative:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to convert recommendation to initiative",
        variant: "destructive"
      });
      setConvertingTitle(null);
    }
  });

  const handleConvertToInitiative = (recommendation: Recommendation) => {
    setConvertingTitle(recommendation.title);
    createInitiativeMutation.mutate(recommendation);
  };

  const handleRefreshRecommendations = () => {
    setIsRefreshing(true);
    generateRecommendationMutation.mutate();
  };

  const renderEnvironmentalView = () => (
    <>
      {/* Performance Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <LoopIcon color="primary" />
              <Typography variant="h6">Environmental Impact</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>75%</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Recycling Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={75}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                  <SparkLineChart data={sparklineData} {...sparklineSettings} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>82%</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Material Recovery
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={82}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                  <SparkLineChart data={sparklineData} {...sparklineSettings} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>8%</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Contamination Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={8}
                    color="error"
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                  <SparkLineChart data={sparklineData} {...sparklineSettings} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card sx={{ mb: 3 }} variant="outlined">
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <LightbulbIcon color="primary" />
              <Typography variant="h6">Environmental Recommendations</Typography>
            </Stack>
          }
          action={
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefreshRecommendations}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            {recommendations.map((item) => (
              <Alert
                key={item.title}
                severity={item.impact === 'High' ? 'success' : 'info'}
                icon={false}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <AlertTitle>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {item.title}
                        <Chip
                          label={`${item.impact} Impact`}
                          color={item.impact === 'High' ? 'success' : 'primary'}
                          size="small"
                        />
                        <Chip
                          label={item.category}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </AlertTitle>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.description}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        size="small"
                        icon={<ClockIcon />}
                        label={`Timeline: ${item.timeframe}`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        icon={<DollarIcon />}
                        label={`ROI: ${item.roi}`}
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                  <Button
                    startIcon={<AddCircleIcon />}
                    onClick={() => handleConvertToInitiative(item)}
                    disabled={convertingTitle === item.title}
                    variant="outlined"
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    Convert
                  </Button>
                </Stack>
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );

  const renderEconomicView = () => (
    <>
      {/* Economic Performance Card */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <DollarIcon color="primary" />
              <Typography variant="h6">Economic Impact</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>$45K</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cost Savings
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={75}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                  <SparkLineChart data={sparklineData} {...sparklineSettings} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>$28K</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Revenue Generated
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={82}
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                  <SparkLineChart data={sparklineData} {...sparklineSettings} />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" gutterBottom>3.2x</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    ROI
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    color="success"
                    sx={{
                      height: 8,
                      borderRadius: 1,
                      mb: 2
                    }}
                  />
                  <SparkLineChart data={sparklineData} {...sparklineSettings} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Economic Recommendations Card */}
      <Card sx={{ mb: 3 }} variant="outlined">
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <LightbulbIcon color="primary" />
              <Typography variant="h6">Economic Opportunities</Typography>
            </Stack>
          }
          action={
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefreshRecommendations}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          <Stack spacing={2}>
            {recommendations.map((item) => (
              <Alert
                key={item.title}
                severity={item.roi === 'High' ? 'success' : 'info'}
                icon={false}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <AlertTitle>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {item.title}
                        <Chip
                          label={`${item.roi} ROI`}
                          color={item.roi === 'High' ? 'success' : 'primary'}
                          size="small"
                        />
                        <Chip
                          label={item.category}
                          variant="outlined"
                          size="small"
                        />
                      </Stack>
                    </AlertTitle>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {item.description}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip
                        size="small"
                        icon={<ClockIcon />}
                        label={`Timeline: ${item.timeframe}`}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        icon={<DollarIcon />}
                        label={`Impact: ${item.impact}`}
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                  <Button
                    startIcon={<AddCircleIcon />}
                    onClick={() => handleConvertToInitiative(item)}
                    disabled={convertingTitle === item.title}
                    variant="outlined"
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    Convert
                  </Button>
                </Stack>
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </>
  );

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Recycling & Circular Economy"
        subtitle="Recommendations and initiatives for sustainable resource management"
      />

      {/* View Selector */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3, 
          p: 2, 
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <FormControl sx={{ minWidth: 300 }}>
          <Select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            displayEmpty
            sx={{ 
              bgcolor: 'background.paper',
              '& .MuiSelect-select': {
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 500
              },
            }}
          >
            <MenuItem value="Environmental">Environmental View</MenuItem>
            <MenuItem value="Economic">Economic View</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {selectedView === 'Environmental' ? renderEnvironmentalView() : renderEconomicView()}

      {/* Initiatives Section */}
      <CircularInitiativesSection />

      {/* Quick Actions Card */}
      <Card variant="outlined">
        <CardHeader
          title={
            <Stack direction="row" spacing={1} alignItems="center">
              <FlashOnIcon color="primary" />
              <Typography variant="h6">Quick Actions</Typography>
            </Stack>
          }
        />
        <CardContent>
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<FileTextIcon />}
              variant="outlined"
            >
              Download Guide
            </Button>
            <Button
              startIcon={<UsersIcon />}
              variant="outlined"
            >
              Schedule Training
            </Button>
            <Button
              startIcon={<BarChartIcon />}
              variant="outlined"
            >
              View Analytics
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RecyclingCircular;