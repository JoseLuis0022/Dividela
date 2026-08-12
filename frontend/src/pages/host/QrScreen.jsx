import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  UsersThree,
  WarningCircle,
  Copy,
  Check,
  CheckCircle,
  ShareNetwork,
  Prohibit,
} from "@phosphor-icons/react";
import PageContainer from "../../components/PageContainer.jsx";
import Card from "../../components/Card.jsx";
import Badge from "../../components/Badge.jsx";
import Avatar from "../../components/Avatar.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ConnectionBanner from "../../components/ConnectionBanner.jsx";
import AllReadyBanner from "../../components/AllReadyBanner.jsx";
import Button from "../../components/Button.jsx";
import Modal from "../../components/Modal.jsx";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch, ApiError } from "../../utils/apiFetch.js";
import { useSessionSocket } from "../../ws/useSessionSocket.js";
import { getParticipant } from "../../utils/storage.js";
import { allParticipantsReady } from "../../utils/readiness.js";

export default function QrScreen() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState("loading");
  const [session, setSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const host = getParticipant(sessionId);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(session.join_url);
      setCopied(true);
      toast("Enlace copiado", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("No pudimos copiar el enlace, cópialo manualmente.", "error");
    }
  }

  async function shareLink() {
    const shareData = {
      title: "Únete a la cuenta en Dividela",
      text: "Escanea o abre este enlace para marcar lo que consumiste:",
      url: session.join_url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        /* el usuario canceló el share sheet, no es un error real */
      }
    } else {
      copyLink();
    }
  }

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

  const allReady = allParticipantsReady(session?.participants);
  const wasAllReadyRef = useRef(false);
  useEffect(() => {
    if (allReady && !wasAllReadyRef.current) {
      toast("¡Todos en la mesa ya están listos! 🎉", "success");
    }
    wasAllReadyRef.current = allReady;
  }, [allReady, toast]);

  async function toggleHostReady() {
    if (!session || !host) return;
    const me = session.participants.find((p) => p.id === host.participantId);
    const nextReady = !(me?.is_ready ?? false);

    setSession((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === host.participantId ? { ...p, is_ready: nextReady } : p
      ),
    }));

    try {
      const data = await apiFetch(`/api/participants/${host.participantId}/ready`, {
        method: "POST",
        body: { ready: nextReady },
      });
      setSession(data);
      if (nextReady) toast("Le avisamos a todos que ya terminaste 🎉", "success");
    } catch (err) {
      await load();
      toast(err instanceof ApiError ? err.message : "No pudimos actualizar tu estado.", "error");
    }
  }

  async function endSession() {
    setEnding(true);
    try {
      await apiFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      toast("Cuenta terminada y borrada del servidor", "success");
      navigate("/");
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No pudimos terminar la cuenta.", "error");
    } finally {
      setEnding(false);
      setEndModalOpen(false);
    }
  }

  async function toggleSelection(item, targetParticipantId) {
    if (!session) return;
    const isCurrentlySelected = item.selected_by.includes(targetParticipantId);

    // Optimistic UI: el anfitrión también quiere ver el cambio al instante,
    // igual que un invitado — sin salir de esta pantalla.
    setSession((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === item.id
          ? {
              ...it,
              selected_by: isCurrentlySelected
                ? it.selected_by.filter((id) => id !== targetParticipantId)
                : [...it.selected_by, targetParticipantId],
            }
          : it
      ),
    }));

    try {
      const data = await apiFetch(`/api/items/${item.id}/toggle`, {
        method: "POST",
        body: { requester_id: host?.participantId, target_participant_id: targetParticipantId },
      });
      setSession(data);
    } catch (err) {
      await load();
      toast(err instanceof ApiError ? err.message : "No pudimos actualizar la selección.", "error");
    }
  }

  if (status === "loading") {
    return (
      <PageContainer className="items-center">
        <div className="w-56 h-56 rounded-2xl skeleton" />
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

  const participantsByItem = (item) =>
    session.participants.filter((p) => item.selected_by.includes(p.id));

  const formatQty = (q) => (Number.isInteger(q) ? q : q.toFixed(2).replace(/\.?0+$/, ""));
  const me = host && session.participants.find((p) => p.id === host.participantId);
  const myTotal = me?.total_owed ?? 0;

  return (
    <PageContainer className="pb-28">
      <ConnectionBanner state={connectionState} />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[var(--text)]">Tu cuenta</h1>
        <button
          onClick={() => setEndModalOpen(true)}
          className="flex items-center gap-1 text-xs font-medium text-[var(--error)] px-2 py-1 rounded-lg hover:bg-[var(--error)]/10"
        >
          <Prohibit size={14} weight="bold" /> Terminar
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="flex justify-center mb-5"
      >
        <div className="bg-white p-4 rounded-2xl border border-[var(--border)] shadow-md">
          <QRCodeSVG value={session.join_url} size={200} fgColor="#0f172a" />
        </div>
      </motion.div>

      <p className="text-center text-sm text-[var(--text-secondary)] mb-4">
        Pide a tus invitados que escaneen este código, o comparte el enlace directamente.
      </p>

      <div className="flex gap-2 mb-6">
        <Button variant="secondary" fullWidth onClick={copyLink}>
          {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
          {copied ? "¡Copiado!" : "Copiar enlace"}
        </Button>
        <Button fullWidth onClick={shareLink}>
          <ShareNetwork size={16} weight="bold" /> Compartir
        </Button>
      </div>

      <AllReadyBanner show={allReady} />

      <div className="flex items-center gap-2 mb-3">
        <UsersThree size={18} className="text-[var(--primary)]" />
        <h2 className="font-semibold text-[var(--text)]">
          {session.participants.length} en la mesa
        </h2>
      </div>

      {session.participants.length === 0 ? (
        <EmptyState title="Nadie se ha unido todavía" description="En cuanto escaneen el QR aparecerán aquí." />
      ) : (
        <div className="space-y-2 mb-6">
          {session.participants.map((p) => (
            <Card key={p.id} animate={false} className="!p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar participant={p} size={28} />
                <span className="text-sm font-medium text-[var(--text)] truncate">
                  {p.name}
                  {p.is_host && (
                    <Badge color="blue" className="ml-1.5">
                      Anfitrión
                    </Badge>
                  )}
                  {p.is_ready && (
                    <Badge color="green" className="ml-1.5">
                      Listo
                    </Badge>
                  )}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-[var(--text)] shrink-0">
                ${p.total_owed.toFixed(2)}
              </span>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-[var(--text)]">Ítems y quién los marcó</h2>
        <span className="text-xs text-[var(--text-secondary)]">Toca para marcar lo tuyo</span>
      </div>
      <div className="space-y-2">
        {session.items.map((item) => {
          const isMine = host && item.selected_by.includes(host.participantId);
          return (
            <Card key={item.id} animate={false} className="!p-3">
              <div className="flex items-start gap-3">
                <motion.button
                  onClick={() => host && toggleSelection(item, host.participantId)}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 26 }}
                  aria-label={isMine ? `Quitar ${item.name} de lo mío` : `Marcar ${item.name} como mío`}
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border-2 mt-0.5 ${
                    isMine
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                      : "border-[var(--border)]"
                  }`}
                >
                  {isMine && <Check size={14} weight="bold" />}
                </motion.button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {item.name}
                      <span className="text-[var(--text-secondary)] font-normal">
                        {" "}
                        · x{formatQty(item.quantity)}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums text-[var(--text-secondary)] shrink-0">
                      ${item.line_total.toFixed(2)}
                      {item.selected_by.length > 1 && (
                        <span className="text-[var(--text-secondary)]"> · {item.selected_by.length}p</span>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] tabular-nums mb-1.5">
                    ${item.unit_price.toFixed(2)} c/u
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {participantsByItem(item).length === 0 && (
                      <span className="text-xs text-[var(--text-secondary)]">Nadie lo ha marcado</span>
                    )}
                    {participantsByItem(item).map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs rounded-full pl-1 pr-1 py-0.5"
                      >
                        <Avatar participant={p} size={16} />
                        {p.name}
                        <button
                          onClick={() => toggleSelection(item, p.id)}
                          aria-label={`Quitar a ${p.name} de ${item.name}`}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[var(--primary)]/20"
                        >
                          <X size={10} weight="bold" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

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
            onClick={toggleHostReady}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors ${
              me?.is_ready ? "bg-white/10 text-white/80" : "bg-white text-[var(--text)]"
            }`}
          >
            <CheckCircle size={18} weight={me?.is_ready ? "fill" : "bold"} />
            {me?.is_ready ? "Listo — toca para seguir editando" : "Ya terminé, avisar a todos"}
          </motion.button>
        </div>
      </motion.div>

      <Modal open={endModalOpen} onClose={() => !ending && setEndModalOpen(false)} title="¿Terminar esta cuenta?">
        <p className="text-sm text-[var(--text-secondary)] mb-5">
          Se eliminará todo lo relacionado con esta cuenta — ítems, invitados y selecciones — del
          servidor. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setEndModalOpen(false)} disabled={ending}>
            Cancelar
          </Button>
          <Button variant="danger" fullWidth onClick={endSession} disabled={ending}>
            {ending ? "Terminando…" : "Sí, terminar y borrar"}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
