/** Cantidades como 2 se muestran "2", pero 1.5 se muestra "1.5" (sin ceros de más). */
export function formatQuantity(q) {
  const n = Number(q || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
