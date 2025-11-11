import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  alpha,
  useTheme,
  Tooltip,
  Divider,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  Switch,
  Typography,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Science as ScienceIcon,
  Shield as ShieldIcon,
  Store as StoreIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  MenuBook as MenuBookIcon,
  Construction as ConstructionIcon,
  Flag as FlagIcon,
  AutoDelete as AutoDeleteIcon,
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  Api as ApiIcon,
  SupervisorAccount as SupervisorAccountIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  LocalShipping as LocalShippingIcon,
  Support as SupportIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Security as SecurityIcon,
  Loop as LoopIcon,
  Notifications as NotificationsIcon,
  Dataset as DatasetIcon,
  LocationOn as LocationOnIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Sensors as SensorsIcon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import Logo from './Logo';
import { useSidebar } from '@/hooks/use-sidebar';
import { useUser } from '@/hooks/use-user';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { useAppModeStore } from '@/lib/appModeStore';
import { useNavigationModulesStore, moduleNames } from '@/lib/navigationModulesStore';

const DRAWER_WIDTH = 200;
const COLLAPSED_WIDTH = 56;

interface MenuItemProps {
  icon: React.ComponentType;
  label: string;
  path?: string;
  subItems?: MenuItemProps[];
  onClick?: () => void;
}

function SideNav() {
  const [location, navigate] = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { user, logout } = useUser();
  const theme = useTheme();
  const [openMenus, setOpenMenus] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState('Environmental');
  const { mode, toggleMode } = useAppModeStore();

  useEffect(() => {
    if (user && location === '/login') {
      navigate('/');
    }
  }, [user, location, navigate]);

  const isVendor = user?.role?.toLowerCase() === 'vendor';
  const isAdmin = user?.role?.toLowerCase() === 'user' && user?.organizationRole?.toLowerCase() === 'owner';

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Ensure the Administration menu is open by default
    if (key === 'Administration' && isAdmin) {
      console.log('Toggling Administration menu:', !openMenus['Administration']);
    }
  };
  
  // Make sure Administration menu is open by default for admin users
  useEffect(() => {
    if (isAdmin) {
      console.log('Admin user detected - forcing Administration menu open');
      setOpenMenus(prev => ({
        ...prev,
        'Administration': true
      }));
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to log out. Please try again.",
      });
    }
  };

  const MenuItem = ({ icon: Icon, label, path, subItems, onClick }: MenuItemProps) => {
    const isSelected = path ? location === path : false;
    const hasSubItems = subItems && subItems.length > 0;

    const handleClick = () => {
      if (onClick) {
        onClick();
      } else if (!collapsed && hasSubItems) {
        toggleMenu(label);
      } else if (path) {
        navigate(path);
      }
    };

    const buttonContent = (
      <>
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 1.5,
            justifyContent: 'center',
            color: isSelected ? 'white' : theme.palette.text.secondary,
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem',
            }
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
              color: isSelected ? 'white' : theme.palette.text.primary,
              fontSize: '0.875rem',
              lineHeight: 1.2
            }
          }}
        />
        {hasSubItems && !collapsed && (
          <ChevronRightIcon
            sx={{
              transform: openMenus[label] ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.3s',
              color: theme.palette.text.secondary,
              fontSize: '1rem'
            }}
          />
        )}
      </>
    );

    return (
      <>
        <ListItem disablePadding sx={{ display: 'block' }}>
          {collapsed ? (
            <Tooltip title={label} placement="right">
              <ListItemButton
                selected={isSelected}
                onClick={handleClick}
                sx={{
                  minHeight: 40,
                  justifyContent: collapsed ? 'center' : 'initial',
                  px: 1.5,
                  borderRadius: 1,
                  mx: 0.5,
                  '&.Mui-selected': {
                    bgcolor: '#37b5fe',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#0094e5',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '& .MuiTypography-root': {
                      color: 'white',
                    }
                  },
                  '&:hover': {
                    bgcolor: alpha('#37b5fe', 0.08),
                  },
                }}
              >
                {buttonContent}
              </ListItemButton>
            </Tooltip>
          ) : (
            <ListItemButton
              selected={isSelected}
              onClick={handleClick}
              sx={{
                minHeight: 40,
                justifyContent: collapsed ? 'center' : 'initial',
                px: 1.5,
                borderRadius: 1,
                mx: 0.5,
                '&.Mui-selected': {
                  bgcolor: '#37b5fe',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#0094e5',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                  '& .MuiTypography-root': {
                    color: 'white',
                  }
                },
                '&:hover': {
                  bgcolor: alpha('#37b5fe', 0.08),
                },
              }}
            >
              {buttonContent}
            </ListItemButton>
          )}
        </ListItem>

        {hasSubItems && !collapsed && (
          <Collapse in={openMenus[label]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {subItems.map((item) => (
                <MenuItem key={item.label} {...item} />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  const vendorMenuItems = [
    { icon: DashboardIcon, label: 'Dashboard', path: '/' },
    { icon: LocalShippingIcon, label: 'Routes', path: '/routes' },
    { icon: SupportIcon, label: 'Customers', path: '/customers' },
    { icon: StoreIcon, label: 'Services', path: '/services' },
    { icon: ScheduleIcon, label: 'Schedule', path: '/schedule' },
    { icon: AnalyticsIcon, label: 'Analytics', path: '/analytics' },
    { icon: DescriptionIcon, label: 'Reports', path: '/reports' },
    { icon: AttachMoneyIcon, label: 'Invoices', path: '/invoices' },
  ];

  const { visibleModules } = useNavigationModulesStore();

  // Define module configurations with icons and paths
  const moduleConfigs = {
    home: { icon: DashboardIcon, path: '/' },
    wastepoints: { icon: AutoDeleteIcon, path: '/waste-points' },
    projects: { icon: AssignmentTurnedInIcon, path: '/projects' },
    vendors: { icon: LocalShippingIcon, path: '/vendor-directory' },
    sensors: { icon: SensorsIcon, path: '/sensors' },
    locations: { icon: LocationOnIcon, path: '/optimization' },
    circular: { icon: LoopIcon, path: '/circular' },
    analytics: { icon: AnalyticsIcon, path: '/analytics' },
    training: { icon: MenuBookIcon, path: '/training' },
    help: { icon: HelpIcon, path: '/help' },
    dataModels: { icon: AccountTreeIcon, path: '/data-models' },
    advancedAnalytics: { icon: AnalyticsIcon, path: '/advanced-analytics' },
    alerts: { icon: NotificationsIcon, path: '/alerts' },
    dataBuilder: { icon: DatasetIcon, path: '/data-builder' },
  };

  // Generate menu items based on visible modules
  const generateMenuItems = () => {
    return visibleModules
      .map(moduleKey => {
        const config = moduleConfigs[moduleKey as keyof typeof moduleConfigs];
        if (!config) return null;
        
        return {
          icon: config.icon,
          label: moduleNames[moduleKey as keyof typeof moduleNames],
          path: config.path
        };
      })
      .filter(Boolean) as MenuItemProps[];
  };

  const userMenuItems = generateMenuItems();

  const adminMenuItems = isAdmin ? [
    {
      icon: AdminPanelSettingsIcon,
      label: 'Administration',
      subItems: [
        { icon: SupervisorAccountIcon, label: 'Vendor Management', path: '/admin/vendors' },
        { icon: ShoppingCartIcon, label: 'Product Listings', path: '/admin/products' },
        { icon: ConstructionIcon, label: 'Waste Calculator', path: '/admin/waste-calculator' },
      ],
    },
  ] : [];

  const allUserMenuItems = [
    ...userMenuItems,
    ...adminMenuItems,
  ];

  const menuItems = isVendor ? vendorMenuItems : allUserMenuItems;

  const settingsItems = [
    { icon: StoreIcon, label: 'Marketplace', path: '/products' },
    { icon: PersonIcon, label: 'Profile', path: '/profile' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    { icon: LogoutIcon, label: 'Logout', onClick: handleLogout },
  ];

  return (
    <Drawer
      variant="permanent"
      open={!collapsed}
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'white',
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 1.5,
            minHeight: collapsed ? 64 : 96,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Logo size={collapsed ? 40 : 72} />
        </Box>

        <List
          sx={{
            pt: 1.5,
            pb: 1.5,
            px: 0,
            flexGrow: 1,
            '& .MuiListItemButton-root': {
              transition: theme.transitions.create(['padding', 'margin'], {
                duration: theme.transitions.duration.enteringScreen,
              }),
            }
          }}
        >
          {menuItems.map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </List>

        {/* Settings Section */}
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}` }}>
          <List>
            {settingsItems.map((item) => (
              <MenuItem key={item.label} {...item} />
            ))}
          </List>
        </Box>

        {/* Collapse Toggle */}
        <Box
          sx={{
            p: 1.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
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
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem'
              }
            }}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  );
}

export default SideNav;