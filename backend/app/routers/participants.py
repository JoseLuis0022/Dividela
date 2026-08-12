from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..db import get_session
from ..models import BillSession, Participant
from ..schemas import JoinRequest, JoinResponse
from ..ws_manager import manager
from .sessions import _build_session_out

router = APIRouter(prefix="/api/sessions", tags=["participants"])


@router.post("/{session_id}/join", response_model=JoinResponse)
async def join_session(session_id: str, payload: JoinRequest, db: Session = Depends(get_session)):
    bill = db.get(BillSession, session_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Esta cuenta ya no existe o el enlace es incorrecto.")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Escribe tu nombre para unirte.")

    participant = Participant(session_id=session_id, name=name, is_host=False)
    db.add(participant)
    db.commit()

    out = _build_session_out(db, bill)
    await manager.broadcast(session_id, "participant_joined", out.model_dump(mode="json"))
    return JoinResponse(session_id=bill.id, participant_id=participant.id, is_host=False)
