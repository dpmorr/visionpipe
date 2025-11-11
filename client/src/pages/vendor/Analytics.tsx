import { Box } from "@mui/material";
import { AnalyticsBuilder } from "@/components/AnalyticsBuilder/AnalyticsBuilder";

export default function VendorAnalytics() {
  return (
    <Box sx={{ 
      height: '100vh',
      width: '100%',
      bgcolor: 'background.default'
    }}>
      <AnalyticsBuilder
        metricsData={[]}
        carbonImpact={0}
        metricsLoading={false}
        carbonLoading={false}
        metricsError={null}
        carbonError={null}
      />
    </Box>
  );
}