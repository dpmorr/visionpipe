import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationModule = 
  | 'home'
  | 'wastepoints'
  | 'projects'
  | 'vendors'
  | 'sensors'
  | 'locations'
  | 'circular'
  | 'analytics'
  | 'training'
  | 'help'
  | 'dataModels'
  | 'advancedAnalytics'
  | 'alerts'
  | 'dataBuilder';

interface NavigationModulesState {
  visibleModules: NavigationModule[];
  toggleModule: (module: NavigationModule) => void;
  setModules: (modules: NavigationModule[]) => void;
  resetToDefault: () => void;
  resetToModeDefault: (mode: 'simple' | 'advanced') => void;
}

export const allModules: NavigationModule[] = [
  'home',
  'wastepoints',
  'projects',
  'vendors',
  'sensors',
  'locations',
  'circular',
  'analytics',
  'training',
  'help',
  'dataModels',
  'advancedAnalytics',
  'alerts',
  'dataBuilder'
];

const defaultSimpleModules: NavigationModule[] = [
  'home',
  'wastepoints',
  'projects',
  'vendors',
  'sensors',
  'locations',
  'circular',
  'analytics',
  'training',
  'alerts',
  'help'
];

const defaultAdvancedModules: NavigationModule[] = [
  'home',
  'dataModels',
  'advancedAnalytics',
  'alerts',
  'help'
];

export const useNavigationModulesStore = create<NavigationModulesState>()(
  persist(
    (set, get) => ({
      visibleModules: defaultSimpleModules,
      toggleModule: (module) =>
        set((state) => ({
          visibleModules: state.visibleModules.includes(module)
            ? state.visibleModules.filter((m) => m !== module)
            : [...state.visibleModules, module],
        })),
      setModules: (modules) => set({ visibleModules: modules }),
      resetToDefault: () => set({ visibleModules: defaultSimpleModules }),
      resetToModeDefault: (mode) => set({ 
        visibleModules: mode === 'simple' ? defaultSimpleModules : defaultAdvancedModules 
      }),
    }),
    {
      name: 'navigation-modules',
    }
  )
);

const moduleTranslations: Record<NavigationModule, string> = {
  home: 'Home',
  wastepoints: 'Wastepoints',
  projects: 'Projects',
  vendors: 'Vendors',
  sensors: 'Sensors',
  locations: 'Locations',
  circular: 'Circular',
  analytics: 'Analytics',
  training: 'Training',
  help: 'Help',
  dataModels: 'Data Models',
  advancedAnalytics: 'Advanced Analytics',
  alerts: 'Alerts',
  dataBuilder: 'Data Builder',
};

export const moduleNames: Record<NavigationModule, string> = moduleTranslations;

export const moduleCategories = {
  simple: defaultSimpleModules,
  advanced: defaultAdvancedModules
}; 