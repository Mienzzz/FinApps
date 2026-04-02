import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDark?: boolean;
}

export default function Modal({ open, onClose, children, isDark }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">

          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`absolute inset-0 ${
              isDark ? 'bg-black/80' : 'bg-black/40'
            } backdrop-blur-sm`}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 w-full max-w-md rounded-2xl border p-6 ${
              isDark
                ? 'bg-slate-900 border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-xl'
            }`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
