import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, WarningCircle, Info, XCircle } from "@phosphor-icons/react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={20} weight="fill" className="text-[var(--success)]" />,
  error: <XCircle size={20} weight="fill" className="text-[var(--error)]" />,
  warning: <WarningCircle size={20} weight="fill" className="text-[var(--warning)]" />,
  info: <Info size={20} weight="fill" className="text-[var(--primary)]" />,
};

/** Provider global de toasts: cualquier pantalla llama a useToast() sin
 * tener que manejar su propio estado de visibilidad (a diferencia del
 * patrón original de Farmora, donde cada página lo hacía por su cuenta). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message, variant = "info", duration = 3200) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] shadow-lg rounded-xl px-4 py-3 text-sm text-[var(--text)]"
            >
              {ICONS[t.variant]}
              <span className="flex-1">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
