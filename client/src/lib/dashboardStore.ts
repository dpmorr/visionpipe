import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DashboardModule = 
  | 'metrics'
  | 'quickActions'
  | 'goals'
  | 'initiatives'
  | 'trends'
  | 'pickups'
  | 'impactMeter'
  | 'leaderboard'
  | 'recommendations'
  | 'disposalAnalytics';

export interface MetricHistory {
  timestamp: string;
  value: number;
}

export interface DashboardMetrics {
  wasteReduction?: number;
  recyclingRate?: number;
  carbonFootprint?: number;
  costSavings?: number;
  vendorPerformance?: number;
  history?: {
    wasteReduction: MetricHistory[];
    recyclingRate: MetricHistory[];
    carbonFootprint: MetricHistory[];
    costSavings: MetricHistory[];
    vendorPerformance: MetricHistory[];
  };
}

export interface CarbonImpact {
  wasteReduction: number;
  carbonSavings: number;
  energySavings: number;
}

export interface QuickAction {
  title: string;
  icon: JSX.Element;
  description: string;
  link: string;
  color: string;
  bgColor: string;
}

interface DashboardState {
  visibleModules: DashboardModule[];
  toggleModule: (module: DashboardModule) => void;
  setModules: (modules: DashboardModule[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      visibleModules: ['metrics', 'quickActions', 'goals', 'initiatives', 'trends', 'pickups'],
      toggleModule: (module) =>
        set((state) => ({
          visibleModules: state.visibleModules.includes(module)
            ? state.visibleModules.filter((m) => m !== module)
            : [...state.visibleModules, module],
        })),
      setModules: (modules) => set({ visibleModules: modules }),
    }),
    {
      name: 'dashboard-layout',
    }
  )
);