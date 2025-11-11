import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";

export default function VendorReports() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate and view detailed reports"
      />

      <Card>
        <CardHeader>
          <CardTitle>Reports Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Access and generate your reports here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
