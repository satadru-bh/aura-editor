import React from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts?: ToastMessage[];
  onDismiss?: (id: string) => void;
}

// Notifications removed per user preference - renders nothing
export const Toast: React.FC<ToastProps> = () => null;

