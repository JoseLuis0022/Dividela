import { AnimatePresence, motion } from "framer-motion";
import Avatar from "./Avatar.jsx";

/** Franja horizontal con quién está en la mesa — visible para todos, no
 * solo el anfitrión. Cada quien que se une aparece con una animación de
 * entrada (spring pop), así se siente vivo en vez de solo aparecer. */
export default function ParticipantsBar({ participants, meId }) {
  if (participants.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 mb-4 -mx-4 px-4 no-scrollbar">
      <AnimatePresence initial={false}>
        {participants.map((p) => (
          <motion.div
            key={p.id}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className="flex flex-col items-center gap-1 shrink-0 w-14"
          >
            <Avatar participant={p} size={40} />
            <span
              className={`text-[10px] text-center leading-tight truncate w-full ${
                p.id === meId ? "font-semibold text-[var(--text)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {p.id === meId ? "Tú" : p.name}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
