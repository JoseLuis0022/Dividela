import { AnimatePresence, motion } from "framer-motion";
import Avatar from "./Avatar.jsx";

/** Fila de chips (avatar chiquito + nombre chiquito) mostrando quién marcó
 * un ítem — clave para ver, en los ítems "al centro", cuántos y quiénes lo
 * están compartiendo. */
export default function SelectorChips({ participants, emptyLabel = "Nadie lo ha marcado" }) {
  if (participants.length === 0) {
    return <span className="text-xs text-[var(--text-secondary)]">{emptyLabel}</span>;
  }
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-1">
      <AnimatePresence initial={false}>
        {participants.map((p) => (
          <motion.span
            key={p.id}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
            className="inline-flex items-center gap-1"
          >
            <Avatar participant={p} size={16} />
            <span className="text-[10px] text-[var(--text-secondary)]">{p.name}</span>
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
