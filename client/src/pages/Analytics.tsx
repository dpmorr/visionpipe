import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Alert,
  Container,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsBuilder } from '@/components/AnalyticsBuilder/AnalyticsBuilder';

interface MetricsResponse {
  wasteReduction: number;
  recyclingRate: number;
  carbonFootprint: number;
  costSavings: number;
  vendorPerformance: number;
  history: {
    wasteReduction: Array<{ timestamp: string; value: number }>;
    recyclingRate: Array<{ timestamp: string; value: number }>;
    carbonFootprint: Array<{ timestamp: string; value: number }>;
    costSavings: Array<{ timestamp: string; value: number }>;
    vendorPerformance: Array<{ timestamp: string; value: number }>;
  };
  wastePoints: Array<{
    id: string;
    processStep: string;
    wasteType: string;
    metrics: Record<string, Array<{ timestamp: string; value: number }>>;
  }>;
}

export default function Analytics() {
  // Fetch available metrics
  const { data: availableMetrics = [] } = useQuery<string[]>({
    queryKey: ['/api/metrics/available'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/available');
      if (!response.ok) throw new Error('Failed to fetch available metrics');
      return response.json();
    }
  });

  // Fetching sustainability metrics
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery<MetricsResponse>({
    queryKey: ['/api/metrics/sustainability', '24h'],
    queryFn: async () => {
      console.log('🔍 Fetching sustainability metrics');
      try {
        const response = await fetch('/api/metrics/sustainability/24h');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch metrics: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log('📊 Received metrics data:', data);
        return data;
      } catch (error) {
        console.error('❌ Error fetching metrics:', error);
        throw error;
      }
    },
    staleTime: 30000
  });

  const { data: carbonImpact, isLoading: carbonLoading, error: carbonError } = useQuery({
    queryKey: ['/api/carbon-impact/latest'],
    retry: 2,
  });

  if (metricsError || carbonError) {
    console.error('Analytics Errors:', { metricsError, carbonError });
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load analytics data. Please try again later.
        </Alert>
        {process.env.NODE_ENV === 'development' && (
          <Alert severity="info">
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({ metricsError, carbonError }, null, 2)}
            </pre>
          </Alert>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100%',
      p: 3  // This adds 24px padding (3 * 8px = 24px in MUI's spacing system)
    }}>
      <AnalyticsBuilder 
        metricsData={metricsData} 
        carbonImpact={carbonImpact} 
        metricsLoading={metricsLoading} 
        carbonLoading={carbonLoading} 
        metricsError={metricsError as Error | null} 
        carbonError={carbonError as Error | null}
      />
    </Box>
  );
}