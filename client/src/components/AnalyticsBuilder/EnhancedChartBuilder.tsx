import { useState, useEffect } from 'react';
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
  Grid,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  DataObject as DataObjectIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as BubbleChartIcon,
  ScatterPlot as ScatterPlotIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';
import { Line, Bar, Pie, Area, Scatter, Column } from '@ant-design/plots';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';

interface DataSource {
  id: string;
  name: string;
  type: 'waste' | 'circular' | 'optimization' | 'custom';
  data: any[];
}

interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'table';
  title: string;
  dataSource: string;
  dimensions: string[];
  measures: string[];
  filters: {
    field: string;
    operator: string;
    value: any;
  }[];
  sort: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
  timeframe: string;
  aggregation: 'sum' | 'average' | 'max' | 'min' | 'count';
  visualization: {
    colors?: string[];
    showLegend?: boolean;
    showLabels?: boolean;
    showGrid?: boolean;
    showAxis?: boolean;
  };
}

interface EnhancedChartBuilderProps {
  onSave: (config: ChartConfig) => void;
  onClose: () => void;
}

export function EnhancedChartBuilder({ onSave, onClose }: EnhancedChartBuilderProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [config, setConfig] = useState<ChartConfig>({
    type: 'line',
    title: '',
    dataSource: '',
    dimensions: [],
    measures: [],
    filters: [],
    sort: [],
    timeframe: '7d',
    aggregation: 'sum',
    visualization: {
      showLegend: true,
      showLabels: true,
      showGrid: true,
      showAxis: true,
    },
  });

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Fetch available data sources
  const { data: wasteData } = useQuery({
    queryKey: ['/api/waste-points'],
    queryFn: async () => {
      const response = await fetch('/api/waste-points');
      if (!response.ok) throw new Error('Failed to fetch waste data');
      return response.json();
    },
  });

  const { data: circularData } = useQuery({
    queryKey: ['/api/circular-data'],
    queryFn: async () => {
      const response = await fetch('/api/circular-data');
      if (!response.ok) throw new Error('Failed to fetch circular data');
      return response.json();
    },
  });

  const { data: optimizationData } = useQuery({
    queryKey: ['/api/optimization-data'],
    queryFn: async () => {
      const response = await fetch('/api/optimization-data');
      if (!response.ok) throw new Error('Failed to fetch optimization data');
      return response.json();
    },
  });

  useEffect(() => {
    const sources: DataSource[] = [
      {
        id: 'waste',
        name: 'Waste Data',
        type: 'waste',
        data: wasteData || [],
      },
      {
        id: 'circular',
        name: 'Circular Data',
        type: 'circular',
        data: circularData || [],
      },
      {
        id: 'optimization',
        name: 'Optimization Data',
        type: 'optimization',
        data: optimizationData || [],
      },
    ];
    setDataSources(sources);
  }, [wasteData, circularData, optimizationData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        const newSource: DataSource = {
          id: `custom-${Date.now()}`,
          name: file.name,
          type: 'custom',
          data: jsonData,
        };

        setDataSources(prev => [...prev, newSource]);
        setConfig(prev => ({ ...prev, dataSource: newSource.id }));
        setIsUploadDialogOpen(false);
      } catch (error) {
        console.error('Error processing file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSave = () => {
    if (!config.title || !config.dataSource || config.measures.length === 0) return;
    onSave(config);
  };

  const selectedDataSource = dataSources.find(ds => ds.id === config.dataSource);
  const availableFields = selectedDataSource?.data[0] 
    ? Object.keys(selectedDataSource.data[0])
    : [];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Data" />
          <Tab label="Visualization" />
          <Tab label="Style" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 && (
          <Stack spacing={3}>
            <TextField
              label="Chart Title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Data Source</InputLabel>
              <Select
                value={config.dataSource}
                label="Data Source"
                onChange={(e) => setConfig({ ...config, dataSource: e.target.value })}
              >
                {dataSources.map((source) => (
                  <MenuItem key={source.id} value={source.id}>
                    {source.name}
                  </MenuItem>
                ))}
                <Divider />
                <MenuItem onClick={() => setIsUploadDialogOpen(true)}>
                  <UploadIcon sx={{ mr: 1 }} />
                  Upload Custom Data
                </MenuItem>
              </Select>
            </FormControl>

            {selectedDataSource && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Dimensions</InputLabel>
                  <Select
                    multiple
                    value={config.dimensions}
                    label="Dimensions"
                    onChange={(e) => setConfig({ ...config, dimensions: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {availableFields.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth required>
                  <InputLabel>Measures</InputLabel>
                  <Select
                    multiple
                    value={config.measures}
                    label="Measures"
                    onChange={(e) => setConfig({ ...config, measures: e.target.value as string[] })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {availableFields.map((field) => (
                      <MenuItem key={field} value={field}>
                        {field}
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
                    <MenuItem value="sum">Sum</MenuItem>
                    <MenuItem value="average">Average</MenuItem>
                    <MenuItem value="max">Maximum</MenuItem>
                    <MenuItem value="min">Minimum</MenuItem>
                    <MenuItem value="count">Count</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={3}>
            <Typography variant="subtitle1">Chart Type</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: config.type === 'line' ? '2px solid' : '1px solid',
                    borderColor: config.type === 'line' ? 'primary.main' : 'divider',
                    bgcolor: config.type === 'line' ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setConfig({ ...config, type: 'line' })}
                >
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <LineChartIcon color={config.type === 'line' ? 'primary' : 'inherit'} />
                      <Typography color={config.type === 'line' ? 'primary' : 'inherit'}>Line Chart</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: config.type === 'bar' ? '2px solid' : '1px solid',
                    borderColor: config.type === 'bar' ? 'primary.main' : 'divider',
                    bgcolor: config.type === 'bar' ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setConfig({ ...config, type: 'bar' })}
                >
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <BarChartIcon color={config.type === 'bar' ? 'primary' : 'inherit'} />
                      <Typography color={config.type === 'bar' ? 'primary' : 'inherit'}>Bar Chart</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: config.type === 'pie' ? '2px solid' : '1px solid',
                    borderColor: config.type === 'pie' ? 'primary.main' : 'divider',
                    bgcolor: config.type === 'pie' ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setConfig({ ...config, type: 'pie' })}
                >
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <PieChartIcon color={config.type === 'pie' ? 'primary' : 'inherit'} />
                      <Typography color={config.type === 'pie' ? 'primary' : 'inherit'}>Pie Chart</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: config.type === 'scatter' ? '2px solid' : '1px solid',
                    borderColor: config.type === 'scatter' ? 'primary.main' : 'divider',
                    bgcolor: config.type === 'scatter' ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setConfig({ ...config, type: 'scatter' })}
                >
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <ScatterPlotIcon color={config.type === 'scatter' ? 'primary' : 'inherit'} />
                      <Typography color={config.type === 'scatter' ? 'primary' : 'inherit'}>Scatter Plot</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: config.type === 'table' ? '2px solid' : '1px solid',
                    borderColor: config.type === 'table' ? 'primary.main' : 'divider',
                    bgcolor: config.type === 'table' ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setConfig({ ...config, type: 'table' })}
                >
                  <CardContent>
                    <Stack alignItems="center" spacing={1}>
                      <TableChartIcon color={config.type === 'table' ? 'primary' : 'inherit'} />
                      <Typography color={config.type === 'table' ? 'primary' : 'inherit'}>Table</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={3}>
            <FormControl>
              <Typography variant="subtitle1" gutterBottom>
                Chart Options
              </Typography>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.visualization.showLegend}
                      onChange={(e) => setConfig({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          showLegend: e.target.checked,
                        },
                      })}
                    />
                  }
                  label="Show Legend"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.visualization.showLabels}
                      onChange={(e) => setConfig({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          showLabels: e.target.checked,
                        },
                      })}
                    />
                  }
                  label="Show Labels"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.visualization.showGrid}
                      onChange={(e) => setConfig({
                        ...config,
                        visualization: {
                          ...config.visualization,
                          showGrid: e.target.checked,
                        },
                      })}
                    />
                  }
                  label="Show Grid"
                />
              </Stack>
            </FormControl>
          </Stack>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!config.title || !config.dataSource || config.measures.length === 0}
            startIcon={<SaveIcon />}
          >
            Save Chart
          </Button>
        </Stack>
      </Box>

      <Dialog open={isUploadDialogOpen} onClose={() => setIsUploadDialogOpen(false)}>
        <DialogTitle>Upload Custom Data</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
              >
                Choose File
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 