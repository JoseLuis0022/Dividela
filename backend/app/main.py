from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routers import items, participants, sessions
from .ws_manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Dividela API", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    # No hay cookies/login en esta app (participantes se identifican por id
    # en localStorage), así que se permite cualquier origen sin credenciales;
    # simplifica el despliegue detrás de Cloudflare Tunnel con subdominios variables.
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(participants.router)
app.include_router(items.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/sessions/{session_id}")
async def session_socket(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            # No esperamos mensajes del cliente por este canal; solo lo
            # mantenemos abierto para recibir el ping/pong y detectar el cierre.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
