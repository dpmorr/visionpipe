import { Box, Avatar } from '@mui/material';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";

export default function ProfileDropdown() {
  const { user } = useUser();

  if (!user) return null;

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.username?.slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <Avatar 
          sx={{ 
            width: 40,
            height: 40,
            bgcolor: '#37b5fe',
            color: 'white',
            cursor: 'pointer'
          }}
          src={user.profileImage ?? undefined}
          alt={user.username || 'User avatar'}
        >
          {initials}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <Box>
            <Box>{user.firstName} {user.lastName}</Box>
            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{user.email}</Box>
          </Box>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}