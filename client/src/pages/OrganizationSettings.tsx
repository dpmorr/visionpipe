import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationUsers from "./OrganizationUsers";

interface Organization {
  id: number;
  name: string;
  billingEmail: string;
  website?: string;
  address?: string;
  phone?: string;
}

export default function OrganizationSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);

  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: [`/api/organizations/${user?.organizationId}`],
    enabled: !!user?.organizationId,
  });

  const [formData, setFormData] = useState({
    name: "",
    billingEmail: "",
    website: "",
    address: "",
    phone: "",
  });

  const updateOrganization = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`/api/organizations/${user?.organizationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization updated",
        description: "Your organization settings have been saved.",
      });
      setEditing(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update organization",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!organization) {
    return (
      <div className="text-center py-8">
        <p>No organization found. Please contact an administrator.</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization.mutate(formData);
  };

  const startEditing = () => {
    setFormData({
      name: organization.name,
      billingEmail: organization.billingEmail,
      website: organization.website || "",
      address: organization.address || "",
      phone: organization.phone || "",
    });
    setEditing(true);
  };

  return (
    <div className="container max-w-5xl mx-auto py-6">
      <PageHeader
        title="Organization Settings"
        subtitle="Manage your organization details, users, and billing"
      />

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Organization Details</TabsTrigger>
          <TabsTrigger value="users">Users & Invites</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="billingEmail">Billing Email</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={formData.billingEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, billingEmail: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) =>
                          setFormData({ ...formData, website: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Organization Name</Label>
                    <p className="text-sm">{organization.name}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Billing Email</Label>
                    <p className="text-sm">{organization.billingEmail}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Website</Label>
                    <p className="text-sm">{organization.website || "—"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <p className="text-sm">{organization.address || "—"}</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <p className="text-sm">{organization.phone || "—"}</p>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={startEditing}>Edit</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <OrganizationUsers />
        </TabsContent>
      </Tabs>
    </div>
  );
}