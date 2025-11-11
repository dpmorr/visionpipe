import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'simple' | 'advanced';

interface AppModeState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

export const useAppModeStore = create<AppModeState>()(
  persist(
    (set) => ({
      mode: 'simple',
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'simple' ? 'advanced' : 'simple' 
      })),
    }),
    {
      name: 'app-mode',
    }
  )
); 