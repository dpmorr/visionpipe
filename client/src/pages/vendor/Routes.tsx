import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Truck, Calendar, Route, Eye } from "lucide-react";
import RouteMapRenderer from "@/components/RouteMapRenderer";

interface WastePoint {
  id: number;
  process_step: string;
  wasteType: string;
  estimatedVolume: string;
  unit: string;
  vendor: string;
  locationData?: {
    address: string;
    lat: number;
    lng: number;
    placeId: string;
  };
}

interface CollectionRoute {
  id: number;
  name: string;
  status: string;
  wastePointIds: number[];
  depotLocation?: { address: string; lat: number; lng: number } | null;
  optimizedOrder?: number[] | null;
  routePolyline?: string | null;
  totalDistanceMeters?: number | null;
  totalDurationSeconds?: number | null;
  optimizedAt?: string | null;
  scheduledDate?: string | null;
  createdAt?: string;
  // Enriched fields from API
  stops: number;
  customers: number;
  estimatedTime: string;
  date: string;
  wastePointDetails?: WastePoint[];
  optimization?: {
    distanceMiles: number;
    durationMinutes: number;
    stopsOptimized: number;
  };
}

export default function VendorRoutes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewRouteDialog, setShowNewRouteDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<CollectionRoute | null>(null);
  const [newRouteName, setNewRouteName] = useState("");
  const [selectedWastePointIds, setSelectedWastePointIds] = useState<number[]>([]);

  // Fetch routes data
  const { data: routes, isLoading } = useQuery<CollectionRoute[]>({
    queryKey: ['/api/route-planning'],
  });

  // Fetch waste points for creating new routes
  const { data: wastePoints = [] } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const pointsWithLocation = wastePoints.filter(
    p => p.locationData?.lat && p.locationData?.lng
  );

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/route-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newRouteName,
          wastePointIds: selectedWastePointIds,
        }),
      });
      if (!res.ok) throw new Error('Failed to create route');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/route-planning'] });
      setShowNewRouteDialog(false);
      setNewRouteName("");
      setSelectedWastePointIds([]);
      toast({ title: "Route Created", description: "New collection route has been created." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create route.", variant: "destructive" });
    },
  });

  // Optimize route mutation
  const optimizeMutation = useMutation({
    mutationFn: async (routeId: number) => {
      const res = await fetch(`/api/route-planning/${routeId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Optimization failed');
      }
      return res.json() as Promise<CollectionRoute>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/route-planning'] });
      toast({
        title: "Route Optimized",
        description: data.optimization
          ? `${data.optimization.distanceMiles} miles, ${data.optimization.durationMinutes} min for ${data.optimization.stopsOptimized} stops`
          : "Route has been optimized.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Optimization Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleViewMap = (route: CollectionRoute) => {
    setSelectedRoute(route);
    setShowMapDialog(true);
  };

  const toggleWastePoint = (id: number) => {
    setSelectedWastePointIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredRoutes = routes?.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build map stops for the selected route
  const mapStops = selectedRoute?.wastePointDetails
    ?.filter(p => p.locationData?.lat && p.locationData?.lng)
    .map((p, i) => {
      const orderIndex = selectedRoute.optimizedOrder
        ? selectedRoute.optimizedOrder.indexOf(p.id)
        : i;
      return {
        id: p.id,
        name: p.process_step,
        address: p.locationData?.address,
        lat: p.locationData!.lat,
        lng: p.locationData!.lng,
        order: orderIndex >= 0 ? orderIndex + 1 : i + 1,
        wasteType: p.wasteType,
        volume: p.estimatedVolume,
        unit: p.unit,
      };
    })
    .sort((a, b) => a.order - b.order) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route Planning"
        subtitle="Manage and optimize your collection routes"
      />

      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowNewRouteDialog(true)}>
          <MapPin className="mr-2 h-4 w-4" />
          New Route
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-primary mr-2" />
              <div className="text-2xl font-bold">{routes?.length || 0}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Stops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary mr-2" />
              <div className="text-2xl font-bold">
                {routes?.reduce((acc, route) => acc + route.stops, 0) || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary mr-2" />
              <div className="text-2xl font-bold">
                {routes?.filter(r => r.date && new Date(r.date).toDateString() === new Date().toDateString()).length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Stops</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoutes?.map((route) => (
                <TableRow key={route.id}>
                  <TableCell>{route.name}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                      ${route.status === 'completed' ? 'bg-green-100 text-green-800' :
                        route.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {route.status}
                    </div>
                  </TableCell>
                  <TableCell>{route.customers}</TableCell>
                  <TableCell>{route.stops}</TableCell>
                  <TableCell>{route.date ? new Date(route.date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{route.estimatedTime}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => optimizeMutation.mutate(route.id)}
                        disabled={optimizeMutation.isPending}
                      >
                        {optimizeMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Route className="h-3 w-3 mr-1" />
                        )}
                        Optimize
                      </Button>
                      {route.routePolyline && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMap(route)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Map
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredRoutes || filteredRoutes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No routes found. Create a new route to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Route Dialog */}
      <Dialog open={showNewRouteDialog} onOpenChange={setShowNewRouteDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Route Name</Label>
              <Input
                placeholder="e.g., Monday Morning Collection"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
              />
            </div>
            <div>
              <Label>Select Waste Points ({selectedWastePointIds.length} selected)</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
                {pointsWithLocation.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No waste points with location data available.
                  </p>
                ) : (
                  pointsWithLocation.map(point => (
                    <label
                      key={point.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWastePointIds.includes(point.id)}
                        onChange={() => toggleWastePoint(point.id)}
                        className="rounded"
                      />
                      <div>
                        <div className="text-sm font-medium">{point.process_step}</div>
                        <div className="text-xs text-muted-foreground">
                          {point.locationData?.address} - {point.wasteType}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRouteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRouteMutation.mutate()}
              disabled={!newRouteName || selectedWastePointIds.length < 2 || createRouteMutation.isPending}
            >
              {createRouteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Route
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map View Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRoute?.name}
              {selectedRoute?.totalDistanceMeters && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {Math.round(selectedRoute.totalDistanceMeters * 0.000621371 * 10) / 10} mi
                  {selectedRoute.totalDurationSeconds && `, ${Math.round(selectedRoute.totalDurationSeconds / 60)} min`}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div style={{ height: '500px' }}>
            <RouteMapRenderer
              stops={mapStops}
              encodedPolyline={selectedRoute?.routePolyline || undefined}
              depot={selectedRoute?.depotLocation || undefined}
              height="500px"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
