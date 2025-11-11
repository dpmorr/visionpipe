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
  Stack,
  Button,
  Typography,
  Chip,
} from '@mui/material';

interface AIAnalysisConfig {
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast';
  metrics: string[];
  timeframe: string;
  description: string;
}

interface AIAnalysisBuilderProps {
  onSave: (config: AIAnalysisConfig) => void;
  availableMetrics: string[];
}

export function AIAnalysisBuilder({ onSave, availableMetrics }: AIAnalysisBuilderProps) {
  const [config, setConfig] = useState<AIAnalysisConfig>({
    type: 'trend',
    metrics: [],
    timeframe: '7d',
    description: '',
  });

  const analysisTypes = [
    { value: 'trend', label: 'Trend Analysis' },
    { value: 'anomaly', label: 'Anomaly Detection' },
    { value: 'correlation', label: 'Correlation Analysis' },
    { value: 'forecast', label: 'Forecasting' },
  ];

  const timeframes = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">Configure AI Analysis</Typography>

          <FormControl fullWidth>
            <InputLabel>Analysis Type</InputLabel>
            <Select
              value={config.type}
              label="Analysis Type"
              onChange={(e) => setConfig({ ...config, type: e.target.value as AIAnalysisConfig['type'] })}
            >
              {analysisTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Select Metrics</InputLabel>
            <Select
              multiple
              value={config.metrics}
              label="Select Metrics"
              onChange={(e) => setConfig({ ...config, metrics: typeof e.target.value === 'string' ? [e.target.value] : e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
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
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value as string })}
            >
              {timeframes.map((timeframe) => (
                <MenuItem key={timeframe.value} value={timeframe.value}>
                  {timeframe.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Analysis Description"
            multiline
            rows={3}
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            fullWidth
          />

          <Button 
            variant="contained" 
            onClick={() => onSave(config)}
            disabled={!config.metrics.length || !config.description}
          >
            Add Analysis
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
