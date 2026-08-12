import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash, WarningCircle, ArrowLeft } from "@phosphor-icons/react";
import PageContainer from "../../components/PageContainer.jsx";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import InputField from "../../components/InputField.jsx";
import ItemsTableSkeleton from "../../components/Skeleton.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch, ApiError } from "../../utils/apiFetch.js";

let rowKeySeq = 0;
const newRow = () => ({
  key: `new-${++rowKeySeq}`,
  id: null,
  name: "",
  quantity: 1,
  unit_price: 0,
  line_total: 0,
});

export default function ConfirmItems() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [rows, setRows] = useState([]);
  const [ticketTotal, setTicketTotal] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setStatus("loading");
    try {
      const data = await apiFetch(`/api/sessions/${sessionId}`);
      setRows(data.items.map((i) => ({ key: i.id, ...i })));
      setTicketTotal(data.ticket_total_declared ?? "");
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function updateRow(key, field, value) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, [field]: value };
        if (field === "quantity" || field === "unit_price") {
          next.line_total = Number(next.quantity || 0) * Number(next.unit_price || 0);
        }
        return next;
      })
    );
  }

  function removeRow(key) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  const itemsTotal = rows.reduce((sum, r) => sum + Number(r.line_total || 0), 0);
  const declared = ticketTotal === "" ? null : Number(ticketTotal);
  const mismatched = declared !== null && Math.abs(declared - itemsTotal) > 0.5;

  async function persist() {
    return apiFetch(`/api/sessions/${sessionId}/items`, {
      method: "PATCH",
      body: {
        items: rows.map((r) => ({
          id: r.id,
          name: r.name || "Ítem sin nombre",
          quantity: Number(r.quantity || 0),
          unit_price: Number(r.unit_price || 0),
          line_total: Number(r.line_total || 0),
        })),
        ticket_total_declared: declared,
      },
    });
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await persist();
      await apiFetch(`/api/sessions/${sessionId}/confirm`, { method: "POST" });
      navigate(`/host/${sessionId}/qr`);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "No pudimos confirmar la cuenta.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <PageContainer>
        <h1 className="text-xl font-bold text-[var(--text)] mb-4">Revisa los ítems</h1>
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

  return (
    <PageContainer>
      <button
        onClick={() => navigate(`/host/${sessionId}/capture`)}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-3"
      >
        <ArrowLeft size={16} /> Volver a fotografiar
      </button>

      <h1 className="text-xl font-bold text-[var(--text)] mb-1">Revisa los ítems</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Corrige lo que haga falta antes de generar el código para tus invitados.
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={<WarningCircle size={40} weight="duotone" />}
          title="No detectamos ítems"
          description="Agrega los renglones del ticket manualmente."
          action={<Button onClick={() => setRows((prev) => [...prev, newRow()])}>Agregar ítem</Button>}
        />
      ) : (
        <div className="space-y-2 mb-3">
          {rows.map((row) => (
            <motion.div
              layout
              key={row.key}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3"
            >
              <input
                value={row.name}
                onChange={(e) => updateRow(row.key, "name", e.target.value)}
                placeholder="Nombre del platillo"
                className="w-full text-sm font-medium text-[var(--text)] bg-transparent focus:outline-none mb-2"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Cant.</span>
                  <input
                    type="number"
                    min="0"
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
                    className="w-full text-sm bg-[var(--background)] rounded-lg px-2 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Unitario</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) => updateRow(row.key, "unit_price", e.target.value)}
                      className="w-full text-sm bg-[var(--background)] rounded-lg pl-5 pr-2 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-[var(--text-secondary)] block">Total</span>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.line_total}
                      onChange={(e) => updateRow(row.key, "line_total", e.target.value)}
                      className="w-full text-sm font-bold text-[var(--text)] bg-[var(--background)] rounded-lg pl-5 pr-2 py-1.5 tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeRow(row.key)}
                  aria-label="Eliminar ítem"
                  className="w-9 h-9 flex items-center justify-center text-[var(--error)] rounded-lg hover:bg-[var(--error)]/10 mt-3.5"
                >
                  <Trash size={16} />
                </button>
              </div>
            </motion.div>
          ))}
          <Button
            variant="secondary"
            fullWidth
            className="!justify-start"
            onClick={() => setRows((prev) => [...prev, newRow()])}
          >
            <Plus size={16} /> Agregar ítem
          </Button>
        </div>
      )}

      <Card className="mb-4">
        <InputField
          label="Total impreso en el ticket (opcional)"
          type="number"
          step="0.01"
          placeholder="Ej. 540.00"
          value={ticketTotal}
          onChange={(e) => setTicketTotal(e.target.value)}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-bold text-[var(--text)]">Total</span>
          <span className="text-lg font-bold tabular-nums text-[var(--text)]">
            ${itemsTotal.toFixed(2)}
          </span>
        </div>
        {mismatched && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-[var(--warning)]">
            <WarningCircle size={16} className="shrink-0 mt-0.5" />
            <span>
              La suma no coincide exactamente con el total del ticket. Puedes continuar de todas
              formas si crees que es correcto.
            </span>
          </div>
        )}
      </Card>

      <Button fullWidth onClick={handleConfirm} disabled={saving || rows.length === 0}>
        {saving ? "Confirmando…" : "Confirmar y generar QR"}
      </Button>
    </PageContainer>
  );
}
