import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Sync as SyncIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

// Interface definitions remain the same
interface CircularInitiative {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'planning';
  startDate?: string;
  targetDate?: string;
  budget?: number;
  estimatedImpact?: {
    wasteReduction: number;
    costSavings: number;
    carbonReduction: number;
  };
}

export function CircularInitiativesSection() {
  const { data: initiatives, error, isLoading } = useQuery<CircularInitiative[]>({
    queryKey: ['/api/initiatives', { category: 'circular' }],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Grid container spacing={2}>
            {[1, 2, 3].map((index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ height: 24, width: '60%', bgcolor: 'grey.200', borderRadius: 1 }} />
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Box sx={{ height: 16, width: '100%', bgcolor: 'grey.200', borderRadius: 1 }} />
                      </Box>
                      <Box>
                        <Box sx={{ height: 16, width: '75%', bgcolor: 'grey.200', borderRadius: 1 }} />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">
            Failed to load circular initiatives. Please try again later.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!initiatives?.length) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">
            No circular initiatives found. Create new initiatives in the Project Management section.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: CircularInitiative['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'in_progress':
        return <SyncIcon color="primary" />;
      default:
        return <ScheduleIcon color="warning" />;
    }
  };

  const getStatusColor = (status: CircularInitiative['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      default:
        return 'warning';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon />
          <Typography variant="h6">Circular Economy Initiatives</Typography>
        </Box>

        <Grid container spacing={2}>
          {initiatives.map((initiative) => (
            <Grid item xs={12} sm={6} md={4} key={initiative.id}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {initiative.title}
                      </Typography>
                      <Chip
                        label={initiative.status.replace('_', ' ')}
                        color={getStatusColor(initiative.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      {initiative.description}
                    </Typography>

                    <Box>
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={initiative.progress}
                          color={getStatusColor(initiative.status)}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            bgcolor: 'grey.100',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 1,
                            }
                          }}
                        />
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Tooltip title={initiative.status}>
                          <IconButton size="small">
                            {getStatusIcon(initiative.status)}
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {initiative.progress}% Complete
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}