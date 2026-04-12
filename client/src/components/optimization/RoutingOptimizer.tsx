import { useState } from 'react';
import {
  Box, Typography, Button, Checkbox, FormControlLabel,
  TextField, Paper, CircularProgress, Alert, Divider,
  List, ListItem, ListItemText, ListItemIcon, Chip, Stack
} from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import PlaceIcon from '@mui/icons-material/Place';
import TimerIcon from '@mui/icons-material/Timer';
import StraightenIcon from '@mui/icons-material/Straighten';
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
}

interface OptimizeResult {
  optimizedOrder: number[];
  orderedPoints: WastePoint[];
  polyline: string;
  totalDistanceMeters: number;
  distanceMiles: number;
  totalDurationSeconds: number;
  durationMinutes: number;
}

export default function RoutingOptimizer() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [depotAddress, setDepotAddress] = useState('');
  const [depotLocation, setDepotLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: wastePoints = [] } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const pointsWithLocation = wastePoints.filter(
    p => p.locationData?.lat && p.locationData?.lng
  );

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/route-planning/optimize-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          wastePointIds: selectedIds,
          depot: depotLocation || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Optimization failed');
      }
      return res.json() as Promise<OptimizeResult>;
    },
  });

  const handleToggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === pointsWithLocation.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pointsWithLocation.map(p => p.id));
    }
  };

  const handleSetDepot = () => {
    if (!depotAddress || typeof google === 'undefined') return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: depotAddress }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        setDepotLocation({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  };

  const result = optimizeMutation.data;
  const mapStops = result
    ? result.orderedPoints.map((p, i) => ({
        id: p.id,
        name: p.process_step,
        address: p.locationData?.address,
        lat: p.locationData!.lat,
        lng: p.locationData!.lng,
        order: i + 1,
        wasteType: p.wasteType,
        volume: p.estimatedVolume,
        unit: p.unit,
      }))
    : pointsWithLocation
        .filter(p => selectedIds.includes(p.id))
        .map((p, i) => ({
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

  return (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Left panel: stop selection */}
      <Paper sx={{ flex: '0 0 360px', p: 2, maxHeight: '70vh', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          <RouteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Route Optimization
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select waste points to optimize the collection route order.
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Depot input */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Depot / Start Location</Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter depot address..."
              value={depotAddress}
              onChange={(e) => setDepotAddress(e.target.value)}
            />
            <Button variant="outlined" size="small" onClick={handleSetDepot}>
              Set
            </Button>
          </Stack>
          {depotLocation && (
            <Chip
              label={`Depot: ${depotLocation.lat.toFixed(4)}, ${depotLocation.lng.toFixed(4)}`}
              size="small"
              color="success"
              sx={{ mt: 0.5 }}
              onDelete={() => setDepotLocation(null)}
            />
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Stop selection */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">
            Stops ({selectedIds.length}/{pointsWithLocation.length})
          </Typography>
          <Button size="small" onClick={handleSelectAll}>
            {selectedIds.length === pointsWithLocation.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>

        {pointsWithLocation.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            No waste points with location data found. Add locations to your waste points first.
          </Alert>
        ) : (
          <List dense>
            {pointsWithLocation.map(point => (
              <ListItem key={point.id} disablePadding sx={{ mb: 0.5 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedIds.includes(point.id)}
                      onChange={() => handleToggle(point.id)}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{point.process_step}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {point.locationData?.address} - {point.wasteType}
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', ml: 0 }}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={selectedIds.length < 2 || optimizeMutation.isPending}
          onClick={() => optimizeMutation.mutate()}
          startIcon={optimizeMutation.isPending ? <CircularProgress size={16} /> : <RouteIcon />}
        >
          {optimizeMutation.isPending ? 'Optimizing...' : 'Optimize Route'}
        </Button>

        {optimizeMutation.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {(optimizeMutation.error as Error).message}
          </Alert>
        )}

        {/* Results summary */}
        {result && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>Optimization Results</Typography>
            <Stack spacing={1}>
              <Chip
                icon={<StraightenIcon />}
                label={`${result.distanceMiles} miles`}
                variant="outlined"
              />
              <Chip
                icon={<TimerIcon />}
                label={`${result.durationMinutes} min`}
                variant="outlined"
              />
            </Stack>

            <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.5 }}>Optimized Order:</Typography>
            <List dense>
              {result.orderedPoints.map((point, i) => (
                <ListItem key={point.id} disablePadding>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Chip label={i + 1} size="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={point.process_step}
                    secondary={point.locationData?.address}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>

      {/* Right panel: map */}
      <Box sx={{ flex: 1, minHeight: 400 }}>
        <RouteMapRenderer
          stops={mapStops}
          encodedPolyline={result?.polyline}
          depot={depotLocation || undefined}
          height="70vh"
        />
      </Box>
    </Box>
  );
}
