import { create } from 'zustand';

export interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentPage: string;
  notifications: Notification[];
  loading: boolean;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // 初始状态
  theme: 'light',
  sidebarOpen: true,
  currentPage: 'trading',
  notifications: [],
  loading: false,

  // 操作方法
  setTheme: (theme) => set({ theme }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setCurrentPage: (page) => set({ currentPage: page }),

  addNotification: (notification) => set((state) => ({
    notifications: [
      ...state.notifications,
      {
        ...notification,
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now()
      }
    ]
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  setLoading: (loading) => set({ loading })
}));
