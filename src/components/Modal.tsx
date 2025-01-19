import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  fullScreen = false,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />
          <div 
            className={`fixed inset-0 z-50 ${!fullScreen && 'p-4'}`}
            onClick={handleContainerClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1]
              }}
              className={`
                bg-[var(--bg-color)] shadow-xl
                ${fullScreen 
                  ? 'fixed inset-0 rounded-none' 
                  : `m-auto rounded-lg ${sizeClasses[size]} w-full`}
                ${className}
              `}
            >
              <div className={`
                flex justify-between items-center border-b border-[var(--border)]
                ${fullScreen ? 'px-6 py-4' : 'px-4 py-3'}
              `}>
                <h2 className={`
                  font-medium tracking-tight
                  ${fullScreen ? 'text-xl' : 'text-lg'}
                `}>
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-hover)]"
                  aria-label="Close modal"
                >
                  <svg
                    className={`${fullScreen ? 'w-6 h-6' : 'w-5 h-5'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className={fullScreen ? '' : 'p-4'}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
