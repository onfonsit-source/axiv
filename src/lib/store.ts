import { create } from 'zustand';

interface AppState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  // Favorites
  favoriteIds: string[];
  setFavoriteIds: (ids: string[]) => void;

  // Toast State
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  };
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;

  // Confirm Modal State
  confirm: {
    title: string;
    message: string;
    visible: boolean;
    onConfirm: (() => void) | null;
  };
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  hideConfirm: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  selectedCategory: 'all',
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  // Favorites
  favoriteIds: [],
  setFavoriteIds: (ids) => set({ favoriteIds: ids }),

  toast: { message: '', type: 'info', visible: false },
  showToast: (message, type = 'info') => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => set((state) => ({ toast: { ...state.toast, visible: false } })), 3000);
  },
  hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),

  confirm: { title: '', message: '', visible: false, onConfirm: null },
  showConfirm: (title, message, onConfirm) => set({
    confirm: { title, message, visible: true, onConfirm }
  }),
  hideConfirm: () => set((state) => ({ confirm: { ...state.confirm, visible: false } })),
}));
