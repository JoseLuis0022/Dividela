const colors = {
  gray: "bg-[var(--border)] text-[var(--text-secondary)]",
  blue: "bg-[var(--primary)]/12 text-[var(--primary)]",
  green: "bg-[var(--success)]/12 text-[var(--success)]",
  red: "bg-[var(--error)]/12 text-[var(--error)]",
  amber: "bg-[var(--warning)]/12 text-[var(--warning)]",
};

export default function Badge({ color = "gray", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
}
