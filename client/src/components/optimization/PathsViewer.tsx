import { useState } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, Alert,
  Divider, Chip, Stack, List, ListItem, ListItemText, ListItemIcon,
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import StraightenIcon from '@mui/icons-material/Straighten';
import TimerIcon from '@mui/icons-material/Timer';
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

interface DirectionsResult {
  polyline: string;
  distanceMeters: number;
  distanceMiles: number;
  durationSeconds: number;
  durationMinutes: number;
  legs: Array<{
    distanceMeters: number;
    durationSeconds: number;
  }>;
}

export default function PathsViewer() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: wastePoints = [] } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const pointsWithLocation = wastePoints.filter(
    p => p.locationData?.lat && p.locationData?.lng
  );

  const directionsMutation = useMutation({
    mutationFn: async () => {
      const selectedPoints = selectedIds
        .map(id => pointsWithLocation.find(p => p.id === id))
        .filter(Boolean) as WastePoint[];

      const locations = selectedPoints.map(p => ({
        lat: p.locationData!.lat,
        lng: p.locationData!.lng,
      }));

      const res = await fetch('/api/route-planning/compute-directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ locations }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Failed to compute directions');
      }
      return res.json() as Promise<DirectionsResult>;
    },
  });

  const handleToggle = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setSelectedIds(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    setSelectedIds(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const result = directionsMutation.data;
  const selectedPoints = selectedIds
    .map(id => pointsWithLocation.find(p => p.id === id))
    .filter(Boolean) as WastePoint[];

  const mapStops = selectedPoints.map((p, i) => ({
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
      {/* Left panel */}
      <Paper sx={{ flex: '0 0 360px', p: 2, maxHeight: '70vh', overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Path Directions
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select and order waste points to compute driving directions between them.
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Available points */}
        <Typography variant="subtitle2" gutterBottom>
          Available Locations ({pointsWithLocation.length})
        </Typography>

        {pointsWithLocation.length === 0 ? (
          <Alert severity="info">No waste points with location data found.</Alert>
        ) : (
          <List dense>
            {pointsWithLocation.map(point => {
              const isSelected = selectedIds.includes(point.id);
              return (
                <ListItem
                  key={point.id}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'action.selected' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => handleToggle(point.id)}
                >
                  <ListItemText
                    primary={point.process_step}
                    secondary={`${point.locationData?.address} - ${point.wasteType}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  {isSelected && (
                    <Chip
                      label={selectedIds.indexOf(point.id) + 1}
                      size="small"
                      color="primary"
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}

        {/* Selected order */}
        {selectedIds.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>Route Order</Typography>
            <List dense>
              {selectedIds.map((id, index) => {
                const point = pointsWithLocation.find(p => p.id === id);
                if (!point) return null;
                return (
                  <ListItem key={id} disablePadding sx={{ mb: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Chip label={index + 1} size="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={point.process_step}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        variant="text"
                        disabled={index === 0}
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                        sx={{ minWidth: 24, p: 0 }}
                      >
                        ^
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        disabled={index === selectedIds.length - 1}
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                        sx={{ minWidth: 24, p: 0 }}
                      >
                        v
                      </Button>
                    </Stack>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          disabled={selectedIds.length < 2 || directionsMutation.isPending}
          onClick={() => directionsMutation.mutate()}
          startIcon={directionsMutation.isPending ? <CircularProgress size={16} /> : <TimelineIcon />}
        >
          {directionsMutation.isPending ? 'Computing...' : 'Get Directions'}
        </Button>

        {directionsMutation.isError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {(directionsMutation.error as Error).message}
          </Alert>
        )}

        {/* Results summary */}
        {result && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>Route Summary</Typography>
            <Stack spacing={1}>
              <Chip icon={<StraightenIcon />} label={`${result.distanceMiles} miles total`} variant="outlined" />
              <Chip icon={<TimerIcon />} label={`${result.durationMinutes} min total`} variant="outlined" />
            </Stack>

            {result.legs.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 1.5, mb: 0.5 }}>Leg Details:</Typography>
                <List dense>
                  {result.legs.map((leg, i) => (
                    <ListItem key={i} disablePadding>
                      <ListItemText
                        primary={`Leg ${i + 1}: ${selectedPoints[i]?.process_step} -> ${selectedPoints[i + 1]?.process_step}`}
                        secondary={`${Math.round(leg.distanceMeters * 0.000621371 * 10) / 10} mi, ${Math.round(leg.durationSeconds / 60)} min`}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
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
