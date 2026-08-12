from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ..db import get_session
from ..models import BillSession, Item, ItemSelection, Participant
from ..schemas import ReadyRequest, SessionOut
from ..ws_manager import manager
from .sessions import _build_session_out

router = APIRouter(prefix="/api", tags=["items"])


class ToggleRequest(BaseModel):
    requester_id: str  # participante que hace la acción (para permisos)
    target_participant_id: str  # participante cuya selección se marca/desmarca


@router.post("/items/{item_id}/toggle", response_model=SessionOut)
async def toggle_item(item_id: str, payload: ToggleRequest, db: Session = Depends(get_session)):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ese ítem ya no existe.")

    requester = db.get(Participant, payload.requester_id)
    if not requester:
        raise HTTPException(status_code=404, detail="Participante no encontrado.")

    if payload.target_participant_id != payload.requester_id and not requester.is_host:
        raise HTTPException(
            status_code=403,
            detail="Solo el anfitrión puede editar la selección de otra persona.",
        )

    existing = db.exec(
        select(ItemSelection).where(
            ItemSelection.item_id == item_id,
            ItemSelection.participant_id == payload.target_participant_id,
        )
    ).first()

    if existing:
        db.delete(existing)
    else:
        db.add(ItemSelection(item_id=item_id, participant_id=payload.target_participant_id))
    db.commit()

    bill = db.get(BillSession, item.session_id)
    out = _build_session_out(db, bill)
    await manager.broadcast(item.session_id, "items_updated", out.model_dump(mode="json"))
    return out


@router.post("/participants/{participant_id}/ready", response_model=SessionOut)
async def set_participant_ready(
    participant_id: str, payload: ReadyRequest, db: Session = Depends(get_session)
):
    """El invitado marca 'Listo' cuando ya terminó de seleccionar lo que consumió,
    para que el anfitrión sepa quién falta sin tener que preguntar."""
    participant = db.get(Participant, participant_id)
    if not participant:
        raise HTTPException(status_code=404, detail="Participante no encontrado.")

    participant.is_ready = payload.ready
    db.add(participant)
    db.commit()

    bill = db.get(BillSession, participant.session_id)
    out = _build_session_out(db, bill)
    await manager.broadcast(participant.session_id, "items_updated", out.model_dump(mode="json"))
    return out
