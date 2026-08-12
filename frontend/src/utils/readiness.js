/** true cuando ya hay al menos un participante y todos marcaron "Listo". */
export function allParticipantsReady(participants) {
  return Boolean(participants?.length) && participants.every((p) => p.is_ready);
}
