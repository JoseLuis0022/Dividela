import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../../components/PageContainer.jsx";
import Card from "../../components/Card.jsx";
import InputField from "../../components/InputField.jsx";
import Button from "../../components/Button.jsx";
import Loader from "../../components/Loader.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch, ApiError } from "../../utils/apiFetch.js";
import { saveParticipant, getParticipant } from "../../utils/storage.js";
import { WarningCircle, HandWaving } from "@phosphor-icons/react";

export default function JoinSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState("checking"); // checking | ready | draft | notfound
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const existing = getParticipant(sessionId);
    if (existing) {
      navigate(`/session/${sessionId}/participant/${existing.participantId}`);
      return;
    }
    (async () => {
      try {
        const data = await apiFetch(`/api/sessions/${sessionId}`);
        setStatus(data.status === "draft" ? "draft" : "ready");
      } catch {
        setStatus("notfound");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setJoining(true);
    try {
      const res = await apiFetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        body: { name },
      });
      saveParticipant(sessionId, res.participant_id, false);
      navigate(`/session/${sessionId}/participant/${res.participant_id}`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No pudimos unirte a la cuenta.", "error");
    } finally {
      setJoining(false);
    }
  }

  if (status === "checking") {
    return (
      <PageContainer className="items-center justify-center">
        <Loader size={32} />
      </PageContainer>
    );
  }

  if (status === "notfound") {
    return (
      <PageContainer>
        <EmptyState
          icon={<WarningCircle size={40} weight="duotone" />}
          title="Este enlace ya no es válido"
          description="Pide al anfitrión que genere de nuevo el código QR."
        />
      </PageContainer>
    );
  }

  if (status === "draft") {
    return (
      <PageContainer>
        <EmptyState
          icon={<HandWaving size={40} weight="duotone" />}
          title="Un momento…"
          description="El anfitrión todavía está preparando la cuenta. Escanea de nuevo en unos segundos."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="items-center">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">👋</div>
        <h1 className="text-xl font-bold text-[var(--text)]">Únete a la cuenta</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Solo necesitamos tu nombre, no hace falta crear cuenta.
        </p>
      </div>
      <Card className="w-full">
        <form onSubmit={handleJoin} className="space-y-4">
          <InputField
            label="Tu nombre"
            placeholder="Ej. Ana"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button type="submit" fullWidth disabled={!name.trim() || joining}>
            {joining ? "Uniéndote…" : "Unirme"}
          </Button>
        </form>
      </Card>
    </PageContainer>
  );
}
