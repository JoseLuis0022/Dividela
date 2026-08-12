"""Modelos de datos (SQLModel = tabla SQL + schema Pydantic en una sola clase)."""
import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class SessionStatus(str, Enum):
    draft = "draft"        # el anfitrión aún está fotografiando/editando el ticket
    confirmed = "confirmed"  # QR generado, invitados pueden unirse y marcar
    closed = "closed"      # cuenta cerrada (informativo, no bloquea nada)


class BillSession(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    status: SessionStatus = Field(default=SessionStatus.draft)
    ticket_total_declared: float | None = Field(default=None)
    created_at: datetime = Field(default_factory=_now)


class Item(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    session_id: str = Field(foreign_key="billsession.id", index=True)
    name: str
    quantity: float = 1
    unit_price: float = 0
    line_total: float = 0
    position: int = 0  # para conservar el orden del ticket en la UI


class Participant(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    session_id: str = Field(foreign_key="billsession.id", index=True)
    name: str
    is_host: bool = False
    is_ready: bool = False  # "Listo": ya terminó de marcar lo que consumió
    joined_at: datetime = Field(default_factory=_now)


class ItemSelection(SQLModel, table=True):
    """Una fila = esta persona marcó este ítem (lo consumió o lo comparte)."""
    id: str = Field(default_factory=_uuid, primary_key=True)
    item_id: str = Field(foreign_key="item.id", index=True)
    participant_id: str = Field(foreign_key="participant.id", index=True)
