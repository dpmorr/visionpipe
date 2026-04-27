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
  Typography,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  Store as StoreIcon,
  Schedule as ScheduleIcon,
  AttachMoney as AttachMoneyIcon,
  MenuBook as MenuBookIcon,
  Construction as ConstructionIcon,
  AutoDelete as AutoDeleteIcon,
  AccountTree as AccountTreeIcon,
  Description as DescriptionIcon,
  SupervisorAccount as SupervisorAccountIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Support as SupportIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Loop as LoopIcon,
  Notifications as NotificationsIcon,
  Dataset as DatasetIcon,
  LocationOn as LocationOnIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Sensors as SensorsIcon,
  FiberManualRecord as FiberManualRecordIcon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import Logo from './Logo';
import { useSidebar } from '@/hooks/use-sidebar';
import { useUser } from '@/hooks/use-user';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigationModulesStore, moduleNames } from '@/lib/navigationModulesStore';

const DRAWER_WIDTH = 224;
const COLLAPSED_WIDTH = 64;

interface MenuItemProps {
  icon: React.ComponentType;
  label: string;
  path?: string;
  subItems?: MenuItemProps[];
  onClick?: () => void;
}

interface SectionProps {
  label: string;
  items: MenuItemProps[];
}

function SideNav() {
  const [location, navigate] = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const { user, logout } = useUser();
  const theme = useTheme();
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (user && location === '/login') {
      navigate('/');
    }
  }, [user, location, navigate]);

  const isVendor = user?.role?.toLowerCase() === 'vendor';
  const isAdmin =
    user?.role?.toLowerCase() === 'user' &&
    user?.organizationRole?.toLowerCase() === 'owner';

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (isAdmin) {
      setOpenMenus((prev) => ({ ...prev, Administration: true }));
    }
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: 'Signed out', description: 'See you soon.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.',
      });
    }
  };

  const MenuItem = ({ icon: Icon, label, path, subItems, onClick }: MenuItemProps) => {
    const isSelected = path ? location === path : false;
    const hasSubItems = subItems && subItems.length > 0;
    const isOpen = !!openMenus[label];

    const handleClick = () => {
      if (onClick) {
        onClick();
      } else if (!collapsed && hasSubItems) {
        toggleMenu(label);
      } else if (path) {
        navigate(path);
      }
    };

    const button = (
      <ListItemButton
        selected={isSelected}
        onClick={handleClick}
        sx={{
          minHeight: 36,
          px: collapsed ? 1 : 1.25,
          mx: collapsed ? 0.75 : 1,
          mb: 0.25,
          borderRadius: '8px',
          position: 'relative',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: isSelected ? theme.palette.text.primary : theme.palette.text.secondary,
          '&::before': isSelected
            ? {
                content: '""',
                position: 'absolute',
                left: collapsed ? 6 : 0,
                top: 6,
                bottom: 6,
                width: 2,
                borderRadius: 2,
                background:
                  'linear-gradient(180deg, hsl(271, 91%, 65%), hsl(292, 84%, 73%))',
              }
            : {},
          '&.Mui-selected': {
            backgroundColor: alpha('#A855F7', 0.12),
            '&:hover': { backgroundColor: alpha('#A855F7', 0.18) },
            '& .MuiListItemIcon-root': { color: '#C084FC' },
          },
          '&:hover': {
            backgroundColor: alpha('#FFFFFF', 0.04),
            color: theme.palette.text.primary,
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 0 : 1.5,
            justifyContent: 'center',
            color: 'inherit',
            '& .MuiSvgIcon-root': { fontSize: '1.125rem' },
          }}
        >
          <Icon />
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={label}
              sx={{
                m: 0,
                '& .MuiTypography-root': {
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.8125rem',
                  letterSpacing: '-0.005em',
                  color: 'inherit',
                  lineHeight: 1.2,
                },
              }}
            />
            {hasSubItems && (
              <ChevronRightIcon
                sx={{
                  transform: isOpen ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                  fontSize: '1rem',
                  color: theme.palette.text.disabled,
                }}
              />
            )}
          </>
        )}
      </ListItemButton>
    );

    return (
      <>
        <ListItem disablePadding sx={{ display: 'block' }}>
          {collapsed ? (
            <Tooltip title={label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </ListItem>

        {hasSubItems && !collapsed && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 2 }}>
              {subItems!.map((item) => (
                <MenuItem key={item.label} {...item} />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  };

  const Section = ({ label, items }: SectionProps) => {
    if (items.length === 0) return null;
    return (
      <Box sx={{ mb: 1.5 }}>
        {!collapsed && (
          <Typography
            variant="overline"
            sx={{
              px: 2,
              pt: 1,
              pb: 0.5,
              display: 'block',
              color: theme.palette.text.disabled,
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.14em',
            }}
          >
            {label}
          </Typography>
        )}
        {collapsed && (
          <Box
            sx={{
              mx: 2,
              my: 1,
              height: '1px',
              backgroundColor: theme.palette.divider,
            }}
          />
        )}
        <List disablePadding>
          {items.map((item) => (
            <MenuItem key={item.label} {...item} />
          ))}
        </List>
      </Box>
    );
  };

  const vendorMenuItems: MenuItemProps[] = [
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

  const moduleConfigs: Record<string, { icon: React.ComponentType; path: string; group: 'core' | 'data' | 'ops' | 'learn' }> = {
    home: { icon: DashboardIcon, path: '/', group: 'core' },
    wastepoints: { icon: AutoDeleteIcon, path: '/waste-points', group: 'core' },
    sensors: { icon: SensorsIcon, path: '/sensors', group: 'core' },
    locations: { icon: LocationOnIcon, path: '/optimization', group: 'core' },
    vendors: { icon: LocalShippingIcon, path: '/vendor-directory', group: 'ops' },
    projects: { icon: AssignmentTurnedInIcon, path: '/projects', group: 'ops' },
    circular: { icon: LoopIcon, path: '/circular', group: 'ops' },
    alerts: { icon: NotificationsIcon, path: '/alerts', group: 'ops' },
    analytics: { icon: AnalyticsIcon, path: '/analytics', group: 'data' },
    advancedAnalytics: { icon: AnalyticsIcon, path: '/advanced-analytics', group: 'data' },
    dataModels: { icon: AccountTreeIcon, path: '/data-models', group: 'data' },
    dataBuilder: { icon: DatasetIcon, path: '/data-builder', group: 'data' },
    training: { icon: MenuBookIcon, path: '/training', group: 'learn' },
    help: { icon: HelpIcon, path: '/help', group: 'learn' },
  };

  const buildSection = (group: 'core' | 'data' | 'ops' | 'learn'): MenuItemProps[] =>
    visibleModules
      .map((key) => {
        const config = moduleConfigs[key as keyof typeof moduleConfigs];
        if (!config || config.group !== group) return null;
        return {
          icon: config.icon,
          label: moduleNames[key as keyof typeof moduleNames],
          path: config.path,
        };
      })
      .filter(Boolean) as MenuItemProps[];

  const adminMenuItems: MenuItemProps[] = isAdmin
    ? [
        {
          icon: AdminPanelSettingsIcon,
          label: 'Administration',
          subItems: [
            { icon: SupervisorAccountIcon, label: 'Vendor Management', path: '/admin/vendors' },
            { icon: ShoppingCartIcon, label: 'Product Listings', path: '/admin/products' },
            { icon: ConstructionIcon, label: 'Waste Calculator', path: '/admin/waste-calculator' },
          ],
        },
      ]
    : [];

  const settingsItems: MenuItemProps[] = [
    { icon: StoreIcon, label: 'Marketplace', path: '/products' },
    { icon: PersonIcon, label: 'Profile', path: '/profile' },
    { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    { icon: LogoutIcon, label: 'Sign out', onClick: handleLogout },
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
          backgroundColor: 'hsl(240, 10%, 6%)',
          backgroundImage: 'none',
          borderRight: `1px solid ${theme.palette.divider}`,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: 220,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Brand */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 0 : 2,
            py: 2,
            minHeight: 64,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Logo size={28} withText={!collapsed} />
        </Box>

        {/* Status bar */}
        {!collapsed && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.25,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <FiberManualRecordIcon
              sx={{ fontSize: 8, color: 'hsl(158, 64%, 55%)' }}
            />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                letterSpacing: '0.04em',
              }}
            >
              SYSTEM ONLINE
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography
              variant="caption"
              sx={{
                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                fontSize: '0.65rem',
                color: theme.palette.text.disabled,
                letterSpacing: '0.04em',
              }}
            >
              v2.4.0
            </Typography>
          </Box>
        )}

        {/* Nav */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
          {isVendor ? (
            <Section label="Vendor" items={vendorMenuItems} />
          ) : (
            <>
              <Section label="Workspace" items={buildSection('core')} />
              <Section label="Operations" items={[...buildSection('ops'), ...adminMenuItems]} />
              <Section label="Intelligence" items={buildSection('data')} />
              <Section label="Resources" items={buildSection('learn')} />
            </>
          )}
        </Box>

        {/* Settings */}
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, py: 1 }}>
          <List disablePadding>
            {settingsItems.map((item) => (
              <MenuItem key={item.label} {...item} />
            ))}
          </List>
        </Box>

        {/* Collapse toggle */}
        <Box
          sx={{
            p: 1,
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '6px',
              width: 28,
              height: 28,
              '& .MuiSvgIcon-root': { fontSize: '1rem' },
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
