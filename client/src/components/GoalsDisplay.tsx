import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  LinearProgress,
  Box,
  alpha,
  useTheme
} from '@mui/material';
import { Trophy as TrophyIcon } from 'lucide-react';

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

export function GoalsDisplay() {
  const theme = useTheme();

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['/api/goals'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Card
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <TrophyIcon />
          <Typography variant="h6">Current Goals</Typography>
        </Stack>

        <Stack spacing={2}>
          {goals.length === 0 ? (
            <Typography color="text.secondary">
              No goals set yet. Click the "Set New Goal" button to create your first goal.
            </Typography>
          ) : (
            goals.map((goal: Goal) => (
              <Card
                key={goal.id}
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Stack spacing={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                        {goal.type.replace('_', ' ')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {goal.description}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1">
                      {goal.currentPercentage}% / {goal.targetPercentage}%
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={Number(goal.currentPercentage)}
                    color={
                      goal.status === 'completed' ? 'success' :
                      goal.status === 'in_progress' ? 'primary' : 'error'
                    }
                    sx={{ height: 8, borderRadius: 1 }}
                  />

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ typography: 'body2', color: 'text.secondary' }}
                  >
                    <span>Start: {formatDate(goal.startDate)}</span>
                    <span>Target: {formatDate(goal.endDate)}</span>
                  </Stack>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}