import axios from 'axios';

const ROUTES_API_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const ROUTE_OPTIMIZATION_URL = 'https://routeoptimization.googleapis.com/v1';

interface LatLng {
  lat: number;
  lng: number;
}

interface RouteResult {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  legs: Array<{
    distanceMeters: number;
    durationSeconds: number;
    startLocation: LatLng;
    endLocation: LatLng;
  }>;
}

interface OptimizationResult {
  optimizedOrder: number[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  polyline: string;
}

function getApiKey(): string {
  // Use the same Google Maps API key — Routes API and Route Optimization API
  // just need to be enabled on the same Google Cloud project
  const key = process.env.GOOGLE_ROUTES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error('No Google API key found. Set VITE_GOOGLE_MAPS_API_KEY in your .env');
  }
  return key;
}

function getProjectId(): string {
  const id = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (!id) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is not set');
  }
  return id;
}

/**
 * Compute a route between an origin, destination, and optional intermediates
 * using the Google Routes API v2.
 */
export async function computeRoute(
  origin: LatLng,
  destination: LatLng,
  intermediates: LatLng[] = []
): Promise<RouteResult> {
  const apiKey = getApiKey();

  const body: any = {
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } }
    },
    destination: {
      location: { latLng: { latitude: destination.lat, longitude: destination.lng } }
    },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    computeAlternativeRoutes: false,
    languageCode: 'en-US',
    units: 'IMPERIAL',
  };

  if (intermediates.length > 0) {
    body.intermediates = intermediates.map(point => ({
      location: { latLng: { latitude: point.lat, longitude: point.lng } }
    }));
  }

  const response = await axios.post(ROUTES_API_URL, body, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration,routes.legs.startLocation,routes.legs.endLocation',
    },
  });

  const route = response.data.routes?.[0];
  if (!route) {
    throw new Error('No route found');
  }

  return {
    polyline: route.polyline?.encodedPolyline || '',
    distanceMeters: route.distanceMeters || 0,
    durationSeconds: parseDuration(route.duration),
    legs: (route.legs || []).map((leg: any) => ({
      distanceMeters: leg.distanceMeters || 0,
      durationSeconds: parseDuration(leg.duration),
      startLocation: {
        lat: leg.startLocation?.latLng?.latitude || 0,
        lng: leg.startLocation?.latLng?.longitude || 0,
      },
      endLocation: {
        lat: leg.endLocation?.latLng?.latitude || 0,
        lng: leg.endLocation?.latLng?.longitude || 0,
      },
    })),
  };
}

/**
 * Optimize the order of stops using Google Route Optimization API.
 * Takes a depot (start/end) and a list of stop locations with their IDs,
 * returns the optimal visit order.
 */
export async function optimizeRoute(
  depot: LatLng,
  stops: Array<{ id: number; location: LatLng }>
): Promise<OptimizationResult> {
  const apiKey = getApiKey();
  const projectId = getProjectId();

  // Build the optimization request
  const shipments = stops.map((stop, index) => ({
    deliveries: [{
      arrivalLocation: {
        latitude: stop.location.lat,
        longitude: stop.location.lng,
      },
      duration: '300s', // 5 min service time per stop
    }],
    label: `stop-${stop.id}`,
  }));

  const requestBody = {
    model: {
      shipments,
      vehicles: [{
        startLocation: {
          latitude: depot.lat,
          longitude: depot.lng,
        },
        endLocation: {
          latitude: depot.lat,
          longitude: depot.lng,
        },
        travelMode: 1, // DRIVING
        costPerKilometer: 1.0,
        costPerHour: 30.0,
      }],
    },
    searchMode: 1, // RETURN_FAST
  };

  const response = await axios.post(
    `${ROUTE_OPTIMIZATION_URL}/projects/${projectId}:optimizeTours`,
    requestBody,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
    }
  );

  const solution = response.data;
  const vehicleRoute = solution.routes?.[0];

  if (!vehicleRoute || !vehicleRoute.visits?.length) {
    throw new Error('No optimized route found');
  }

  // Extract the optimized order of stop IDs
  const optimizedOrder = vehicleRoute.visits.map((visit: any) => {
    const shipmentIndex = visit.shipmentIndex || 0;
    return stops[shipmentIndex].id;
  });

  // Now compute the actual driving route with the optimized order
  const orderedStops = optimizedOrder.map((id: number) =>
    stops.find(s => s.id === id)!.location
  );

  const routeResult = await computeRoute(
    depot,
    depot, // return to depot
    orderedStops
  );

  return {
    optimizedOrder,
    totalDistanceMeters: routeResult.distanceMeters,
    totalDurationSeconds: routeResult.durationSeconds,
    polyline: routeResult.polyline,
  };
}

/**
 * Compute directions for an ordered list of locations (no reordering).
 */
export async function computeDirections(
  locations: LatLng[]
): Promise<RouteResult> {
  if (locations.length < 2) {
    throw new Error('At least 2 locations are required');
  }

  const origin = locations[0];
  const destination = locations[locations.length - 1];
  const intermediates = locations.slice(1, -1);

  return computeRoute(origin, destination, intermediates);
}

/** Parse Google's duration format (e.g., "1234s") to seconds */
function parseDuration(duration: string | undefined): number {
  if (!duration) return 0;
  const match = duration.match(/^(\d+)s$/);
  return match ? parseInt(match[1], 10) : 0;
}
