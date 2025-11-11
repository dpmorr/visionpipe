// Theme constants
export const BORDER_RADIUS = 8;
export const SPACING_UNIT = 8;

// Theme utilities
export const pxToRem = (px: number): string => `${px / 16}rem`;
export const remToPx = (rem: string): number => parseFloat(rem) * 16;
