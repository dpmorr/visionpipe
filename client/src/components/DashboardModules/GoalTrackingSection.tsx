import { Card, CardContent, CardHeader, Typography, Box, LinearProgress, Chip, IconButton, Tooltip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrackChanges as AimIcon,
  EmojiEvents as TrophyIcon 
} from '@mui/icons-material';

interface Goal {
  id: number;
  type: string;
  description: string;
  targetPercentage: number;
  currentPercentage: number;
  startDate: string;
  endDate: string;
  status: 'completed' | 'in_progress' | 'failed';
}

export function GoalTrackingSection() {
  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals']
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ScheduleIcon color="error" />;
      default:
        return <AimIcon color="primary" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'primary' | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in_progress':
        return 'primary';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <TrophyIcon />
            <Typography variant="h6">Sustainability Goals</Typography>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {goals.map((goal) => (
            <Box key={goal.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Tooltip title={goal.status}>
                    <IconButton size="small">
                      {getStatusIcon(goal.status)}
                    </IconButton>
                  </Tooltip>
                  <Box>
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {goal.type.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {goal.description}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Due: {formatDate(goal.endDate)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={goal.currentPercentage}
                    color={getStatusColor(goal.status)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box sx={{ minWidth: 100 }}>
                  <Typography variant="body2" color="text.secondary" align="right">
                    {goal.currentPercentage}% / {goal.targetPercentage}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default GoalTrackingSection;