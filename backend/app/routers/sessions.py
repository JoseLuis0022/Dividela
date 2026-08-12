from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session, select

from .. import ocr
from ..config import get_settings
from ..db import get_session
from ..models import BillSession, Item, ItemSelection, Participant, SessionStatus
from ..schemas import (
    AnalyzePhotosResponse,
    ItemOut,
    ItemsBulkUpdate,
    JoinRequest,
    JoinResponse,
    ParticipantOut,
    SessionOut,
)
from ..ws_manager import manager

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _build_session_out(db: Session, bill: BillSession) -> SessionOut:
    items = db.exec(
        select(Item).where(Item.session_id == bill.id).order_by(Item.position)
    ).all()
    participants = db.exec(
        select(Participant).where(Participant.session_id == bill.id)
    ).all()
    selections = (
        db.exec(
            select(ItemSelection).where(ItemSelection.item_id.in_([i.id for i in items]))
        ).all()
        if items
        else []
    )

    by_item: dict[str, list[str]] = {}
    by_participant: dict[str, float] = {p.id: 0.0 for p in participants}
    selectors_count: dict[str, int] = {}
    for sel in selections:
        by_item.setdefault(sel.item_id, []).append(sel.participant_id)
        selectors_count[sel.item_id] = selectors_count.get(sel.item_id, 0) + 1

    item_by_id = {i.id: i for i in items}
    for sel in selections:
        item = item_by_id.get(sel.item_id)
        if not item:
            continue
        share = item.line_total / selectors_count[sel.item_id]
        by_participant[sel.participant_id] = by_participant.get(sel.participant_id, 0.0) + share

    settings = get_settings()
    return SessionOut(
        id=bill.id,
        status=bill.status,
        ticket_total_declared=bill.ticket_total_declared,
        items_total=sum(i.line_total for i in items),
        join_url=f"{settings.frontend_base_url.rstrip('/')}/join/{bill.id}",
        items=[
            ItemOut(
                id=i.id,
                name=i.name,
                quantity=i.quantity,
                unit_price=i.unit_price,
                line_total=i.line_total,
                position=i.position,
                selected_by=by_item.get(i.id, []),
            )
            for i in items
        ],
        participants=[
            ParticipantOut(
                id=p.id,
                name=p.name,
                is_host=p.is_host,
                is_ready=p.is_ready,
                total_owed=round(by_participant.get(p.id, 0.0), 2),
            )
            for p in participants
        ],
    )


def _get_bill_or_404(db: Session, session_id: str) -> BillSession:
    bill = db.get(BillSession, session_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Sesión no encontrada.")
    return bill


@router.post("", response_model=JoinResponse)
def create_session(payload: JoinRequest, db: Session = Depends(get_session)):
    """El anfitrión crea la sesión y de una vez queda registrado como participante host."""
    bill = BillSession()
    db.add(bill)
    db.flush()
    host = Participant(session_id=bill.id, name=payload.name.strip() or "Anfitrión", is_host=True)
    db.add(host)
    db.commit()
    return JoinResponse(session_id=bill.id, participant_id=host.id, is_host=True)


@router.get("/{session_id}", response_model=SessionOut)
def get_session_state(session_id: str, db: Session = Depends(get_session)):
    bill = _get_bill_or_404(db, session_id)
    return _build_session_out(db, bill)


@router.post("/{session_id}/photos", response_model=AnalyzePhotosResponse)
async def analyze_photos(
    session_id: str,
    photos: list[UploadFile] = File(...),
    db: Session = Depends(get_session),
):
    bill = _get_bill_or_404(db, session_id)
    if not photos:
        raise HTTPException(status_code=400, detail="Agrega al menos una foto del ticket.")

    payload = [(await f.read(), f.content_type or "image/jpeg") for f in photos]
    result = await ocr.analyze_receipt_photos(payload)

    # Reemplaza los ítems existentes de la sesión con el resultado consolidado.
    existing = db.exec(select(Item).where(Item.session_id == session_id)).all()
    for item in existing:
        db.delete(item)
    db.flush()

    new_items = []
    for idx, raw in enumerate(result["items"]):
        item = Item(
            session_id=session_id,
            name=raw["name"],
            quantity=raw["quantity"],
            unit_price=raw["unit_price"],
            line_total=raw["line_total"],
            position=idx,
        )
        db.add(item)
        new_items.append(item)

    if result.get("ticket_total") is not None:
        bill.ticket_total_declared = result["ticket_total"]
        db.add(bill)

    db.commit()

    warning = None
    if not new_items:
        warning = "No detectamos ítems en estas fotos. Intenta con otra foto o mejor luz."

    return AnalyzePhotosResponse(
        items=[
            ItemOut(
                id=i.id,
                name=i.name,
                quantity=i.quantity,
                unit_price=i.unit_price,
                line_total=i.line_total,
                position=i.position,
                selected_by=[],
            )
            for i in sorted(new_items, key=lambda x: x.position)
        ],
        ticket_total_declared=bill.ticket_total_declared,
        warning=warning,
    )


@router.patch("/{session_id}/items", response_model=SessionOut)
async def update_items(
    session_id: str, payload: ItemsBulkUpdate, db: Session = Depends(get_session)
):
    """El anfitrión agrega/edita/borra filas en la pantalla de confirmación."""
    bill = _get_bill_or_404(db, session_id)

    existing = {i.id: i for i in db.exec(select(Item).where(Item.session_id == session_id)).all()}
    kept_ids = {i.id for i in payload.items if i.id}

    for item_id, item in existing.items():
        if item_id not in kept_ids:
            db.delete(item)

    for idx, incoming in enumerate(payload.items):
        if incoming.id and incoming.id in existing:
            item = existing[incoming.id]
            item.name = incoming.name
            item.quantity = incoming.quantity
            item.unit_price = incoming.unit_price
            item.line_total = incoming.line_total
            item.position = idx
            db.add(item)
        else:
            db.add(
                Item(
                    session_id=session_id,
                    name=incoming.name,
                    quantity=incoming.quantity,
                    unit_price=incoming.unit_price,
                    line_total=incoming.line_total,
                    position=idx,
                )
            )

    if payload.ticket_total_declared is not None:
        bill.ticket_total_declared = payload.ticket_total_declared
        db.add(bill)

    db.commit()
    out = _build_session_out(db, bill)
    await manager.broadcast(session_id, "items_updated", out.model_dump(mode="json"))
    return out


@router.post("/{session_id}/confirm", response_model=SessionOut)
async def confirm_session(session_id: str, db: Session = Depends(get_session)):
    bill = _get_bill_or_404(db, session_id)
    bill.status = SessionStatus.confirmed
    db.add(bill)
    db.commit()
    out = _build_session_out(db, bill)
    await manager.broadcast(session_id, "session_confirmed", out.model_dump(mode="json"))
    return out
