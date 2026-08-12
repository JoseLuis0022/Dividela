import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import PageContainer from "../../components/PageContainer.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ConnectionBanner from "../../components/ConnectionBanner.jsx";
import ItemsTableSkeleton from "../../components/Skeleton.jsx";
import ParticipantsBar from "../../components/ParticipantsBar.jsx";
import SelectorChips from "../../components/SelectorChips.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch, ApiError } from "../../utils/apiFetch.js";
import { useSessionSocket } from "../../ws/useSessionSocket.js";
import { formatQuantity } from "../../utils/format.js";

export default function ParticipantView() {
  const { sessionId, participantId } = useParams();
  const toast = useToast();
  const [status, setStatus] = useState("loading");
  const [session, setSession] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());

  async function load() {
    setStatus("loading");
    try {
      const data = await apiFetch(`/api/sessions/${sessionId}`);
      setSession(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const connectionState = useSessionSocket(sessionId, (event, payload) => {
    if (["items_updated", "participant_joined", "session_confirmed"].includes(event)) {
      setSession(payload);
    }
  });

  async function toggle(item) {
    if (!session) return;
    const isMine = item.selected_by.includes(participantId);

    // Optimistic UI: se refleja el cambio al instante en el cliente, antes
    // de que responda el servidor; si falla, se revierte con un toast.
    setSession((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === item.id
          ? {
              ...it,
              selected_by: isMine
                ? it.selected_by.filter((id) => id !== participantId)
                : [...it.selected_by, participantId],
            }
          : it
      ),
    }));
    setPendingIds((prev) => new Set(prev).add(item.id));

    try {
      const data = await apiFetch(`/api/items/${item.id}/toggle`, {
        method: "POST",
        body: { requester_id: participantId, target_participant_id: participantId },
      });
      setSession(data);
    } catch (err) {
      await load(); // revierte trayendo el estado real del servidor
      toast(err instanceof ApiError ? err.message : "No pudimos guardar tu selección.", "error");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  async function toggleReady() {
    if (!session) return;
    const currentlyReady = me?.is_ready ?? false;
    const nextReady = !currentlyReady;

    setSession((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participantId ? { ...p, is_ready: nextReady } : p
      ),
    }));

    try {
      const data = await apiFetch(`/api/participants/${participantId}/ready`, {
        method: "POST",
        body: { ready: nextReady },
      });
      setSession(data);
      if (nextReady) toast("Le avisamos al anfitrión que ya terminaste 🎉", "success");
    } catch (err) {
      await load();
      toast(err instanceof ApiError ? err.message : "No pudimos avisarle al anfitrión.", "error");
    }
  }

  if (status === "loading") {
    return (
      <PageContainer>
        <h1 className="text-xl font-bold text-[var(--text)] mb-4">Marca lo que consumiste</h1>
        <ItemsTableSkeleton rows={5} />
      </PageContainer>
    );
  }

  if (status === "error") {
    return (
      <PageContainer>
        <EmptyState
          icon={<WarningCircle size={40} weight="duotone" />}
          title="No pudimos cargar la cuenta"
          description="Revisa tu conexión e intenta de nuevo."
          action={<Button onClick={load}>Reintentar</Button>}
        />
      </PageContainer>
    );
  }

  const me = session.participants.find((p) => p.id === participantId);
  const myTotal = me?.total_owed ?? 0;
  const participantsById = new Map(session.participants.map((p) => [p.id, p]));
  const selectorsFor = (item) =>
    item.selected_by.map((id) => participantsById.get(id)).filter(Boolean);

  return (
    <PageContainer className="pb-28">
      <ConnectionBanner state={connectionState} />

      <div className="flex items-center gap-2.5 mb-1">
        {me && <Avatar participant={me} size={30} />}
        <h1 className="text-xl font-bold text-[var(--text)]">Hola, {me?.name || "🙂"}</h1>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Toca lo que pediste. Si algo se comparte, márcalo también — el costo se divide entre
        quienes lo marquen.
      </p>

      <ParticipantsBar participants={session.participants} meId={participantId} />

      {session.items.length === 0 ? (
        <EmptyState
          icon={<WarningCircle size={40} weight="duotone" />}
          title="El anfitrión aún no confirma los ítems"
          description="Espera un momento e inténtalo de nuevo."
          action={<Button onClick={load}>Actualizar</Button>}
        />
      ) : (
        <div className="space-y-2">
          {session.items.map((item) => {
            const isMine = item.selected_by.includes(participantId);
            const sharedCount = item.selected_by.length || 1;
            const myShare = item.line_total / sharedCount;
            const isPending = pendingIds.has(item.id);

            return (
              <motion.button
                key={item.id}
                layout
                onClick={() => toggle(item)}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  isMine
                    ? "bg-[var(--primary)]/8 border-[var(--primary)]"
                    : "bg-[var(--surface)] border-[var(--border)]"
                }`}
              >
                <motion.span
                  animate={{ scale: isMine ? 1 : 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border-2 mt-0.5 ${
                    isMine
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {isMine && <Check size={14} weight="bold" />}
                </motion.span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline flex-wrap gap-x-1.5">
                    <p className="text-sm font-medium text-[var(--text)]">{item.name}</p>
                    <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                      ${item.unit_price.toFixed(2)} c/u · x{formatQuantity(item.quantity)}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <SelectorChips
                      participants={selectorsFor(item)}
                      emptyLabel="Aún nadie lo ha marcado"
                    />
                  </div>
                </div>

                <div className="text-right shrink-0 pl-1">
                  <p className="text-sm font-bold tabular-nums text-[var(--text)]">
                    ${myShare.toFixed(2)}
                  </p>
                  {item.selected_by.length > 1 && (
                    <p className="text-[10px] text-[var(--text-secondary)]">
                      entre {item.selected_by.length}
                    </p>
                  )}
                  {isPending && (
                    <p className="text-[10px] text-[var(--text-secondary)]">guardando…</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none px-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="w-full max-w-md bg-[var(--text)] text-white rounded-2xl px-5 py-4 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white/70">Tu total</span>
            <motion.span
              key={myTotal}
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="text-lg font-bold tabular-nums"
            >
              ${myTotal.toFixed(2)}
            </motion.span>
          </div>
          <motion.button
            onClick={toggleReady}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              me?.is_ready
                ? "bg-white/10 text-white/80"
                : "bg-white text-[var(--text)]"
            }`}
          >
            <CheckCircle size={18} weight={me?.is_ready ? "fill" : "bold"} />
            {me?.is_ready ? "Listo — toca para seguir editando" : "Ya terminé, avisar al anfitrión"}
          </motion.button>
        </div>
      </motion.div>
    </PageContainer>
  );
}
