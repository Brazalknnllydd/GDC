import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

export type ToastStore = {
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toast: null,
  showToast: (message, type = 'success') => set({ toast: { message, type, visible: true } }),
  hideToast: () => set((state) => state.toast ? { toast: { ...state.toast, visible: false } } : state),
}));
