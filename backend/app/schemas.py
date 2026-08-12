"""Payloads y respuestas de la API (independientes de las tablas SQL)."""
from pydantic import BaseModel

from .models import SessionStatus


class ItemIn(BaseModel):
    """Un ítem tal como lo edita el anfitrión en la tabla de confirmación."""
    id: str | None = None  # None => es una fila nueva agregada a mano
    name: str
    quantity: float = 1
    unit_price: float = 0
    line_total: float = 0


class ItemsBulkUpdate(BaseModel):
    items: list[ItemIn]
    ticket_total_declared: float | None = None


class ItemOut(BaseModel):
    id: str
    name: str
    quantity: float
    unit_price: float
    line_total: float
    position: int
    selected_by: list[str] = []  # ids de participantes que marcaron este ítem


class ParticipantOut(BaseModel):
    id: str
    name: str
    is_host: bool
    is_ready: bool
    total_owed: float


class SessionOut(BaseModel):
    id: str
    status: SessionStatus
    ticket_total_declared: float | None
    items_total: float
    join_url: str
    items: list[ItemOut]
    participants: list[ParticipantOut]


class JoinRequest(BaseModel):
    name: str


class ReadyRequest(BaseModel):
    ready: bool


class JoinResponse(BaseModel):
    session_id: str
    participant_id: str
    is_host: bool


class AnalyzePhotosResponse(BaseModel):
    items: list[ItemOut]
    ticket_total_declared: float | None
    warning: str | None = None
