import React from 'react';
import { useToastStore } from '../store/toast-store';
import { AppToast } from './ui/app-toast';

export function GlobalToast() {
  const toast = useToastStore((state) => state.toast);
  
  if (!toast) return null;
  
  return (
    <AppToast
      message={toast.message}
      type={toast.type}
      visible={toast.visible}
    />
  );
}
