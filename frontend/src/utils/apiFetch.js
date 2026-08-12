import { API_BASE_URL } from "../config";

/** Error con mensaje humano ya extraído del backend, listo para mostrar en UI. */
export class ApiError extends Error {}

/**
 * Wrapper mínimo sobre fetch: arma la URL contra el backend configurado,
 * serializa JSON automáticamente (salvo FormData), y convierte errores HTTP
 * en un mensaje legible tomado de `detail` (formato de error de FastAPI).
 */
export async function apiFetch(path, { method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
  }

  if (!response.ok) {
    let detail = "Algo salió mal. Intenta de nuevo.";
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new ApiError(detail);
  }

  if (response.status === 204) return null;
  return response.json();
}
