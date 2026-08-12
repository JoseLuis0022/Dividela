import { AnimatePresence, motion } from "framer-motion";
import { Confetti } from "@phosphor-icons/react";

/** Aviso visible para todos (anfitrión e invitados) cuando el 100% de la
 * mesa ya marcó "Listo" — así nadie tiene que preguntar si ya se puede cerrar. */
export default function AllReadyBanner({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          layout
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 360, damping: 26 }}
          className="flex items-center gap-2 bg-[var(--success)]/10 text-[var(--success)] text-sm font-semibold rounded-xl px-4 py-3 mb-4"
        >
          <Confetti size={20} weight="fill" />
          ¡Todos están listos! 🎉
        </motion.div>
      )}
    </AnimatePresence>
  );
}
