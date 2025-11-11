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
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Truck, Calendar } from "lucide-react";

interface Route {
  id: number;
  name: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  customers: number;
  stops: number;
  date: string;
  estimatedTime: string;
}

export default function VendorRoutes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch routes data
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['/api/vendor/routes'],
  });

  const handleOptimizeRoute = (routeId: number) => {
    toast({
      title: "Optimizing Route",
      description: "Route optimization in progress...",
    });
  };

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
        <Button>
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
                {routes?.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length || 0}
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
              {routes?.map((route) => (
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
                  <TableCell>{new Date(route.date).toLocaleDateString()}</TableCell>
                  <TableCell>{route.estimatedTime}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOptimizeRoute(route.id)}
                    >
                      Optimize
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
