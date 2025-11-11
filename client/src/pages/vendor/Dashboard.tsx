import { useVendor } from "@/hooks/use-vendor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import SankeyChart from "@/components/DashboardModules/SankeyChart";
import { useLocation } from "wouter";
import {
  ClipboardList,
  Truck,
  Calendar,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";

export default function VendorDashboard() {
  const { vendor, logout } = useVendor();
  const [, navigate] = useLocation();

  if (!vendor) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const menuItems = [
    {
      title: "Active Orders",
      icon: ClipboardList,
      description: "View and manage current orders",
      link: "/vendor/orders"
    },
    {
      title: "Delivery Schedule",
      icon: Truck,
      description: "Manage pickup and delivery schedule",
      link: "/vendor/schedule"
    },
    {
      title: "Calendar",
      icon: Calendar,
      description: "View upcoming appointments",
      link: "/vendor/calendar"
    },
    {
      title: "Analytics",
      icon: BarChart3,
      description: "View performance metrics",
      link: "/vendor/analytics"
    },
    {
      title: "Settings",
      icon: Settings,
      description: "Manage account settings",
      link: "/vendor/settings"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Vendor Dashboard"
        subtitle={`Welcome back, ${vendor.name}`}
        extra={[
          <Button
            key="logout"
            variant="outline"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        ]}
      />

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 gap-6">
          <SankeyChart />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Card key={item.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg font-medium">
                    <item.icon className="w-5 h-5 mr-2" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate(item.link)}
                  >
                    View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}