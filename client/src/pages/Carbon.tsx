import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, Truck, BarChart3, Leaf } from "lucide-react";
import WasteImpactMeter from "@/components/WasteImpactMeter";
import { cn } from "@/lib/utils";

interface CarbonData {
  locationId: string;
  locationName: string;
  distance: number;
  emissions: number;
  wasteVolume: number;
  transportType: string;
  date: string;
}

interface CarbonImpact {
  wasteReduction: number;
  carbonSavings: number;
  energySavings: number;
  costSavings: number;
  timestamp: string;
}

interface WastePoint {
  id: number;
  name: string;
  location: string;
}

export default function Carbon() {
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("week");

  const { data: carbonData = [], isLoading: carbonLoading } = useQuery<CarbonData[]>({
    queryKey: ['/api/carbon-emissions', selectedLocation, timeRange],
  });

  const { data: carbonImpact, isLoading: impactLoading } = useQuery<CarbonImpact>({
    queryKey: ['/api/carbon-impact/latest'],
  });

  const { data: wastePoints = [], isLoading: wastePointsLoading } = useQuery<WastePoint[]>({
    queryKey: ['/api/waste-points'],
  });

  const totalEmissions = carbonData.reduce((sum, item) => sum + item.emissions, 0);
  const averageEmissions = totalEmissions / (carbonData.length || 1);

  const chartData = carbonData.map(item => ({
    name: item.locationName,
    emissions: item.emissions,
    distance: item.distance,
    volume: item.wasteVolume
  }));

  const isLoading = carbonLoading || wastePointsLoading || impactLoading;

  // Calculate carbon score based on impact data
  const calculateCarbonScore = (impact: CarbonImpact | undefined): number => {
    if (!impact) return 0;
    // Score calculation based on various factors
    const baseline = 100;
    const reductionImpact = (impact.wasteReduction / 1000) * 30; // 30% weight
    const savingsImpact = (impact.carbonSavings / 100) * 40; // 40% weight
    const energyImpact = (impact.energySavings / 100) * 30; // 30% weight

    return Math.max(0, Math.min(100, baseline - (reductionImpact + savingsImpact + energyImpact)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Carbon Emissions Tracker"
        subtitle="Monitor and analyze carbon emissions from waste transport operations"
      />

      {/* Add WasteImpactMeter component */}
      <WasteImpactMeter
        carbonScore={calculateCarbonScore(carbonImpact)}
        totalEmissions={totalEmissions}
        recyclingOffset={carbonImpact?.wasteReduction || 0}
        netImpact={totalEmissions - (carbonImpact?.carbonSavings || 0)}
        carbonOffset={carbonImpact?.carbonSavings || 0}
        waterSaved={carbonImpact?.energySavings || 0}
        airQualityImpact={100 - (totalEmissions / 1000)} // Simplified air quality calculation
      />

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Emissions</p>
              <h3 className="text-3xl font-bold tracking-tight">
                {isLoading ? "..." : `${totalEmissions.toFixed(2)}`}
                <span className="text-lg ml-1 font-medium text-muted-foreground">kg CO₂</span>
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Carbon Savings</p>
              <h3 className="text-3xl font-bold tracking-tight">
                {isLoading ? "..." : `${carbonImpact?.carbonSavings.toFixed(2) || 0}`}
                <span className="text-lg ml-1 font-medium text-muted-foreground">tons</span>
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Collection Points</p>
              <h3 className="text-3xl font-bold tracking-tight">
                {isLoading ? "..." : wastePoints?.length || 0}
                <span className="text-lg ml-1 font-medium text-muted-foreground">points</span>
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Energy Savings</p>
              <h3 className="text-3xl font-bold tracking-tight">
                {isLoading ? "..." : `${carbonImpact?.energySavings.toFixed(2) || 0}`}
                <span className="text-lg ml-1 font-medium text-muted-foreground">kWh</span>
              </h3>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Emissions by Location</h3>
        <div className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="emissions" name="CO₂ Emissions (kg)" fill="#0ea5e9" />
                <Bar dataKey="distance" name="Distance (km)" fill="#22c55e" />
                <Bar dataKey="volume" name="Waste Volume (m³)" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
}