import { createContext, useContext, useState, ReactNode } from 'react';
import type { Direction, PaletteMode } from '@mui/material';
import { ColorPreset } from '@/theme';

export type Layout = 'vertical' | 'horizontal';

interface Settings {
  colorPreset: ColorPreset;
  direction: Direction;
  layout: Layout;
  paletteMode: PaletteMode;
  isInitialized: boolean;
}

const initialSettings: Settings = {
  colorPreset: 'emerald',
  direction: 'ltr',
  layout: 'vertical',
  paletteMode: 'light',
  isInitialized: true
};

export interface CustomizationContextType {
  settings: Settings;
  saveSettings: (update: Partial<Settings>) => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

interface CustomizationProviderProps {
  children: ReactNode;
}

export function CustomizationProvider({ children }: CustomizationProviderProps) {
  const [settings, setSettings] = useState<Settings>(initialSettings);

  const saveSettings = (update: Partial<Settings>) => {
    setSettings((prev) => ({
      ...prev,
      ...update
    }));
  };

  const value = { settings, saveSettings };

  return (
    <CustomizationContext.Provider value={value}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context.settings;
}

export function useCustomizationUpdate() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomizationUpdate must be used within a CustomizationProvider');
  }
  return context.saveSettings;
}