"""Conexiones WebSocket agrupadas por sesión, para difundir cambios en vivo
(alguien se une, alguien marca/desmarca un ítem, el anfitrión edita algo)."""
import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, session_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[session_id].add(ws)

    def disconnect(self, session_id: str, ws: WebSocket) -> None:
        self._connections[session_id].discard(ws)

    async def broadcast(self, session_id: str, event: str, payload: dict) -> None:
        message = json.dumps({"event": event, "payload": payload})
        dead: list[WebSocket] = []
        for ws in self._connections.get(session_id, set()):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)


manager = ConnectionManager()
