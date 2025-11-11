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

const theme = createTheme({
  palette: {
    primary: {
      main: '#052926',
      light: '#0a4a46',
      dark: '#031a18',
      contrastText: '#FFFFFF',
    },
    login: {
      main: '#052926',
    },
    secondary: {
      main: '#3F51B5',
      light: '#7986CB',
      dark: '#303F9F',
      contrastText: '#FFFFFF',
    },
    neutral: {
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '&.MuiButton-contained': {
            backgroundColor: '#04a2fe',
            '&:hover': {
              backgroundColor: '#0388d4',
            },
          },
          '&.MuiButton-outlined': {
            borderColor: '#04a2fe',
            color: '#04a2fe',
            '&:hover': {
              borderColor: '#0388d4',
              color: '#0388d4',
            },
          },
          '&.MuiButton-text': {
            color: '#04a2fe',
            '&:hover': {
              backgroundColor: alpha('#04a2fe', 0.08),
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            color: '#04a2fe',
          },
          '&:hover': {
            color: '#04a2fe',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#04a2fe',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: alpha('#04a2fe', 0.12),
            '&:hover': {
              backgroundColor: alpha('#04a2fe', 0.16),
            },
          },
          '&:hover': {
            backgroundColor: alpha('#04a2fe', 0.08),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#04a2fe',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (min-width: 1440px)': {
            maxWidth: '1640px',
          },
          '&.MuiContainer-root': {
            '&:not(.dashboard-container)': {
              '@media (min-width: 600px)': {
                paddingLeft: '24px',
                paddingRight: '24px',
              },
            },
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
            margin: '0 2px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#D1D5DB',
            borderRadius: '4px',
            margin: '0 2px',
          },
          '&::-webkit-scrollbar-button': {
            display: 'none',
          },
        },
      },
    },
  },
});

export default theme;
