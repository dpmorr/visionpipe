import { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Divider, Chip, Stack, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  Button, CircularProgress,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SensorsIcon from '@mui/icons-material/Sensors';
import RouteIcon from '@mui/icons-material/Route';
import { useQuery, useMutation } from '@tanstack/react-query';
import RouteMapRenderer from '@/components/RouteMapRenderer';

interface WastePoint {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: string;
  unit: string;
  vendor: string;
  notes: string | null;
  locationData?: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
  sensor?: {
    id: number;
    name: string;
    type: string;
    location: string;
    lastReading?: number;
    lastReadingUnit?: string;
  } | null;
}

interface OptimizeResult {
  optimizedOrder: number[];
  orderedPoints: WastePoint[];
  polyline: string;
  distanceMiles: number;
  durationMinutes: number;
}

export default function StationsAnalyzer() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const { data: wastePoints = [], isLoading } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const pointsWithLocation = wastePoints.filter(
    p => p.locationData?.lat && p.locationData?.lng
  );

  // Group waste points by vendor (as a proxy for collection clusters)
  const clusters = useMemo(() => {
    const groups: Record<string, WastePoint[]> = {};
    pointsWithLocation.forEach(p => {
      const key = p.vendor || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [pointsWithLocation]);

  const clusterNames = Object.keys(clusters);

  const optimizeClusterMutation = useMutation({
    mutationFn: async (clusterName: string) => {
      const points = clusters[clusterName];
      if (!points || points.length < 2) {
        throw new Error('Need at least 2 stations to optimize');
      }

      const res = await fetch('/api/route-planning/optimize-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          wastePointIds: points.map(p => p.id),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Optimization failed');
      }
      return res.json() as Promise<OptimizeResult>;
    },
  });

  const handleOptimizeCluster = (name: string) => {
    setSelectedCluster(name);
    optimizeClusterMutation.mutate(name);
  };

  // Build map stops
  const displayPoints = selectedCluster
    ? (clusters[selectedCluster] || [])
    : pointsWithLocation;

  const result = optimizeClusterMutation.data;
  const mapStops = (result?.orderedPoints || displayPoints).map((p, i) => ({
    id: p.id,
    name: p.process_step,
    address: p.locationData?.address,
    lat: p.locationData!.lat,
    lng: p.locationData!.lng,
    order: i + 1,
    wasteType: p.wasteType,
    volume: p.estimatedVolume,
    unit: p.unit,
  }));

  const getFillLevel = (point: WastePoint): string => {
    if (point.sensor?.lastReading !== undefined && point.sensor?.lastReadingUnit) {
      return `${point.sensor.lastReading} ${point.sensor.lastReadingUnit}`;
    }
    return 'No sensor';
  };

  const getFillColor = (point: WastePoint): string => {
    if (!point.sensor?.lastReading) return 'default';
    const reading = point.sensor.lastReading;
    if (reading >= 80) return 'error';
    if (reading >= 50) return 'warning';
    return 'success';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Left panel: station list and clusters */}
      <Paper sx={{ flex: '0 0 480px', p: 2, maxHeight: '70vh', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Collection Stations
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          View all waste collection stations, sensor readings, and optimize collection
          routes by vendor group.
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {pointsWithLocation.length === 0 ? (
          <Alert severity="info">
            No waste points with location data found. Add locations to your waste points first.
          </Alert>
        ) : (
          <>
            {/* Cluster summary cards */}
            <Typography variant="subtitle2" gutterBottom>
              Vendor Groups ({clusterNames.length})
            </Typography>
            <Stack spacing={1} sx={{ mb: 2 }}>
              {clusterNames.map(name => {
                const points = clusters[name];
                const isActive = selectedCluster === name;
                return (
                  <Paper
                    key={name}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      bgcolor: isActive ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => setSelectedCluster(isActive ? null : name)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {points.length} station{points.length !== 1 ? 's' : ''}
                          {' | '}
                          {points.filter(p => p.sensor).length} with sensors
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RouteIcon />}
                        disabled={points.length < 2 || (optimizeClusterMutation.isPending && selectedCluster === name)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOptimizeCluster(name);
                        }}
                      >
                        {optimizeClusterMutation.isPending && selectedCluster === name
                          ? 'Optimizing...'
                          : 'Optimize'}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>

            {/* Optimization result */}
            {result && selectedCluster && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Optimized "{selectedCluster}": {result.distanceMiles} miles, {result.durationMinutes} min
              </Alert>
            )}

            {optimizeClusterMutation.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {(optimizeClusterMutation.error as Error).message}
              </Alert>
            )}

            {/* Station details table */}
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              {selectedCluster ? `${selectedCluster} Stations` : 'All Stations'}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Station</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Volume</TableCell>
                    <TableCell>Sensor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayPoints.map(point => (
                    <TableRow key={point.id}>
                      <TableCell>
                        <Typography variant="body2">{point.process_step}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {point.locationData?.address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={point.wasteType} size="small" />
                      </TableCell>
                      <TableCell>{point.estimatedVolume} {point.unit}</TableCell>
                      <TableCell>
                        {point.sensor ? (
                          <Chip
                            icon={<SensorsIcon />}
                            label={getFillLevel(point)}
                            size="small"
                            color={getFillColor(point) as any}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No sensor
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Right panel: map */}
      <Box sx={{ flex: 1, minHeight: 400 }}>
        <RouteMapRenderer
          stops={mapStops}
          encodedPolyline={result?.polyline}
          height="70vh"
        />
      </Box>
    </Box>
  );
}
