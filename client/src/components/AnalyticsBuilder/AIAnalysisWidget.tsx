import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button, Stack, IconButton, Menu, MenuItem } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Refresh as RefreshIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { useState } from 'react';

interface AIAnalysisConfig {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast';
  metrics: string[];
  timeframe: string;
  description: string;
  schedule?: string;
}

interface AIAnalysisWidgetProps {
  config: AIAnalysisConfig;
}

export function AIAnalysisWidget({ config }: AIAnalysisWidgetProps) {
  const [scheduleAnchor, setScheduleAnchor] = useState<null | HTMLElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/metrics/analyze', config],
    queryFn: async () => {
      console.log('Fetching analysis for config:', config);
      const response = await fetch('/api/metrics/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: config.type,
          metrics: config.metrics,
          timeframe: config.timeframe,
        }),
      });
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const data = await response.json();
      console.log('Received analysis data:', data);
      return data;
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (schedule: string) => {
      const response = await fetch(`/api/analytics/config/${config.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schedule }),
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/analyze', config] });
    },
  });

  const handleScheduleChange = (schedule: string) => {
    updateScheduleMutation.mutate(schedule);
    setScheduleAnchor(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={() => refetch()}>
          Retry
        </Button>
      }>
        Failed to load analysis. Please try again.
      </Alert>
    );
  }

  if (!data?.analysis) {
    return (
      <Alert severity="info">
        No analysis available for the selected metrics and timeframe.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {config.type.charAt(0).toUpperCase() + config.type.slice(1)} Analysis
          </Typography>
          <Box>
            <IconButton onClick={() => refetch()} title="Refresh Analysis">
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={(e) => setScheduleAnchor(e.currentTarget)} title="Schedule Refresh">
              <ScheduleIcon />
            </IconButton>
          </Box>
        </Stack>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          {config.description}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" component="pre" sx={{ 
            whiteSpace: 'pre-wrap',
            fontFamily: 'inherit',
            my: 2
          }}>
            {data.analysis}
          </Typography>

          {data.recommendations && data.recommendations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Recommendations:
              </Typography>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {data.recommendations.map((rec: string, index: number) => (
                  <li key={index}>
                    <Typography variant="body2" sx={{ mb: 1 }}>{rec}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}

          {data.visualData && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Analysis Details:
              </Typography>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {JSON.stringify(data.visualData, null, 2)}
              </pre>
            </Box>
          )}
        </Box>

        <Menu
          anchorEl={scheduleAnchor}
          open={Boolean(scheduleAnchor)}
          onClose={() => setScheduleAnchor(null)}
        >
          <MenuItem onClick={() => handleScheduleChange('hourly')}>Hourly</MenuItem>
          <MenuItem onClick={() => handleScheduleChange('daily')}>Daily</MenuItem>
          <MenuItem onClick={() => handleScheduleChange('weekly')}>Weekly</MenuItem>
          <MenuItem onClick={() => handleScheduleChange('none')}>Don't Schedule</MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}