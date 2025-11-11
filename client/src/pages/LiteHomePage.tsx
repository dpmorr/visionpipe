import { Box, Card, CardContent, Typography } from '@mui/material';
import { MetricsSection } from '@/components/DashboardModules/MetricsSection';
import { PickupsSection } from '@/components/DashboardModules/PickupsSection';
import { useQuery } from '@tanstack/react-query';
import { Line } from '@ant-design/plots';
import PageHeader from '@/components/PageHeader';

const upcomingPickups = [
  { date: '2024-01-15', type: 'General Waste', status: 'scheduled', quantity: '2.5 tons' },
  { date: '2024-01-18', type: 'Recyclables', status: 'pending', quantity: '1.8 tons' },
  { date: '2024-01-20', type: 'Hazardous', status: 'confirmed', quantity: '0.5 tons' },
  { date: '2024-01-22', type: 'Organic Waste', status: 'scheduled', quantity: '1.2 tons' },
];

export default function LiteHomePage() {
  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics/sustainability']
  });

  // Chart configuration for waste trends
  const trendChartConfig = {
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
  };

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your key sustainability metrics"
      />

      <Box sx={{ mt: 3 }}>
        <MetricsSection metrics={metrics} />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Waste Disposal Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Monitor your waste reduction progress over time
            </Typography>
            <Box sx={{ height: 400 }}>
              <Line {...trendChartConfig} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <PickupsSection pickups={upcomingPickups} />
      </Box>
    </Box>
  );
}