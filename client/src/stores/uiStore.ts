import { create } from 'zustand';

interface UIState {
  // Loading states
  isGlobalLoading: boolean;
  loadingMessage: string;
  
  // Modal states
  isCreateProjectModalOpen: boolean;
  isSimulationModalOpen: boolean;
  isDocumentModalOpen: boolean;
  
  // Toast notifications
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
  
  // Actions
  setGlobalLoading: (loading: boolean, message?: string) => void;
  setCreateProjectModalOpen: (open: boolean) => void;
  setSimulationModalOpen: (open: boolean) => void;
  setDocumentModalOpen: (open: boolean) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  isGlobalLoading: false,
  loadingMessage: '',
  isCreateProjectModalOpen: false,
  isSimulationModalOpen: false,
  isDocumentModalOpen: false,
  toasts: [],

  // Actions
  setGlobalLoading: (loading: boolean, message: string = '') => {
    set({ isGlobalLoading: loading, loadingMessage: message });
  },

  setCreateProjectModalOpen: (open: boolean) => {
    set({ isCreateProjectModalOpen: open });
  },

  setSimulationModalOpen: (open: boolean) => {
    set({ isSimulationModalOpen: open });
  },

  setDocumentModalOpen: (open: boolean) => {
    set({ isDocumentModalOpen: open });
  },

  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now().toString();
    set({ toasts: [...get().toasts, { id, message, type }] });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id: string) => {
    set({ toasts: get().toasts.filter(toast => toast.id !== id) });
  },
}));