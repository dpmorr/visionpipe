import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Mail, UserPlus } from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"], {
    required_error: "Please select a role",
  }),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface OrganizationMember {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationRole: string;
  lastLogin?: string;
}

interface OrganizationInvite {
  id: number;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt?: string;
}

export default function OrganizationUsers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  // Fetch organization members
  const { data: members = [], isLoading: isLoadingMembers } = useQuery<OrganizationMember[]>({
    queryKey: ["/api/organization/members"],
  });

  // Fetch pending invites
  const { data: invites = [], isLoading: isLoadingInvites } = useQuery<OrganizationInvite[]>({
    queryKey: ["/api/organization/invites"],
  });

  // Send invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormData) => {
      const response = await fetch("/api/organization/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invite Sent",
        description: "An invitation has been sent to join your organization.",
      });
      setIsInviteDialogOpen(false);
      form.reset();
      // Refresh both members and invites lists
      queryClient.invalidateQueries({ queryKey: ["/api/organization/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organization/members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteFormData) => {
    inviteMutation.mutate(data);
  };

  if (isLoadingMembers || isLoadingInvites) {
    return <div>Loading...</div>;
  }

  const pendingInvites = invites.filter(invite => !invite.acceptedAt);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Members</CardTitle>
            <CardDescription>Active users in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>Users who haven't accepted yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Organization Members</CardTitle>
            <CardDescription>Manage your team members and their roles</CardDescription>
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {member.firstName} {member.lastName || ""}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Mail className="mr-2 h-4 w-4" />
                    {member.email}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">{member.organizationRole}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Users who have been invited but haven't joined yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center">
                      <Mail className="mr-2 h-4 w-4" />
                      {invite.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Invited as: <span className="font-medium">{invite.role}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="secondary">Pending</Badge>
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization. They'll receive an
              email with instructions to set up their account.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter their email address"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInviteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}