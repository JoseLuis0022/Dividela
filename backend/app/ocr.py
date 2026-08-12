"""Lectura del ticket con un modelo de visión vía OpenRouter.

Todas las fotos del lote se mandan JUNTAS en un solo mensaje multimodal:
así el propio modelo resuelve los renglones repetidos entre fotos (por
ejemplo cuando una foto trae 3/4 del ticket y la siguiente la mitad, con
una zona de traslape) en vez de que nosotros tengamos que adivinar
duplicados comparando texto a mano.
"""
import base64
import json
import re

import httpx
from fastapi import HTTPException

from .config import get_settings

PROMPT = """Eres un asistente que lee tickets/recibos de restaurante fotografiados.

Te voy a enviar {n} fotografías. Estas {n} fotografías son fragmentos de UN MISMO ticket \
de restaurante (por ejemplo, alguien fotografió el ticket en partes porque es largo), así \
que es MUY PROBABLE que algunos renglones aparezcan repetidos en más de una foto porque las \
zonas fotografiadas se traslapan. Tu trabajo es reconstruir la lista de ítems consolidada del \
ticket completo, SIN renglones duplicados.

Reglas para interpretar cada renglón:
- Si el renglón no muestra una cantidad explícita, asume cantidad = 1.
- Si el renglón muestra una cantidad y un precio total combinado (ej. "3 Tiramisú ... $270"), \
calcula el precio unitario dividiendo (270 / 3 = 90).
- Si el mismo platillo aparece en líneas separadas idénticas dentro de la MISMA foto (ej. dos \
líneas de "Agua mineral $30" una junto a otra), trátalas como renglones legítimos distintos, no \
las fusiones entre sí — la fusión de duplicados es SOLO para renglones repetidos ENTRE fotos \
por el traslape de la fotografía, no para pedidos repetidos reales dentro de un mismo renglón visible una sola vez.
- Ignora renglones que no sean productos (ej. "Mesa 4", "Mesero: Juan", folios, fecha/hora).
- Si en alguna de las fotos se ve el total general del ticket impreso, repórtalo en "ticket_total". \
Si no es visible en ninguna foto, usa null.

Responde EXCLUSIVAMENTE con un JSON válido (sin texto adicional, sin markdown, sin ```), con esta forma exacta:
{{
  "items": [
    {{"name": "string", "quantity": number, "unit_price": number, "line_total": number}}
  ],
  "ticket_total": number | null
}}
"""


def _to_data_url(content: bytes, content_type: str) -> str:
    b64 = base64.b64encode(content).decode("ascii")
    return f"data:{content_type};base64,{b64}"


def _extract_json(raw: str) -> dict:
    raw = raw.strip()
    # El modelo a veces envuelve la respuesta en ```json ... ``` pese a la instrucción.
    fence = re.search(r"```(?:json)?\s*(.*?)```", raw, re.DOTALL)
    if fence:
        raw = fence.group(1).strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="No pudimos leer el ticket. Intenta con otra foto o mejor luz.",
        ) from exc


async def analyze_receipt_photos(photos: list[tuple[bytes, str]]) -> dict:
    """photos: lista de (bytes_de_la_imagen, content_type). Devuelve dict con
    'items' (list[dict]) y 'ticket_total' (float | None)."""
    settings = get_settings()
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=500,
            detail="Falta configurar OPENROUTER_API_KEY en el servidor.",
        )

    content: list[dict] = [{"type": "text", "text": PROMPT.format(n=len(photos))}]
    for data, content_type in photos:
        content.append(
            {
                "type": "image_url",
                "image_url": {"url": _to_data_url(data, content_type)},
            }
        )

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{settings.openrouter_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openrouter_model,
                "messages": [{"role": "user", "content": content}],
                "temperature": 0,
            },
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"El modelo de visión no respondió correctamente ({resp.status_code}).",
        )

    body = resp.json()
    try:
        raw_text = body["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise HTTPException(
            status_code=502, detail="Respuesta inesperada del modelo de visión."
        ) from exc

    parsed = _extract_json(raw_text)
    items = parsed.get("items", [])
    for item in items:
        item["name"] = str(item.get("name", "")).strip() or "Ítem sin nombre"
        item["quantity"] = float(item.get("quantity") or 1)
        item["unit_price"] = float(item.get("unit_price") or 0)
        item["line_total"] = float(
            item.get("line_total") or item["quantity"] * item["unit_price"]
        )
    return {"items": items, "ticket_total": parsed.get("ticket_total")}
