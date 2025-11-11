import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Dialog,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ChartBuilder } from './ChartBuilder';
import { AIAnalysisBuilder } from './AIAnalysisBuilder';
import { ReportBuilder } from './ReportBuilder';
import { ChartWidget } from './ChartWidget';
import { AIAnalysisWidget } from './AIAnalysisWidget';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReportView } from './ReportView';
import { LibraryPanel } from '../LibraryPanel';
import { EnhancedChartBuilder } from './EnhancedChartBuilder';

interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  dataKey: string;
  timeframe: string;
  aggregation: 'sum' | 'average' | 'max' | 'min';
  isStandard?: boolean;
}

interface AIAnalysisConfig {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'forecast';
  metrics: string[];
  timeframe: string;
  description: string;
  schedule?: string;
  isStandard?: boolean;
}

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  charts: string[];
  analyses: string[];
  schedule?: 'daily' | 'weekly' | 'monthly';
  isStandard?: boolean;
}

interface AnalyticsBuilderProps {
  metricsData: any;
  carbonImpact: any;
  metricsLoading: boolean;
  carbonLoading: boolean;
  metricsError: Error | null;
  carbonError: Error | null;
}

interface SavedConfig {
  id: number;
  type: string;
  name: string;
  config: any;
  active: boolean;
  is_standard: boolean | 't' | 'f';
  schedule?: string;
}

export function AnalyticsBuilder({
  metricsData,
  carbonImpact,
  metricsLoading,
  carbonLoading,
  metricsError,
  carbonError
}: AnalyticsBuilderProps) {
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState(0);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderType, setBuilderType] = useState<'chart' | 'analysis' | 'report'>('chart');

  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [analyses, setAnalyses] = useState<AIAnalysisConfig[]>([]);
  const [reports, setReports] = useState<ReportConfig[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportConfig | null>(null);
  const [isReportViewOpen, setIsReportViewOpen] = useState(false);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data: availableMetrics = [] } = useQuery({
    queryKey: ['/api/metrics/available'],
    queryFn: async () => {
      console.log('Fetching available metrics...');
      const response = await fetch('/api/metrics/available');
      if (!response.ok) throw new Error('Failed to fetch available metrics');
      const data = await response.json();
      console.log('Available metrics:', data);
      return data;
    }
  });

  const { data: savedConfigs } = useQuery({
    queryKey: ['/api/analytics/configs'],
    queryFn: async () => {
      console.log('Fetching analytics configurations...');
      const response = await fetch('/api/analytics/configs');
      if (!response.ok) throw new Error('Failed to fetch configurations');
      const data = await response.json();
      console.log('API Response data:', JSON.stringify(data, null, 2));
      return data;
    }
  });

  useEffect(() => {
    if (savedConfigs) {
      console.log('Raw savedConfigs:', savedConfigs);

      const transformedCharts = (savedConfigs.charts || []).map((config: SavedConfig) => {
        console.log('Raw chart config with is_standard:', config, config.is_standard);
        const chartConfig = {
          id: String(config.id),
          type: config.config.type || config.config.chartType || 'line',
          title: config.name,
          dataKey: config.config.metrics?.[0] || '',
          timeframe: config.config.timeframe || '1m',
          aggregation: config.config.aggregation || 'sum',
          isStandard: config.is_standard === true || config.is_standard === 't',
          visualization: config.config.visualization || {
            showLegend: true,
            showLabels: true,
            showGrid: true,
            showAxis: true
          }
        };
        console.log('Transformed chart config:', chartConfig);
        return chartConfig;
      });

      const transformedAnalyses = (savedConfigs.analyses || []).map((config: SavedConfig) => {
        console.log('Raw analysis config with is_standard:', config, config.is_standard);
        const analysisConfig = {
          id: String(config.id),
          type: config.config.type || 'trend',
          metrics: config.config.metrics || [],
          timeframe: config.config.timeframe || '1m',
          description: config.name || '',
          schedule: config.schedule,
          isStandard: config.is_standard === true || config.is_standard === 't'
        };
        console.log('Transformed analysis config:', analysisConfig);
        return analysisConfig;
      });

      const transformedReports = (savedConfigs.reports || []).map((config: SavedConfig) => {
        console.log('Raw report config with is_standard:', config, config.is_standard);
        const reportConfig = {
          id: String(config.id),
          title: config.name,
          description: config.config.description || '',
          charts: config.config.charts || [],
          analyses: config.config.analyses || [],
          schedule: config.config.schedule,
          isStandard: config.is_standard === true || config.is_standard === 't'
        };
        console.log('Transformed report config:', reportConfig);
        return reportConfig;
      });

      console.log('Final transformed configurations:', {
        charts: transformedCharts,
        analyses: transformedAnalyses,
        reports: transformedReports
      });

      setCharts(transformedCharts);
      setAnalyses(transformedAnalyses);
      setReports(transformedReports);
    }
  }, [savedConfigs]);

  const saveConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      console.log('Saving configuration:', config);
      const response = await fetch('/api/analytics/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      const data = await response.json();
      console.log('Configuration saved:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/configs'] });
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting configuration:', id);
      const response = await fetch(`/api/analytics/configs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete configuration');
      const data = await response.json();
      console.log('Configuration deleted:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/configs'] });
    },
  });

  const handleAddItem = () => {
    setIsBuilderOpen(true);
  };

  const handleRemoveItem = async (id: string, type: 'chart' | 'analysis' | 'report') => {
    const item = (() => {
      switch (type) {
        case 'chart':
          return charts.find(c => c.id === id);
        case 'analysis':
          return analyses.find(a => a.id === id);
        case 'report':
          return reports.find(r => r.id === id);
      }
    })();

    if (item?.isStandard) {
      console.log('Cannot delete standard item');
      return;
    }

    try {
      await deleteConfigMutation.mutateAsync(id);

      switch (type) {
        case 'chart':
          setCharts(prev => prev.filter(item => item.id !== id));
          break;
        case 'analysis':
          setAnalyses(prev => prev.filter(item => item.id !== id));
          break;
        case 'report':
          setReports(prev => prev.filter(item => item.id !== id));
          break;
      }
    } catch (error) {
      console.error('Failed to delete configuration:', error);
    }
  };

  const handleSaveItem = async (config: any) => {
    try {
      console.log('Saving config:', config);
      const newConfig = {
        type: builderType,
        name: config.title || config.description || 'Untitled Configuration',
        config: {
          ...(builderType === 'chart' && {
            type: config.type || 'line',
            chartType: config.type || 'line',
            metrics: config.measures || [config.dataKey],
            timeframe: config.timeframe || '1m',
            aggregation: config.aggregation || 'sum',
            title: config.title,
            visualization: config.visualization || {
              showLegend: true,
              showLabels: true,
              showGrid: true,
              showAxis: true
            }
          }),
          ...(builderType === 'analysis' && {
            type: config.type,
            metrics: config.metrics,
            timeframe: config.timeframe,
            description: config.description
          }),
          ...(builderType === 'report' && {
            description: config.description,
            charts: config.charts || [],
            analyses: config.analyses || [],
            schedule: config.schedule
          })
        },
        active: true,
        is_standard: false
      };

      console.log('Saving new configuration:', newConfig);
      const savedConfig = await saveConfigMutation.mutateAsync(newConfig);
      console.log('Configuration saved with response:', savedConfig);

      // Transform the saved config to match our frontend format
      const transformedConfig = {
        id: String(savedConfig.id),
        type: savedConfig.config.type || savedConfig.config.chartType || 'line',
        title: savedConfig.name,
        dataKey: savedConfig.config.metrics?.[0] || '',
        timeframe: savedConfig.config.timeframe || '1m',
        aggregation: savedConfig.config.aggregation || 'sum',
        isStandard: savedConfig.is_standard === true || savedConfig.is_standard === 't',
        visualization: savedConfig.config.visualization || {
          showLegend: true,
          showLabels: true,
          showGrid: true,
          showAxis: true
        }
      };

      // Update the appropriate state based on the type
      switch (builderType) {
        case 'chart':
          setCharts(prev => [...prev, transformedConfig]);
          break;
        case 'analysis':
          setAnalyses(prev => [...prev, {
            id: String(savedConfig.id),
            type: savedConfig.config.type,
            metrics: savedConfig.config.metrics || [],
            timeframe: savedConfig.config.timeframe || '1m',
            description: savedConfig.name,
            schedule: savedConfig.schedule,
            isStandard: savedConfig.is_standard === true || savedConfig.is_standard === 't'
          }]);
          break;
        case 'report':
          setReports(prev => [...prev, {
            id: String(savedConfig.id),
            title: savedConfig.name,
            description: savedConfig.config.description || '',
            charts: savedConfig.config.charts || [],
            analyses: savedConfig.config.analyses || [],
            schedule: savedConfig.config.schedule,
            isStandard: savedConfig.is_standard === true || savedConfig.is_standard === 't'
          }]);
          break;
      }

      setIsBuilderOpen(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100vh' }}>
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        bgcolor: 'white'
      }}>
        <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
          <Tab label="Charts" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      <Box sx={{
        display: 'flex',
        height: 'calc(100% - 48px)',
        overflow: 'hidden'
      }}>
        <LibraryPanel
          items={currentTab === 0
            ? charts.map(c => {
              console.log('Chart mapping:', { id: c.id, title: c.title, isStandard: c.isStandard });
              return {
                id: c.id,
                title: c.title,
                type: c.type,
                description: `${c.type} chart tracking ${c.dataKey}`,
                isStandard: c.isStandard
              };
            })
            : reports.map(r => {
              console.log('Report mapping:', { id: r.id, title: r.title, isStandard: r.isStandard });
              return {
                id: r.id,
                title: r.title,
                type: 'report',
                description: r.description,
                schedule: r.schedule,
                isStandard: r.isStandard
              };
            })
          }
          selectedItemId={currentTab === 0 ? selectedChartId : selectedReportId}
          onItemSelect={(item) => {
            if (currentTab === 0) setSelectedChartId(item.id);
            else setSelectedReportId(item.id);
          }}
          type={currentTab === 0 ? 'chart' : 'report'}
        />

        <Box sx={{
          flex: 1,
          p: 3,
          overflowY: 'auto',
          bgcolor: 'background.default'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">
              {currentTab === 0 ? 'Chart View' : 'Report View'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setBuilderType(currentTab === 0 ? 'chart' : 'report');
                handleAddItem();
              }}
            >
              Add {currentTab === 0 ? 'Chart' : 'Report'}
            </Button>
          </Stack>

          {currentTab === 0 && selectedChartId && (
            <Paper sx={{ height: '600px', position: 'relative' }}>
              {!charts.find(c => c.id === selectedChartId)?.isStandard && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                  onClick={() => handleRemoveItem(selectedChartId, 'chart')}
                >
                  <DeleteIcon />
                </IconButton>
              )}
              <ChartWidget config={charts.find(c => c.id === selectedChartId)!} />
            </Paper>
          )}

          {currentTab === 1 && selectedReportId && (
            <Paper sx={{ p: 3, position: 'relative' }}>
              {!reports.find(r => r.id === selectedReportId)?.isStandard && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                  onClick={() => handleRemoveItem(selectedReportId, 'report')}
                >
                  <DeleteIcon />
                </IconButton>
              )}
              <ReportView
                report={reports.find(r => r.id === selectedReportId)!}
                charts={charts}
                analyses={[]}
              />
            </Paper>
          )}

          {!selectedChartId && !selectedReportId && (
            <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 10 }}>
              Select an item from the library or create a new one
            </Typography>
          )}
        </Box>
      </Box>

      <Dialog
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Add New {builderType === 'chart' ? 'Chart' : builderType === 'analysis' ? 'Analysis' : 'Report'}
          </Typography>
          {builderType === 'chart' && (
            <EnhancedChartBuilder
              onSave={handleSaveItem}
              onClose={() => setIsBuilderOpen(false)}
            />
          )}
          {builderType === 'analysis' && (
            <AIAnalysisBuilder
              onSave={handleSaveItem}
              availableMetrics={availableMetrics}
            />
          )}
          {builderType === 'report' && (
            <ReportBuilder
              onSave={handleSaveItem}
              availableCharts={charts.map(c => c.title)}
              availableAnalyses={analyses.map(a => a.type)}
            />
          )}
        </Box>
      </Dialog>

      <Dialog
        open={isReportViewOpen}
        onClose={() => setIsReportViewOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        {selectedReport && (
          <ReportView
            report={selectedReport}
            charts={charts}
            analyses={analyses}
          />
        )}
      </Dialog>
    </Box>
  );
}