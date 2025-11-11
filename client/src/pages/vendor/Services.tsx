import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function VendorServices() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Management"
        subtitle="Manage your waste collection services and pricing"
      />
      
      <div className="flex justify-end">
        <Button
          className="bg-[#04a2fe] hover:bg-[#0388d4] text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Service Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure and manage your service offerings here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
