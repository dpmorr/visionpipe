import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    neutral: {
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    login: {
      main: string;
    };
  }

  interface PaletteOptions {
    neutral?: {
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    login?: {
      main: string;
    };
  }
}

// Industrial dark palette — Ultralytics-inspired
export const palette = {
  bg: '#08080B',
  surface: '#101015',
  surfaceElevated: '#16161D',
  surfaceHover: '#1C1C26',
  border: '#26262F',
  borderSubtle: '#1B1B22',
  borderStrong: '#33333E',
  text: '#F4F4F5',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  accent: '#A855F7',
  accentHover: '#9333EA',
  accentSubtle: '#3B0764',
  accentBright: '#C084FC',
  magenta: '#E879F9',
  cyan: '#22D3EE',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: palette.accent,
      light: palette.accentBright,
      dark: palette.accentHover,
      contrastText: '#FFFFFF',
    },
    login: {
      main: palette.accent,
    },
    secondary: {
      main: palette.cyan,
      light: '#67E8F9',
      dark: '#0891B2',
      contrastText: '#020617',
    },
    error: { main: palette.danger },
    warning: { main: palette.warning },
    success: { main: palette.success },
    neutral: {
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D4D4D8',
      400: '#A1A1AA',
      500: '#71717A',
      600: '#52525B',
      700: '#3F3F46',
      800: '#27272A',
      900: '#18181B',
    },
    background: {
      default: palette.bg,
      paper: palette.surface,
    },
    text: {
      primary: palette.text,
      secondary: palette.textSecondary,
      disabled: palette.textTertiary,
    },
    divider: palette.border,
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.025em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.015em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600, letterSpacing: '-0.005em' },
    button: { fontWeight: 500, letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.12em', fontWeight: 600, fontSize: '0.7rem' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          transition: 'all 0.15s ease',
        },
        containedPrimary: {
          backgroundColor: palette.accent,
          color: '#FFFFFF',
          backgroundImage: `linear-gradient(135deg, ${palette.accent} 0%, ${palette.magenta} 100%)`,
          boxShadow: `0 0 0 1px ${alpha(palette.accent, 0.4)}, 0 4px 16px ${alpha(palette.accent, 0.25)}`,
          '&:hover': {
            backgroundImage: `linear-gradient(135deg, ${palette.accentHover} 0%, ${palette.magenta} 100%)`,
            boxShadow: `0 0 0 1px ${alpha(palette.accent, 0.6)}, 0 6px 20px ${alpha(palette.accent, 0.35)}`,
          },
        },
        outlinedPrimary: {
          borderColor: palette.border,
          color: palette.text,
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: palette.accent,
            color: palette.accentBright,
            backgroundColor: alpha(palette.accent, 0.08),
          },
        },
        textPrimary: {
          color: palette.accentBright,
          '&:hover': {
            backgroundColor: alpha(palette.accent, 0.1),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: palette.textSecondary,
          '&:hover': {
            backgroundColor: alpha(palette.accent, 0.1),
            color: palette.accentBright,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: palette.surfaceElevated,
          borderRadius: 8,
          '& fieldset': { borderColor: palette.border },
          '&:hover fieldset': { borderColor: palette.borderStrong },
          '&.Mui-focused fieldset': {
            borderColor: palette.accent,
            borderWidth: 1,
            boxShadow: `0 0 0 3px ${alpha(palette.accent, 0.18)}`,
          },
        },
        input: {
          color: palette.text,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: palette.textSecondary,
          '&.Mui-focused': { color: palette.accentBright },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: palette.textSecondary,
          minHeight: 44,
          '&.Mui-selected': { color: palette.text },
          '&:hover': { color: palette.text },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${palette.border}`,
          minHeight: 44,
        },
        indicator: {
          height: 2,
          backgroundColor: palette.accent,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: palette.surface,
          backgroundImage: 'none',
          borderBottom: `1px solid ${palette.border}`,
          color: palette.text,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.surface,
          backgroundImage: 'none',
          borderRight: `1px solid ${palette.border}`,
          color: palette.text,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&.Mui-selected': {
            backgroundColor: alpha(palette.accent, 0.14),
            color: palette.text,
            '&:hover': { backgroundColor: alpha(palette.accent, 0.2) },
          },
          '&:hover': { backgroundColor: alpha('#FFFFFF', 0.04) },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: palette.textSecondary },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: palette.surface,
          backgroundImage: 'none',
          border: `1px solid ${palette.border}`,
          borderRadius: 12,
          boxShadow: 'none',
          transition: 'border-color 0.15s ease, transform 0.15s ease',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: palette.border },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          backgroundColor: palette.surfaceElevated,
          border: `1px solid ${palette.border}`,
          color: palette.text,
        },
        outlined: {
          borderColor: palette.border,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.surfaceElevated,
          color: palette.text,
          border: `1px solid ${palette.border}`,
          fontSize: '0.75rem',
          fontWeight: 500,
        },
        arrow: { color: palette.surfaceElevated },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.surfaceElevated,
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1440px)': { maxWidth: '1640px' },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'dark',
        },
        body: {
          backgroundColor: palette.bg,
          color: palette.text,
        },
        '*': {
          '&::-webkit-scrollbar': { width: '8px', height: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: palette.border,
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: palette.borderStrong,
          },
          '&::-webkit-scrollbar-button': { display: 'none' },
        },
        '::selection': {
          backgroundColor: alpha(palette.accent, 0.4),
          color: '#FFFFFF',
        },
      },
    },
  },
});

export default theme;
