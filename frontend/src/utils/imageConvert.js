/**
 * Convierte cualquier foto a JPEG en el propio navegador antes de mostrarla
 * o subirla. Esto resuelve dos problemas de raíz:
 *
 * 1. Las fotos de iPhone suelen venir en HEIC; navegadores de escritorio
 *    (Chrome/Brave/Firefox) no saben decodificarlo y el <img> se rompe,
 *    aunque en Safari (iOS/macOS) sí funciona de forma nativa.
 * 2. El modelo de visión al que se le manda el ticket puede no aceptar
 *    HEIC — convertir a JPEG del lado del cliente garantiza un formato
 *    ampliamente soportado sin importar qué cámara/navegador se use.
 *
 * Si el navegador tampoco puede decodificar el archivo original (ej. HEIC
 * en Chrome de escritorio), se regresa el archivo tal cual llegó — no hay
 * forma de convertir algo que ni siquiera se puede leer.
 */
export async function toDisplayableImage(file, maxDim = 1600, quality = 0.85) {
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
