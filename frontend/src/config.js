/**
 * Resuelve la URL base del backend en runtime.
 *
 * Mismo patrón que Farmora (imperioon-frontend/src/config.js): si se fijó
 * VITE_API_BASE_URL en build-time (típico al desplegar detrás de un
 * Cloudflare Tunnel con subdominio propio), se usa tal cual. Si no, se
 * infiere del hostname actual + VITE_BACKEND_PORT — útil en desarrollo o
 * en LAN, donde el frontend y el backend viven en el mismo host pero en
 * puertos distintos.
 */
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || "8000";
const API_BASE_URL_OVERRIDE = import.meta.env.VITE_API_BASE_URL || "";

function resolveApiBaseUrl() {
  if (API_BASE_URL_OVERRIDE) return API_BASE_URL_OVERRIDE.replace(/\/$/, "");
  if (typeof window === "undefined") return `http://localhost:${BACKEND_PORT}`;
  const { hostname, protocol } = window.location;
  const httpProtocol = protocol === "https:" ? "https:" : "http:";
  return `${httpProtocol}//${hostname}:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export function wsUrl(path) {
  const base = API_BASE_URL.replace(/^http/, "ws");
  return `${base}${path}`;
}
