import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Plus, X } from "@phosphor-icons/react";
import PageContainer from "../../components/PageContainer.jsx";
import Card from "../../components/Card.jsx";
import Button from "../../components/Button.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import ItemsTableSkeleton from "../../components/Skeleton.jsx";
import Loader from "../../components/Loader.jsx";
import { useToast } from "../../components/Toast.jsx";
import { apiFetch, ApiError } from "../../utils/apiFetch.js";
import { API_BASE_URL } from "../../config.js";
import { toDisplayableImage } from "../../utils/imageConvert.js";

export default function CapturePhotos() {
  const { sessionId } = useParams();
  const [photos, setPhotos] = useState([]); // { file, url }
  const [pendingCount, setPendingCount] = useState(0); // fotos convirtiéndose todavía
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setPendingCount((n) => n + files.length);
    try {
      // Se convierte cada foto a JPEG antes de mostrarla/subirla: así una
      // foto HEIC de iPhone (u otro formato exótico) siempre se puede
      // previsualizar y siempre llega en un formato que el modelo de
      // visión sabe leer, sin importar la cámara o el navegador de origen.
      const converted = await Promise.all(
        files.map(async (file) => {
          const displayFile = await toDisplayableImage(file);
          return { file: displayFile, url: URL.createObjectURL(displayFile) };
        })
      );
      setPhotos((prev) => [...prev, ...converted]);
    } finally {
      setPendingCount((n) => Math.max(0, n - files.length));
    }
  }

  function removePhoto(index) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function analyze() {
    if (photos.length === 0) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      photos.forEach((p) => formData.append("photos", p.file));
      const res = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.detail || "No pudimos leer el ticket.");
      }
      const data = await res.json();
      if (data.warning) toast(data.warning, "warning");
      navigate(`/host/${sessionId}/confirm`);
    } catch (err) {
      toast(
        err instanceof ApiError ? err.message : "No pudimos leer el ticket. Intenta con otra foto o mejor luz.",
        "error"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <PageContainer>
      <h1 className="text-xl font-bold text-[var(--text)] mb-1">Fotografía el ticket</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-5">
        Agrega tantas fotos como necesites para cubrir todo el ticket. Cuando estés listo, toca
        "Analizar ticket".
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {photos.length === 0 && pendingCount === 0 ? (
        <EmptyState
          icon={<Camera size={40} weight="duotone" />}
          title="Aún no hay fotos"
          description="Toca el botón de abajo para tomar o elegir la primera foto del ticket."
          action={<Button onClick={() => inputRef.current?.click()}>Agregar foto</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <AnimatePresence initial={false}>
              {photos.map((p, i) => (
                <motion.div
                  key={p.url}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--background)] flex items-center justify-center"
                >
                  {/* Ícono de respaldo: si por alguna razón el navegador tampoco
                      puede mostrar la foto convertida, esto queda visible en vez
                      del ícono roto por defecto del navegador. */}
                  <Camera size={22} className="absolute text-[var(--text-secondary)]" />
                  <img
                    src={p.url}
                    alt={`Foto ${i + 1}`}
                    className="relative w-full h-full object-cover"
                    onError={(e) => e.currentTarget.remove()}
                  />
                  <button
                    onClick={() => removePhoto(i)}
                    aria-label="Quitar foto"
                    className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </motion.div>
              ))}
              {Array.from({ length: pendingCount }).map((_, i) => (
                <div
                  key={`pending-${i}`}
                  className="aspect-square rounded-xl skeleton flex items-center justify-center"
                >
                  <Loader size={20} />
                </div>
              ))}
              <motion.button
                layout
                onClick={() => inputRef.current?.click()}
                whileTap={{ scale: 0.95 }}
                className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--text-secondary)] flex flex-col items-center justify-center gap-1"
              >
                <Plus size={22} />
                <span className="text-xs">Agregar</span>
              </motion.button>
            </AnimatePresence>
          </div>

          {analyzing ? (
            <Card className="mb-4">
              <p className="text-sm font-medium text-[var(--text)] mb-3">Analizando tu ticket…</p>
              <ItemsTableSkeleton rows={3} />
            </Card>
          ) : (
            <Button fullWidth onClick={analyze} disabled={photos.length === 0 || pendingCount > 0}>
              {pendingCount > 0 ? "Procesando fotos…" : "Analizar ticket"}
            </Button>
          )}
        </>
      )}
    </PageContainer>
  );
}
