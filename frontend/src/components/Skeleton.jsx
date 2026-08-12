/** Skeleton de tabla de ítems: se muestra mientras se analiza el ticket,
 * para que el layout no "salte" cuando llegue el resultado real (CLS ≈ 0). */
export default function ItemsTableSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5"
        >
          <div className="skeleton h-4 w-1/2 rounded-md" />
          <div className="skeleton h-4 w-10 rounded-md ml-auto" />
          <div className="skeleton h-4 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}
