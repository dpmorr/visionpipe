import { type Theme, type Direction, type PaletteMode, type ThemeOptions } from '@mui/material';
import { createTheme as createMuiTheme } from '@mui/material/styles';
import { colors, neutral, generateColorScale } from './colors';
import { createComponents } from './components';

export type ColorPreset = 
  | 'emerald'     // Primary sustainability color
  | 'greenery'    // Nature-inspired green  
  | 'monacoBlue'  // Ocean-inspired blue
  | 'livingCoral' // Warm accent
  | 'ultraViolet' // Innovation purple
  | 'roseQuartz'  // Soft accent
  | 'honeyGold';  // Energy yellow

export type Layout = 'vertical' | 'horizontal';

export interface ThemeConfig {
  colorPreset?: ColorPreset;
  direction?: Direction;
  paletteMode?: PaletteMode;
  layout?: Layout;
}

const baseTheme: ThemeOptions = {
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1440
    }
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.35
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.45
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57
    },
    button: {
      fontWeight: 600
    }
  }
};

function createTheme(config: ThemeConfig = {}): Theme {
  const { 
    colorPreset = 'emerald', 
    direction = 'ltr', 
    paletteMode = 'light', 
    layout = 'vertical' 
  } = config;

  const colorScale = generateColorScale(colors[colorPreset].main, paletteMode);

  const themeOptions: ThemeOptions = {
    ...baseTheme,
    direction,
    palette: {
      mode: paletteMode,
      primary: colorScale,
      background: {
        default: paletteMode === 'light' ? '#f8fafc' : '#0f172a',
        paper: paletteMode === 'light' ? '#ffffff' : '#1e293b'
      },
      text: {
        primary: paletteMode === 'light' ? neutral[900] : neutral[100],
        secondary: paletteMode === 'light' ? neutral[600] : neutral[400]
      },
      neutral,
      ...(paletteMode === 'dark' && {
        action: {
          active: '#fff',
          hover: 'rgba(255, 255, 255, 0.04)',
          selected: 'rgba(255, 255, 255, 0.08)',
          disabled: 'rgba(255, 255, 255, 0.26)',
          disabledBackground: 'rgba(255, 255, 255, 0.12)',
          focus: 'rgba(255, 255, 255, 0.12)'
        },
      }),
    },
    components: createComponents(paletteMode)
  };

  const theme = createMuiTheme(themeOptions);
  (theme as any).layout = layout;

  return theme;
}

export { createTheme };