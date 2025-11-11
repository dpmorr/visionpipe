import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sankey } from "@ant-design/plots";

interface SankeyChartProps {
  data?: {
    timestamp: string;
    total: number;
    recyclable: number;
    nonrecyclable: number;
  }[];
}

export default function SankeyChart({ data }: SankeyChartProps) {
  // Transform the line chart data into Sankey format
  const transformData = (inputData: SankeyChartProps['data']) => {
    if (!inputData || inputData.length === 0) {
      return [
        // Default demo data showing the structure
        { source: 'Total Waste', target: 'Plastics', value: 30 },
        { source: 'Total Waste', target: 'Metals', value: 20 },
        { source: 'Total Waste', target: 'Paper', value: 25 },
        { source: 'Total Waste', target: 'Organic', value: 15 },
        { source: 'Total Waste', target: 'Comingled', value: 10 },
        { source: 'Plastics', target: 'Recycling', value: 25 },
        { source: 'Plastics', target: 'Landfill', value: 5 },
        { source: 'Metals', target: 'Recycling', value: 18 },
        { source: 'Metals', target: 'Landfill', value: 2 },
        { source: 'Paper', target: 'Recycling', value: 20 },
        { source: 'Paper', target: 'Energy Recovery', value: 5 },
        { source: 'Organic', target: 'Composting', value: 12 },
        { source: 'Organic', target: 'Energy Recovery', value: 3 },
        { source: 'Comingled', target: 'Recycling', value: 7 },
        { source: 'Comingled', target: 'Landfill', value: 3 }
      ];
    }

    // Calculate totals
    const totals = inputData.reduce((acc, curr) => ({
      total: acc.total + curr.total,
      recyclable: acc.recyclable + curr.recyclable,
      nonrecyclable: acc.nonrecyclable + curr.nonrecyclable
    }), { total: 0, recyclable: 0, nonrecyclable: 0 });

    // Calculate averages for distribution
    const avgTotal = Math.round(totals.total / inputData.length);
    const avgRecyclable = Math.round(totals.recyclable / inputData.length);
    const avgNonrecyclable = Math.round(totals.nonrecyclable / inputData.length);

    // Break down recyclables and non-recyclables into material types
    // These percentages are estimates and can be adjusted
    return [
      // From Total to Material Types
      { source: 'Total Waste', target: 'Plastics', value: Math.round(avgTotal * 0.3) },
      { source: 'Total Waste', target: 'Metals', value: Math.round(avgTotal * 0.2) },
      { source: 'Total Waste', target: 'Paper', value: Math.round(avgTotal * 0.25) },
      { source: 'Total Waste', target: 'Organic', value: Math.round(avgTotal * 0.15) },
      { source: 'Total Waste', target: 'Comingled', value: Math.round(avgTotal * 0.1) },

      // From Materials to Processing
      { source: 'Plastics', target: 'Recycling', value: Math.round(avgRecyclable * 0.3) },
      { source: 'Plastics', target: 'Landfill', value: Math.round(avgNonrecyclable * 0.3) },
      { source: 'Metals', target: 'Recycling', value: Math.round(avgRecyclable * 0.2) },
      { source: 'Metals', target: 'Landfill', value: Math.round(avgNonrecyclable * 0.2) },
      { source: 'Paper', target: 'Recycling', value: Math.round(avgRecyclable * 0.25) },
      { source: 'Paper', target: 'Energy Recovery', value: Math.round(avgNonrecyclable * 0.25) },
      { source: 'Organic', target: 'Composting', value: Math.round(avgRecyclable * 0.15) },
      { source: 'Organic', target: 'Energy Recovery', value: Math.round(avgNonrecyclable * 0.15) },
      { source: 'Comingled', target: 'Recycling', value: Math.round(avgRecyclable * 0.1) },
      { source: 'Comingled', target: 'Landfill', value: Math.round(avgNonrecyclable * 0.1) }
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Waste Flow Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '400px', width: '100%' }}>
          <Sankey
            data={transformData(data)}
            sourceField="source"
            targetField="target"
            weightField="value"
            nodeWidth={16}
            nodePadding={10}
          />
        </div>
      </CardContent>
    </Card>
  );
}