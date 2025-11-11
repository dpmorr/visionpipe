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

interface ReportConfig {
  title: string;
  description: string;
  charts: string[];
  analyses: string[];
  schedule?: 'daily' | 'weekly' | 'monthly';
}

interface ReportBuilderProps {
  onSave: (config: ReportConfig) => void;
  availableCharts: string[];
  availableAnalyses: string[];
}

export function ReportBuilder({ onSave, availableCharts, availableAnalyses }: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    title: '',
    description: '',
    charts: [],
    analyses: [],
    schedule: 'weekly',
  });

  const scheduleOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={3}>
          <Typography variant="h6">Configure Report</Typography>

          <TextField
            label="Report Title"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            fullWidth
          />

          <TextField
            label="Report Description"
            multiline
            rows={3}
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Include Charts</InputLabel>
            <Select
              multiple
              value={config.charts}
              label="Include Charts"
              onChange={(e) => setConfig({ ...config, charts: typeof e.target.value === 'string' ? [e.target.value] : e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {availableCharts.map((chart) => (
                <MenuItem key={chart} value={chart}>
                  {chart}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Include Analyses</InputLabel>
            <Select
              multiple
              value={config.analyses}
              label="Include Analyses"
              onChange={(e) => setConfig({ ...config, analyses: typeof e.target.value === 'string' ? [e.target.value] : e.target.value })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {availableAnalyses.map((analysis) => (
                <MenuItem key={analysis} value={analysis}>
                  {analysis}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Schedule</InputLabel>
            <Select
              value={config.schedule}
              label="Schedule"
              onChange={(e) => setConfig({ ...config, schedule: e.target.value as 'daily' | 'weekly' | 'monthly' })}
            >
              {scheduleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button 
            variant="contained" 
            onClick={() => onSave(config)}
            disabled={!config.title || (!config.charts.length && !config.analyses.length)}
          >
            Create Report
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
