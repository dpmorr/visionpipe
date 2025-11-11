import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Stack,
  Button,
} from '@mui/material';
import { Line, Bar, Pie, Area } from '@ant-design/plots';

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  dataKey: string;
  timeframe: string;
  aggregation: 'sum' | 'average' | 'max' | 'min';
}

interface ChartBuilderProps {
  onSave: (config: ChartConfig) => void;
  availableMetrics: string[];
}

export function ChartBuilder({ onSave, availableMetrics }: ChartBuilderProps) {
  const [config, setConfig] = useState<ChartConfig>({
    type: 'line',
    title: '',
    dataKey: '',
    timeframe: '7d',
    aggregation: 'sum',
  });

  const chartTypes = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'area', label: 'Area Chart' },
  ];

  const timeframes = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  const aggregations = [
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'max', label: 'Maximum' },
    { value: 'min', label: 'Minimum' },
  ];

  const handleSave = () => {
    if (!config.title || !config.dataKey) return;
    console.log('Saving chart config:', config);
    onSave(config);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">Configure Chart</Typography>

          <TextField
            label="Chart Title"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            fullWidth
            required
          />

          <FormControl fullWidth required>
            <InputLabel>Chart Type</InputLabel>
            <Select
              value={config.type}
              label="Chart Type"
              onChange={(e) => setConfig({ ...config, type: e.target.value as ChartConfig['type'] })}
            >
              {chartTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Data Metric</InputLabel>
            <Select
              value={config.dataKey}
              label="Data Metric"
              onChange={(e) => setConfig({ ...config, dataKey: e.target.value })}
            >
              {availableMetrics.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric.replace(/_/g, ' ').toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={config.timeframe}
              label="Timeframe"
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value })}
            >
              {timeframes.map((timeframe) => (
                <MenuItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Aggregation</InputLabel>
            <Select
              value={config.aggregation}
              label="Aggregation"
              onChange={(e) => setConfig({ ...config, aggregation: e.target.value as ChartConfig['aggregation'] })}
            >
              {aggregations.map((agg) => (
                <MenuItem key={agg.value} value={agg.value}>
                  {agg.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!config.title || !config.dataKey}
          >
            Add Chart
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}