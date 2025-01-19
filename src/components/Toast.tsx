import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string | null;
  type?: 'error' | 'success' | 'info';
  onDismiss: () => void;
}

export function Toast({ message, type = 'error', onDismiss }: ToastProps) {
  if (!message) return null;

  const bgColor = {
    error: 'bg-red-500',
    success: 'bg-green-500',
    info: 'bg-blue-500'
  }[type];

  return (
    <AnimatePresence>
      <div className="fixed top-4 right-4 z-[100]">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px]`}
        >
          <span className="flex-1">{message}</span>
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-white/20 rounded"
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
