import { darken, lighten, type PaletteMode } from '@mui/material';

export interface ColorScale {
  light: string;
  main: string;
  dark: string;
  darkest?: string;
  contrastText: string;
}

const common = {
  white: '#ffffff',
  black: '#151821',
  neutral: '#14191e'
};

// Sustainability-focused color palette with extended color scales
export const colors = {
  emerald: { 
    main: '#37b5fe',
    light: '#6cc7ff',
    dark: '#0094e5',
    darkest: '#006cc7'
  },
  greenery: { 
    main: '#37b5fe',
    light: '#6cc7ff',
    dark: '#0094e5',
    darkest: '#006cc7'
  },
  monacoBlue: { 
    main: '#0288D1',
    light: '#03A9F4',
    dark: '#01579B',
    darkest: '#023E6B'
  },
  livingCoral: { 
    main: '#FF6B6B',
    light: '#FF8A8A',
    dark: '#E64A4A',
    darkest: '#B33A3A'
  },
  ultraViolet: { 
    main: '#6B4EE6',
    light: '#896FEA',
    dark: '#4F35CC',
    darkest: '#3A269B'
  },
  roseQuartz: { 
    main: '#E57373',
    light: '#EF9A9A',
    dark: '#EF5350',
    darkest: '#B71C1C'
  },
  honeyGold: { 
    main: '#FFA000',
    light: '#FFB74D',
    dark: '#FF8F00',
    darkest: '#E65100'
  }
} as const;

export const neutral = {
  25: lighten(common.neutral, 0.98),
  50: lighten(common.neutral, 0.96),
  100: lighten(common.neutral, 0.93),
  200: lighten(common.neutral, 0.9),
  300: lighten(common.neutral, 0.85),
  400: lighten(common.neutral, 0.77),
  500: lighten(common.neutral, 0.68),
  600: lighten(common.neutral, 0.5),
  700: lighten(common.neutral, 0.4),
  800: lighten(common.neutral, 0.2),
  900: common.neutral,
} as const;

export function generateColorScale(mainColor: string, mode: PaletteMode): ColorScale {
  const light = mode === 'light'
    ? lighten(mainColor, 0.2)
    : lighten(mainColor, 0.3);

  const dark = mode === 'light'
    ? darken(mainColor, 0.1)
    : darken(mainColor, 0.2);

  const darkest = mode === 'light'
    ? darken(mainColor, 0.4)
    : darken(mainColor, 0.5);

  return {
    light,
    main: mainColor,
    dark,
    darkest,
    contrastText: common.white
  };
}