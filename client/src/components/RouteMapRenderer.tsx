import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { Box, Typography, Chip } from '@mui/material';

interface StopLocation {
  id: number;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  order?: number;
  wasteType?: string;
  volume?: string;
  unit?: string;
}

interface RouteMapRendererProps {
  stops: StopLocation[];
  encodedPolyline?: string;
  depot?: { lat: number; lng: number; address?: string };
  height?: string;
  showInfoWindows?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = { lat: 39.8283, lng: -98.5795 }; // Center of US

export default function RouteMapRenderer({
  stops,
  encodedPolyline,
  depot,
  height = '400px',
  showInfoWindows = true,
}: RouteMapRendererProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<StopLocation | null>(null);
  const [decodedPath, setDecodedPath] = useState<google.maps.LatLngLiteral[]>([]);

  // Decode the polyline when it changes
  useEffect(() => {
    if (encodedPolyline && typeof google !== 'undefined' && google.maps?.geometry) {
      const path = google.maps.geometry.encoding.decodePath(encodedPolyline);
      setDecodedPath(path.map(p => ({ lat: p.lat(), lng: p.lng() })));
    } else {
      setDecodedPath([]);
    }
  }, [encodedPolyline]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Fit bounds to show all stops
    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    stops.forEach(stop => {
      if (stop.lat && stop.lng) {
        bounds.extend({ lat: stop.lat, lng: stop.lng });
        hasPoints = true;
      }
    });

    if (depot) {
      bounds.extend({ lat: depot.lat, lng: depot.lng });
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [stops, depot]);

  const center = stops.length > 0
    ? { lat: stops[0].lat, lng: stops[0].lng }
    : depot || defaultCenter;

  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        onLoad={onLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Route polyline */}
        {decodedPath.length > 0 && (
          <Polyline
            path={decodedPath}
            options={{
              strokeColor: '#1976d2',
              strokeOpacity: 0.8,
              strokeWeight: 4,
            }}
          />
        )}

        {/* Depot marker */}
        {depot && (
          <Marker
            position={{ lat: depot.lat, lng: depot.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#4CAF50',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            title="Depot"
          />
        )}

        {/* Stop markers with numbers */}
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
            label={{
              text: String(stop.order ?? index + 1),
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 16,
              fillColor: '#1976d2',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            }}
            onClick={() => showInfoWindows && setSelectedStop(stop)}
          />
        ))}

        {/* Info window for selected stop */}
        {selectedStop && showInfoWindows && (
          <InfoWindow
            position={{ lat: selectedStop.lat, lng: selectedStop.lng }}
            onCloseClick={() => setSelectedStop(null)}
          >
            <Box sx={{ p: 0.5, maxWidth: 200 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                #{selectedStop.order ?? '?'} {selectedStop.name}
              </Typography>
              {selectedStop.address && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {selectedStop.address}
                </Typography>
              )}
              {selectedStop.wasteType && (
                <Chip
                  label={selectedStop.wasteType}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              )}
              {selectedStop.volume && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Volume: {selectedStop.volume} {selectedStop.unit}
                </Typography>
              )}
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </Box>
  );
}
