import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type HomePageModule = 
  | 'metrics'
  | 'impactMeter'
  | 'goals'
  | 'disposalAnalytics'
  | 'recommendations'
  | 'trends'
  | 'initiatives'
  | 'leaderboard'
  | 'pickups'
  | 'sankey';

interface HomePageStore {
  visibleModules: HomePageModule[];
  toggleModule: (module: HomePageModule) => void;
}

export const useHomePageStore = create<HomePageStore>()(
  persist(
    (set) => ({
      visibleModules: [
        'metrics',
        'impactMeter',
        'goals',
        'disposalAnalytics',
        'recommendations',
        'trends',
        'initiatives',
        'leaderboard',
        'pickups',
        'sankey'
      ],
      toggleModule: (module) =>
        set((state) => ({
          visibleModules: state.visibleModules.includes(module)
            ? state.visibleModules.filter((m) => m !== module)
            : [...state.visibleModules, module]
        }))
    }),
    {
      name: 'homepage-layout'
    }
  )
);

const moduleTranslations: Record<HomePageModule, string> = {
  metrics: 'Metrics',
  impactMeter: 'Impact Meter',
  goals: 'Goals',
  disposalAnalytics: 'Disposal Analytics',
  recommendations: 'Recommendations',
  trends: 'Trends',
  initiatives: 'Initiatives',
  leaderboard: 'Leaderboard',
  pickups: 'Pickups',
  sankey: 'Sankey Chart'
};

export const moduleNames: Record<HomePageModule, string> = {
  metrics: 'Metrics',
  impactMeter: 'Impact Meter',
  goals: 'Goals',
  disposalAnalytics: 'Disposal Analytics',
  recommendations: 'Recommendations',
  trends: 'Trends',
  initiatives: 'Initiatives',
  leaderboard: 'Leaderboard',
  pickups: 'Pickups',
  sankey: 'Sankey Chart'
};