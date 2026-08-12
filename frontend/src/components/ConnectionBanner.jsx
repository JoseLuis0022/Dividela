import { AnimatePresence, motion } from "framer-motion";
import { WifiSlash } from "@phosphor-icons/react";

/** Indicador discreto (no un banner rojo gigante) de que se perdió la
 * conexión en vivo y se está reconectando solo. */
export default function ConnectionBanner({ state }) {
  return (
    <AnimatePresence>
      {state === "offline" && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
          className="fixed left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 bg-[var(--text)] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg"
        >
          <WifiSlash size={14} />
          Reconectando…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
