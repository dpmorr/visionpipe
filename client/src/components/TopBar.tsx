import { Box, Stack, IconButton, Tooltip, InputBase, alpha, useTheme, Typography, Chip } from '@mui/material';
import {
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon,
  HelpOutline as HelpIcon,
  KeyboardCommandKey as CommandIcon,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import ProfileDropdown from './ProfileDropdown';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Workspace overview',
  '/analytics': 'Analytics',
  '/alerts': 'Alerts',
  '/compliance': 'Compliance',
  '/material-analysis': 'Material analysis',
  '/sensors': 'Sensors',
  '/integrations': 'Integrations',
  '/vendor-directory': 'Vendor directory',
  '/products': 'Marketplace',
  '/process-maker': 'Process maker',
  '/invoicing': 'Invoicing',
  '/projects': 'Projects',
  '/report-generator': 'Report generator',
  '/training': 'Training',
  '/certifications': 'Certifications',
  '/schedule': 'Schedule',
  '/carbon': 'Carbon',
  '/waste-points': 'Waste points',
  '/optimization': 'Locations',
  '/data-builder': 'Data builder',
  '/data-models': 'Data models',
  '/help': 'Help',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/organization': 'Organization',
};

function pageTitleFor(path: string) {
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];
  const seg = path.split('/').filter(Boolean)[0] || '';
  if (!seg) return 'Workspace';
  return seg.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TopBar() {
  const theme = useTheme();
  const [location] = useLocation();
  const title = pageTitleFor(location);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        px: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        backgroundColor: alpha('#08080B', 0.85),
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: '0.7rem',
            color: theme.palette.text.disabled,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          / Workspace
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: theme.palette.text.primary, whiteSpace: 'nowrap' }}
        >
          {title}
        </Typography>
        <Chip
          size="small"
          label="LIVE"
          sx={{
            height: 20,
            fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontWeight: 600,
            letterSpacing: '0.08em',
            color: 'hsl(158, 64%, 65%)',
            backgroundColor: 'hsla(158, 64%, 45%, 0.12)',
            border: '1px solid hsla(158, 64%, 45%, 0.4)',
          }}
        />
      </Stack>

      <Box sx={{ flex: 1 }} />

      {/* Search */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1,
          width: 320,
          height: 34,
          px: 1.5,
          borderRadius: '8px',
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha('#FFFFFF', 0.02),
          color: theme.palette.text.secondary,
          transition: 'border-color 0.15s ease',
          '&:hover': { borderColor: theme.palette.divider },
          '&:focus-within': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`,
          },
        }}
      >
        <SearchIcon sx={{ fontSize: 16 }} />
        <InputBase
          placeholder="Search facilities, sensors, vendors…"
          sx={{
            flex: 1,
            fontSize: '0.8125rem',
            color: theme.palette.text.primary,
            '& input::placeholder': { color: theme.palette.text.disabled, opacity: 1 },
          }}
        />
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            px: 0.75,
            py: 0.25,
            borderRadius: '4px',
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.disabled,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: '0.65rem',
          }}
        >
          <CommandIcon sx={{ fontSize: 10 }} />K
        </Box>
      </Box>

      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Tooltip title="Help">
          <IconButton size="small">
            <HelpIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Notifications">
          <IconButton size="small">
            <NotificationsIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Box sx={{ width: 1, height: 24, bgcolor: theme.palette.divider, mx: 0.5 }} />
        <ProfileDropdown />
      </Stack>
    </Box>
  );
}
