import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function VendorsManagement() {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["/api/admin/vendors"],
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Vendors Management"
        subtitle="Manage marketplace vendors"
        extra={[
          <Button key="add-vendor" className="gap-2">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        ]}
      />

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors?.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>{vendor.name}</TableCell>
                <TableCell>{vendor.services.join(", ")}</TableCell>
                <TableCell>{vendor.rating}/5</TableCell>
                <TableCell>{vendor.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </AdminLayout>
  );
}
