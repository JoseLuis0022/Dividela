import { useEffect, useRef, useState } from "react";
import { wsUrl } from "../config";

/**
 * Suscribe a los eventos en vivo de una sesión (alguien se une, alguien
 * marca/desmarca un ítem, el anfitrión edita algo). Reconecta solo con
 * backoff si se cae la conexión — sin esto, una sesión en un restaurante
 * con wifi inestable se "congelaría" para todos los demás.
 */
export function useSessionSocket(sessionId, onEvent) {
  const [connectionState, setConnectionState] = useState("connecting"); // connecting | online | offline
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!sessionId) return;
    let socket;
    let retryTimer;
    let retryDelay = 1000;
    let cancelled = false;

    function connect() {
      setConnectionState((s) => (s === "online" ? s : "connecting"));
      socket = new WebSocket(wsUrl(`/ws/sessions/${sessionId}`));

      socket.onopen = () => {
        retryDelay = 1000;
        setConnectionState("online");
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onEventRef.current?.(parsed.event, parsed.payload);
        } catch {
          /* mensaje no-JSON, se ignora */
        }
      };

      socket.onclose = () => {
        if (cancelled) return;
        setConnectionState("offline");
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 1.6, 10000);
      };

      socket.onerror = () => {
        socket.close();
      };
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [sessionId]);

  return connectionState;
}
