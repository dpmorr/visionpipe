import { Components } from '@mui/material/styles';
import { PaletteMode, alpha, backdropClasses, tableCellClasses } from '@mui/material';
import { BORDER_RADIUS, SPACING_UNIT } from './utils';
import { neutral } from './colors';

export const createComponents = (mode: PaletteMode): Components => {
  return {
    MuiToolbar: {
      styleOverrides: {
        root: {
          width: '100%',
          minHeight: '64px',
          padding: `${SPACING_UNIT}px ${SPACING_UNIT * 2}px`,
        },
        gutters: {
          paddingLeft: SPACING_UNIT * 2,
          paddingRight: SPACING_UNIT * 2,
          [`.MuiDrawer-root + &`]: {
            paddingLeft: 0,
          },
        },
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? neutral[500] : neutral[700],
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        body: {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%'
        },
        '#root': {
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          height: '100%',
          width: '100%'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: BORDER_RADIUS,
          padding: '8px 16px',
          '&.MuiButton-contained': {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          '&.Mui-focusVisible': {
            outline: 'solid 2px currentColor',
            outlineOffset: 2,
          },
        },
        outlinedSecondary: {
          borderColor: mode === 'light' ? neutral[400] : neutral[800],
          backgroundColor: mode === 'light' ? '#fff' : alpha(neutral[900], 0.4),
          '&:hover': {
            borderColor: mode === 'light' ? neutral[500] : neutral[700],
            backgroundColor: mode === 'light'
              ? alpha(neutral[50], 0.8)
              : alpha(neutral[800], 0.4),
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
          padding: SPACING_UNIT * 2,
          boxShadow: mode === 'light'
            ? '0px 1px 3px rgba(0, 0, 0, 0.1)'
            : '0px 1px 3px rgba(0, 0, 0, 0.2)',
        }
      }
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: SPACING_UNIT * 2,
        },
        title: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
        subheader: {
          fontSize: '0.875rem',
          color: mode === 'light' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)',
        },
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: SPACING_UNIT * 2,
          '&:last-child': {
            paddingBottom: SPACING_UNIT * 2,
          },
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: BORDER_RADIUS,
            backgroundColor: mode === 'light' ? '#fff' : neutral[900],
            '& fieldset': {
              borderColor: mode === 'light' ? neutral[200] : neutral[700],
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? neutral[300] : neutral[600],
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? 'primary.main' : 'primary.light',
            },
          },
        }
      }
    },
    MuiTable: {
      styleOverrides: {
        root: {
          [`& .${tableCellClasses.head}`]: {
            backgroundColor: mode === 'light'
              ? alpha(neutral[50], 0.4)
              : alpha(neutral[900], 0.4),
            color: mode === 'light' ? neutral[900] : neutral[100],
          },
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          [`& .${tableCellClasses.root}`]: {
            backgroundColor: mode === 'light'
              ? alpha(neutral[50], 0.4)
              : alpha(neutral[900], 0.4),
            color: mode === 'light' ? neutral[900] : neutral[100],
          },
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'light' ? neutral[200] : neutral[700]}`,
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: mode === 'light'
              ? alpha(neutral[50], 0.2)
              : alpha(neutral[900], 0.2),
          },
          '&:hover': {
            backgroundColor: mode === 'light'
              ? alpha(neutral[50], 0.4)
              : alpha(neutral[900], 0.4),
          },
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: BORDER_RADIUS,
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS,
        },
        standardSuccess: {
          backgroundColor: mode === 'light' ? '#edf7ed' : '#132f1a',
        },
        standardError: {
          backgroundColor: mode === 'light' ? '#fdeded' : '#2e1515',
        },
        standardWarning: {
          backgroundColor: mode === 'light' ? '#fff4e5' : '#332114',
        },
        standardInfo: {
          backgroundColor: mode === 'light' ? '#e8f4fd' : '#0d2031',
        },
      }
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          [`&:not(.${backdropClasses.invisible})`]: {
            backgroundColor: alpha(mode === 'light' ? neutral[900] : neutral[900], 0.5),
          },
        },
      },
    },
  };
};