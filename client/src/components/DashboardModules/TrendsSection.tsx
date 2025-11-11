import { Card, CardContent, CardHeader, Typography, Box, Grid, IconButton } from '@mui/material';
import { Area } from '@ant-design/plots';
import { LineChartOutlined, ReconciliationOutlined, SyncOutlined, DollarOutlined } from '@ant-design/icons';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';

interface ChartConfig {
  data: Array<{
    date: string;
    value: number;
    type: string;
  }>;
  xField: string;
  yField: string;
  seriesField: string;
  smooth: boolean;
  color: string;
  areaStyle: {
    fill: string;
  };
}

interface TrendsSectionProps {
  chartConfigs: {
    waste: ChartConfig;
    recycling: ChartConfig;
    carbon?: ChartConfig;
    cost?: ChartConfig;
  };
  isPreview?: boolean;
}

export function TrendsSection({ chartConfigs, isPreview = false }: TrendsSectionProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <LineChartOutlined style={{ fontSize: 24 }} />
            <Typography variant="h6">Sustainability Trends</Typography>
          </Box>
        }
        action={
          !isPreview && (
            <Box>
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Box>
          )
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" color="text.secondary">
                  Monthly Waste Reduction (kg)
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 1
                  }}
                >
                  Improving
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <Area {...chartConfigs.waste} />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" color="text.secondary">
                  Monthly Recycling Rate (%)
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'success.main',
                    color: 'success.contrastText',
                    borderRadius: 1
                  }}
                >
                  Peak Performance
                </Typography>
              </Box>
              <Box sx={{ height: 300 }}>
                <Area {...chartConfigs.recycling} />
              </Box>
            </Box>
          </Grid>
          {chartConfigs.carbon && (
            <Grid item xs={12}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Monthly Carbon Footprint (kgCO2e)
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      borderRadius: 1
                    }}
                  >
                    Reducing
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <Area {...chartConfigs.carbon} />
                </Box>
              </Box>
            </Grid>
          )}
          {chartConfigs.cost && (
            <Grid item xs={12}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Monthly Cost Savings ($)
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      bgcolor: 'warning.main',
                      color: 'warning.contrastText',
                      borderRadius: 1
                    }}
                  >
                    Increasing
                  </Typography>
                </Box>
                <Box sx={{ height: 300 }}>
                  <Area {...chartConfigs.cost} />
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}