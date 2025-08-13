import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, CheckCircle, AlertCircle, Lightbulb, BookOpen } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'hint' | 'tutorial';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  isVisible 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    info: <Info size={20} className="flex-shrink-0" />,
    success: <CheckCircle size={20} className="flex-shrink-0" />,
    error: <AlertCircle size={20} className="flex-shrink-0" />,
    hint: <Lightbulb size={20} className="flex-shrink-0" />,
    tutorial: <BookOpen size={20} className="flex-shrink-0" />
  };

  const styles = {
    info: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25',
    error: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25',
    hint: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-yellow-500/25',
    tutorial: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/25'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 350, 
            damping: 25,
            mass: 0.5
          }}
          className={`fixed top-2 left-2 right-2 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 
                     ${styles[type]} rounded-xl shadow-2xl backdrop-blur-sm
                     px-4 py-3 flex items-center gap-3 sm:min-w-[320px] sm:max-w-md
                     border border-white/20`}
        >
          <div className="p-1.5 bg-white/20 rounded-lg">
            {icons[type]}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">{message}</p>
            {type === 'hint' && (
              <p className="text-xs opacity-90 mt-0.5">
                Hint usage = 0 points for this level
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close notification"
          >
            <X size={16} className="opacity-80" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;