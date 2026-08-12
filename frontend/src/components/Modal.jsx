import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "@phosphor-icons/react";

export default function Modal({ open, onClose, title, children }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="w-full sm:max-w-md bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--background)]"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
