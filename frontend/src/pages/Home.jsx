import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, UsersThree, QrCode } from "@phosphor-icons/react";
import PageContainer from "../components/PageContainer.jsx";
import Card from "../components/Card.jsx";
import InputField from "../components/InputField.jsx";
import Button from "../components/Button.jsx";
import Loader from "../components/Loader.jsx";
import { useToast } from "../components/Toast.jsx";
import { apiFetch, ApiError } from "../utils/apiFetch.js";
import { saveParticipant } from "../utils/storage.js";

const STEPS = [
  { icon: Receipt, text: "Fotografía el ticket" },
  { icon: QrCode, text: "Comparte el QR" },
  { icon: UsersThree, text: "Cada quien marca lo suyo" },
];

export default function Home() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/sessions", { method: "POST", body: { name } });
      saveParticipant(res.session_id, res.participant_id, true);
      navigate(`/host/${res.session_id}/capture`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No pudimos crear la cuenta.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer className="items-center">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-3">🧾</div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Dividela</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Divide la cuenta del restaurante entre todos, sin complicaciones.
        </p>
      </motion.div>

      <Card className="mb-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <InputField
            label="Tu nombre (para identificarte como anfitrión)"
            placeholder="Ej. José Luis"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button type="submit" fullWidth disabled={!name.trim() || loading}>
            {loading ? <Loader size={18} className="text-white" /> : "Crear nueva cuenta"}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-3 gap-3 w-full">
        {STEPS.map(({ icon: Icon, text }, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.05 * i }}
            className="flex flex-col items-center text-center gap-1.5 text-xs text-[var(--text-secondary)]"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Icon size={20} weight="bold" />
            </div>
            {text}
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}
