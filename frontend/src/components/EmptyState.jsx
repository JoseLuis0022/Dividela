import { motion } from "framer-motion";

/** Estado "vacío" reutilizable (patrón visto en Farmora, aquí extraído a
 * componente propio): icono + título + subtítulo + acción sugerida. */
export default function EmptyState({ icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex flex-col items-center text-center p-8 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)]"
    >
      {icon && <div className="text-[var(--primary)] mb-3">{icon}</div>}
      <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
      {description && (
        <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
