import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Paper,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface DisposalTrendsProps {
  timeframe?: string;
}

export function DisposalTrendsSection({ timeframe: initialTimeframe = '1m' }: DisposalTrendsProps) {
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [showTrendline, setShowTrendline] = useState(false);

  const { data: disposalTrends = [], isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/metrics/disposal-trends', timeframe],
    queryFn: async () => {
      console.log('Fetching disposal trends for timeframe:', timeframe);
      const response = await fetch(`/api/metrics/disposal-trends/${timeframe}`);
      if (!response.ok) throw new Error('Failed to fetch disposal trends');
      const data = await response.json();

      // Transform the historical data for the chart
      const transformedData = data.history.wasteReduction.map((waste: any, index: number) => ({
        timestamp: new Date(waste.timestamp).toLocaleString(),
        total: parseFloat(waste.value),
        recyclable: parseFloat(data.history.recyclingRate[index].value) * parseFloat(waste.value) / 100,
        nonrecyclable: parseFloat(waste.value) * (1 - parseFloat(data.history.recyclingRate[index].value) / 100)
      }));

      console.log('Transformed disposal trends:', transformedData);
      return transformedData;
    }
  });

  const { data: metrics } = useQuery({
    queryKey: ['/api/metrics/sustainability', timeframe]
  });

  // Calculate monthly change
  const calculateMonthlyChange = (historicalData: any[]): number => {
    if (!historicalData || historicalData.length === 0) return 0;

    const sortedData = [...historicalData].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const latestDate = new Date(sortedData[0].timestamp);
    const previousMonth = new Date(latestDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);

    const currentMonthData = sortedData.filter(item => {
      const date = new Date(item.timestamp);
      return date.getMonth() === latestDate.getMonth() && date.getFullYear() === latestDate.getFullYear();
    });

    const previousMonthData = sortedData.filter(item => {
      const date = new Date(item.timestamp);
      return date.getMonth() === previousMonth.getMonth() && date.getFullYear() === previousMonth.getFullYear();
    });

    if (currentMonthData.length === 0 || previousMonthData.length === 0) return 0;

    const currentAvg = currentMonthData.reduce((sum, item) => sum + parseFloat(item.value), 0) / currentMonthData.length;
    const previousAvg = previousMonthData.reduce((sum, item) => sum + parseFloat(item.value), 0) / previousMonthData.length;

    return ((currentAvg - previousAvg) / previousAvg) * 100;
  };

  // Function to optimize data points based on timeframe
  const getOptimizedData = (data: any[]) => {
    if (!data || data.length === 0) return [];

    let interval = 1;
    switch (timeframe) {
      case '6m':
        interval = 3;
        break;
      case '1y':
        interval = 6;
        break;
      default:
        interval = 1;
    }

    return data.filter((_, index) => index % interval === 0);
  };

  // Calculate trend lines
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

  return (
    <Card>
      <CardContent>
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
                onChange={(e) => setTimeframe(e.target.value)}
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
                          name="Total"
                          stroke="#722ed1"
                          strokeWidth={2}
                          dot={false}
                          activeDot={false}
                          legendType="none"
                        />
                        <Line
                          type="linear"
                          dataKey="recyclableTrend"
                          name="Recyclable"
                          stroke="#13c2c2"
                          strokeWidth={2}
                          dot={false}
                          activeDot={false}
                          legendType="none"
                        />
                        <Line
                          type="linear"
                          dataKey="nonrecyclableTrend"
                          name="Non-Recyclable"
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
                  ${metrics?.costSavings?.toFixed(2) || '0.00'}
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
                  {metrics?.recyclingRate?.toFixed(1)}%
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
  );
}
