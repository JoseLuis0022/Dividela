/** Identidad ligera del dispositivo: no hay login, solo recordamos el
 * participant_id emitido por el backend para esta sesión en particular. */
const KEY_PREFIX = "dividela:participant:";

export function saveParticipant(sessionId, participantId, isHost) {
  localStorage.setItem(
    KEY_PREFIX + sessionId,
    JSON.stringify({ participantId, isHost })
  );
}

export function getParticipant(sessionId) {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + sessionId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
