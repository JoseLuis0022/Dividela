/** Asigna un color estable a cada participante (mismo id => mismo color
 * siempre) para poder identificarlos de un vistazo en avatares y chips. */
const PALETTE = [
  "#2563EB", // azul
  "#DB2777", // rosa
  "#059669", // verde
  "#D97706", // ámbar
  "#7C3AED", // violeta
  "#DC2626", // rojo
  "#0891B2", // cian
  "#65A30D", // lima
  "#EA580C", // naranja
  "#4F46E5", // índigo
];

export function colorForParticipant(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
