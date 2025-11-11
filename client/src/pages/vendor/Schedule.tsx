import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";

export default function VendorSchedule() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Schedule Management"
        subtitle="Manage your pickup schedules and availability"
      />

      <Card>
        <CardHeader>
          <CardTitle>Schedule Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            View and manage your schedules here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
