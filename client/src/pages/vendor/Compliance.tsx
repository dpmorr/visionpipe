import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";

export default function VendorCompliance() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Management"
        subtitle="Monitor and maintain regulatory compliance"
      />

      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track and manage your compliance requirements here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
