import { useUser } from "@/hooks/use-user";
import { useLocation, useRouter } from "wouter";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const [, navigate] = useLocation();

  // Redirect non-owner users
  if (!isLoading && (!user || user.organizationRole !== "owner")) {
    navigate("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {children}
    </div>
  );
}