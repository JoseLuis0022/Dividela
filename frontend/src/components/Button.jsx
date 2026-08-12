import { motion } from "framer-motion";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-[var(--primary)] text-[var(--text-on-primary)] shadow-md shadow-blue-900/10 hover:bg-[var(--primary-dark)] disabled:bg-[var(--border)] disabled:text-[var(--text-secondary)] disabled:shadow-none",
  secondary:
    "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--background)] disabled:text-[var(--text-secondary)]",
  danger:
    "bg-[var(--error)]/10 text-[var(--error)] hover:bg-[var(--error)]/15 disabled:text-[var(--text-secondary)]",
  ghost:
    "text-[var(--text-secondary)] hover:bg-[var(--background)] disabled:opacity-50",
};

/**
 * Botón con feedback físico: se "aprieta" (scale) al presionar con un
 * spring, en vez de solo cambiar de color — así el tap se siente <100ms.
 */
export default function Button({
  variant = "primary",
  className = "",
  fullWidth = false,
  children,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
