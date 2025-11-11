import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import PageHeader from "@/components/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

// Sample data - replace with actual API calls
const wasteData = [
  { week: 'Week 1', landfill: 0, recycled: 18, repurposed: 12 },
  { week: 'Week 2', landfill: 12, recycled: 30, repurposed: 15 },
  { week: 'Week 3', landfill: 35, recycled: 25, repurposed: 20 },
  { week: 'Week 4', landfill: 30, recycled: 38, repurposed: 15 },
];

const sparklineData = [
  { value: 400 },
  { value: 300 },
  { value: 500 },
  { value: 350 },
  { value: 450 },
  { value: 569 },
];

const recoveredSparklineData = [
  { value: 200 },
  { value: 150 },
  { value: 250 },
  { value: 175 },
  { value: 225 },
  { value: 277 },
];

const topProducts = [
  { id: 1, name: 'Shampoo', volume: 450 },
  { id: 2, name: 'Medicine', volume: 380 },
  { id: 3, name: 'Body Care', volume: 290 },
];

export default function DashboardV2() {
  const { data: wasteMetrics, isLoading } = useQuery({
    queryKey: ['/api/metrics/waste'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/waste');
      if (!response.ok) throw new Error('Failed to fetch waste metrics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Monitor your organization's sustainability metrics"
      />

      <div className="grid gap-6 grid-cols-12">
        {/* Main Chart Section */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Waste (Tonnes)</CardTitle>
                  <CardDescription>Waste distribution over time</CardDescription>
                </div>
                <select className="text-sm border rounded-md p-1">
                  <option>This Month</option>
                  <option>Last 3 Months</option>
                  <option>This Year</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wasteData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="landfill" stroke="#37b5fe" name="Landfill" />
                    <Line type="monotone" dataKey="recycled" stroke="#6366F1" name="Recycled" />
                    <Line type="monotone" dataKey="repurposed" stroke="#F59E0B" name="Repurposed" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Cards Section */}
        <div className="col-span-4 space-y-6">
          {/* Total Disposal Cost Card */}
          <Card className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Total Disposal Cost</CardTitle>
                <Button variant="ghost" size="icon" className="text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">$569,548.49</div>
                <div className="text-sm opacity-90">From All Product Categories</div>
                <div className="h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#FFFFFF" 
                        fillOpacity={1}
                        fill="url(#colorValue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costs Recovered Card */}
          <Card className="bg-gradient-to-r from-teal-500 to-green-400 text-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Costs Recovered</CardTitle>
                <Button variant="ghost" size="icon" className="text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">$277,943.50</div>
                <div className="text-sm opacity-90">From Recycling Schemes</div>
                <div className="h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recoveredSparklineData}>
                      <defs>
                        <linearGradient id="colorRecovered" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FFFFFF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#FFFFFF" 
                        fillOpacity={1}
                        fill="url(#colorRecovered)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>Waste Management Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-4">
                <div style={{ width: 200, height: 200 }}>
                  <CircularProgressbar
                    value={63}
                    text="63%"
                    styles={buildStyles({
                      pathColor: '#37b5fe',
                      textColor: '#37b5fe',
                      trailColor: '#E5E7EB',
                    })}
                  />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                On average, less than industry landfilled
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <div className="col-span-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span>{product.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.volume} units
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}