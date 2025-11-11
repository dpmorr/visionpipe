import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { 
  Drawer, 
  Box, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  alpha,
  useTheme,
  Divider
} from '@mui/material';
import {
  Home as HomeIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ArrowUpward as ArrowUpwardIcon
} from '@mui/icons-material';
import { Link } from "wouter";
import Logo from './Logo';
import { useSidebar } from '@/hooks/use-sidebar';

const DRAWER_WIDTH = 280;
const COLLAPSED_WIDTH = 56;

export default function ConnectLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useUser();
  const [, navigate] = useLocation();
  const theme = useTheme();
  const { collapsed, setCollapsed } = useSidebar();

  // Redirect non-Connect users
  if (!isLoading && (!user || user.userType !== "connect")) {
    navigate("/");
    return null;
  }

  const MenuItem = ({ icon: Icon, label, path }: { icon: any, label: string, path: string }) => {
    const [location] = useLocation();
    const isSelected = location === path;

    return (
      <ListItem disablePadding>
        <ListItemButton
          component={Link}
          href={path}
          selected={isSelected}
          sx={{
            minHeight: 48,
            justifyContent: collapsed ? 'center' : 'initial',
            px: 2.5,
            borderRadius: 1,
            mx: 1,
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.16),
              },
            },
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: isSelected ? theme.palette.primary.main : theme.palette.text.secondary
            }}
          >
            <Icon />
          </ListItemIcon>
          <ListItemText 
            primary={label}
            sx={{
              opacity: collapsed ? 0 : 1,
              display: collapsed ? 'none' : 'block',
              '& .MuiTypography-root': {
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? theme.palette.primary.main : theme.palette.text.primary
              }
            }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const menuItems = [
    { icon: HomeIcon, label: 'Home', path: '/connect' },
    { icon: StoreIcon, label: 'Services', path: '/connect/services' },
    { icon: PersonIcon, label: 'Profile', path: '/connect/profile' },
    { icon: SettingsIcon, label: 'Settings', path: '/connect/settings' },
  ];

  const handleUpgrade = () => {
    // Store current user data for subscription page
    if (user) {
      const registrationData = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        upgradeFromConnect: true,
      };
      sessionStorage.setItem('registrationData', JSON.stringify(registrationData));
    }
    sessionStorage.removeItem('isConnectMode');
    navigate('/subscribe');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        open={!collapsed}
        sx={{
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 2,
              minHeight: collapsed ? 80 : 120,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Logo size={collapsed ? 48 : 96} />
          </Box>

          <List sx={{ flexGrow: 1, pt: 2 }}>
            {menuItems.map((item) => (
              <MenuItem key={item.label} {...item} />
            ))}
          </List>

          <Divider />

          {/* Upgrade Button */}
          {!collapsed && (
            <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleUpgrade}
                startIcon={<ArrowUpwardIcon />}
                sx={{
                  py: 1,
                  mb: 2,
                  fontWeight: 600,
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                Upgrade to OS
              </Button>
            </Box>
          )}

          <List>
            <ListItem disablePadding>
              <ListItemButton
                onClick={logout}
                sx={{
                  minHeight: 48,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 2.5,
                  borderRadius: 1,
                  mx: 1,
                  color: theme.palette.error.main,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 0 : 2,
                    justifyContent: 'center',
                    color: theme.palette.error.main
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout"
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    display: collapsed ? 'none' : 'block',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>

          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <IconButton
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px)`,
          ml: `${collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH}px`,
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
}