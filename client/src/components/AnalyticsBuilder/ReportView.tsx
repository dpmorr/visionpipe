import { Box, Typography, Paper, Grid, Divider } from '@mui/material';
import { ChartWidget } from './ChartWidget';
import { AIAnalysisWidget } from './AIAnalysisWidget';
import Logo from '@/components/Logo';
import { useQuery } from '@tanstack/react-query';

interface ReportViewProps {
  report: {
    id: string;
    title: string;
    description: string;
    charts: string[];
    analyses: string[];
    schedule?: string;
  };
  charts: any[];
  analyses: any[];
}

export function ReportView({ report, charts, analyses }: ReportViewProps) {
  const selectedCharts = charts.filter(chart => report.charts.includes(chart.title));
  const selectedAnalyses = analyses.filter(analysis => report.analyses.includes(analysis.type));

  const { data: reportSettings } = useQuery({
    queryKey: ['/api/organization/report-settings'],
    queryFn: async () => {
      const response = await fetch('/api/organization/report-settings');
      if (!response.ok) return null;
      return response.json();
    }
  });

  return (
    <Box sx={{ p: 4, maxWidth: '100%', position: 'relative' }}>
      {/* Compliro Watermark */}
      {reportSettings?.includeWatermark && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-30deg)',
            opacity: reportSettings?.watermarkOpacity || 0.1,
            pointerEvents: 'none',
            zIndex: 0
          }}
        >
          <Logo height={200} />
        </Box>
      )}

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Box sx={{
          display: 'flex',
          justifyContent: reportSettings?.headerAlignment || 'left',
          alignItems: 'center',
          mb: 4
        }}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: reportSettings?.headerAlignment || 'left', mb: 3 }}>
              {reportSettings?.companyLogo && (
                <img
                  src={`/uploads/company-logos/${reportSettings.companyLogo}`}
                  alt="Company Logo"
                  style={{
                    height: 60,
                    width: 'auto'
                  }}
                />
              )}
            </Box>

            {reportSettings?.companyName && (
              <Typography variant="h6" gutterBottom>
                {reportSettings.companyName}
              </Typography>
            )}

            {reportSettings?.companyAddress && (
              <Typography variant="body2" color="text.secondary">
                {reportSettings.companyAddress}
              </Typography>
            )}

            {(reportSettings?.companyContact || reportSettings?.companyWebsite) && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {reportSettings.companyContact && reportSettings.companyContact}
                {reportSettings.companyContact && reportSettings.companyWebsite && ' • '}
                {reportSettings.companyWebsite && reportSettings.companyWebsite}
              </Typography>
            )}

            <Typography variant="h4" sx={{ mt: 2 }}>{report.title}</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {report.description}
            </Typography>
            {reportSettings?.includeTimestamp && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Generated on: {new Date().toLocaleDateString()}
                {report.schedule && ` • Schedule: ${report.schedule}`}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Charts Section */}
        {selectedCharts.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Key Metrics</Typography>
            <Grid container spacing={3}>
              {selectedCharts.map((chart) => (
                <Grid item xs={12} md={6} key={chart.id}>
                  <Paper sx={{ height: '400px' }}>
                    <ChartWidget config={chart} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Analysis Section */}
        {selectedAnalyses.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Analysis & Insights</Typography>
            <Grid container spacing={3}>
              {selectedAnalyses.map((analysis) => (
                <Grid item xs={12} key={analysis.id}>
                  <Paper sx={{ p: 3 }}>
                    <AIAnalysisWidget config={analysis} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 4 }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {reportSettings?.footerText || 'Generated by Compliro Sustainability Management Platform'}
          </Typography>
          {reportSettings?.includePagination && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Page 1 of 1
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}