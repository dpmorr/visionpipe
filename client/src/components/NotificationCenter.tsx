import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Box, IconButton, Collapse } from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className="p-6">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isExpanded ? 2 : 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Bell className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </Box>
        <IconButton 
          size="small" 
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ color: 'text.secondary' }}
        >
          {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ mt: 2 }}>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No new notifications
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${
                  !notification.read ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <Badge
                    variant={
                      notification.type === "success"
                        ? "default"
                        : notification.type === "warning"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {notification.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </Box>
      </Collapse>
    </Card>
  );
}
