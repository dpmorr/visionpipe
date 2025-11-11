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

const STORAGE_KEY = 'app.customization';

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
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...initialSettings, ...JSON.parse(stored) } : initialSettings;
    } catch (err) {
      console.error('Failed to restore theme settings:', err);
      return initialSettings;
    }
  });

  const saveSettings = (update: Partial<Settings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...update };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (err) {
        console.error('Failed to save theme settings:', err);
      }
      return newSettings;
    });
  };

  return (
    <CustomizationContext.Provider value={{ settings, saveSettings }}>
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
