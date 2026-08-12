import { motion } from "framer-motion";
import { User, Check } from "@phosphor-icons/react";
import { colorForParticipant } from "../utils/participantColor.js";

/** Círculo de color (asignado de forma estable por participante) con el
 * icono de persona minimalista de Phosphor (mismo estilo/peso "regular"
 * que usa Farmora) — así cada quien se identifica de un vistazo. Si ya
 * marcó "Listo", se le agrega una insignia verde de visto. */
export default function Avatar({ participant, size = 32, animate = false, className = "" }) {
  const color = colorForParticipant(participant.id);
  const circle = (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`rounded-full flex items-center justify-center text-white w-full h-full ring-2 ring-[var(--surface)] ${className}`}
        style={{ backgroundColor: color }}
      >
        <User size={size * 0.55} weight="regular" />
      </div>
      {participant.is_ready && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[var(--success)] text-white flex items-center justify-center ring-2 ring-[var(--surface)]"
          style={{ width: size * 0.45, height: size * 0.45 }}
        >
          <Check size={size * 0.28} weight="bold" />
        </span>
      )}
    </div>
  );

  if (!animate) return circle;

  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      {circle}
    </motion.div>
  );
}
