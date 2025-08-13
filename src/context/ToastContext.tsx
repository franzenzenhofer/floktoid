import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    duration: number;
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    duration: 3000,
    isVisible: false
  });

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    setToast({ message, type, duration, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};