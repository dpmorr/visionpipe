import { create } from 'zustand';

interface SidebarStore {
  width: number;
  collapsed: boolean;
  setWidth: (width: number) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebar = create<SidebarStore>((set) => ({
  width: 250, // Default width
  collapsed: false,
  setWidth: (width) => set({ width }),
  setCollapsed: (collapsed) => set({ collapsed }),
}));
