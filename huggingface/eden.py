"""Eden Gen /v1 calls for the Space. The Gradio process uses the visitor's token."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Callable

API = "https://edengen.ai/v1"
DEFAULT_MODELS = {"image": "nano-banana-2.1", "video": "seedance-2.5"}


class EdenGenError(Exception):
    def __init__(self, message: str, status: int = 0):
        super().__init__(message)
        self.status = status


class Cancelled(Exception):
    pass


@dataclass
class Estimate:
    usd_total: float
    can_run: bool
    needs_confirmation: bool
    blockers: list[str]

    def describe(self) -> str:
        price = f"${self.usd_total:.2f}"
        if not self.can_run:
            extra = " ".join(self.blockers)
            return f"This take cannot run ({price}). {extra}".strip()
        return (
            f"This take costs {price}. Confirm to spend workspace credit. "
            "A take that has been created is not cancelled by closing the page."
        )


@dataclass
class Take:
    id: str
    status: str
    output_url: str | None
    mime_type: str | None
    error: str | None
    simulated: bool
    refunded: bool


def _request(token: str, method: str, path: str, body: dict | None = None, headers: dict | None = None, opener=None) -> dict:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        API + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token.strip()}",
            "Accept": "application/json",
            **({"Content-Type": "application/json"} if body is not None else {}),
            **(headers or {}),
        },
    )
    try:
        response = (opener or urllib.request.urlopen)(req, timeout=60)
        raw = response.read().decode()
        return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        detail = error.read().decode()
        try:
            parsed = json.loads(detail)
        except json.JSONDecodeError:
            parsed = {}
        message = (parsed.get("error") or {}).get("message") if isinstance(parsed.get("error"), dict) else ""
        raise EdenGenError(message or f"HTTP {error.code}", error.code) from None


def _body(model: str, prompt: str, aspect_ratio: str, duration: int | None, confirm: bool) -> dict:
    payload: dict = {"model": model, "prompt": prompt, "aspect_ratio": aspect_ratio, "count": 1}
    if duration is not None:
        payload["duration"] = duration
    if confirm:
        payload["confirm_cost"] = True
    return payload


def estimate(token: str, model: str, prompt: str, aspect_ratio: str, duration: int | None = None, opener=None) -> Estimate:
    raw = _request(token, "POST", "/estimate", _body(model, prompt, aspect_ratio, duration, False), opener=opener)
    return Estimate(
        usd_total=float(raw.get("usd_total") or 0),
        can_run=bool(raw.get("can_run")),
        needs_confirmation=bool(raw.get("needs_confirmation")),
        blockers=list(raw.get("blockers") or []),
    )


def _as_take(raw: dict) -> Take:
    if "data" in raw and isinstance(raw["data"], list):
        if not raw["data"]:
            raise EdenGenError("Create returned no take.", 500)
        raw = raw["data"][0]
    output = raw.get("output") or {}
    return Take(
        id=str(raw.get("id") or ""),
        status=str(raw.get("status") or ""),
        output_url=output.get("url"),
        mime_type=output.get("mime_type"),
        error=raw.get("error"),
        simulated=bool(raw.get("simulated")),
        refunded=bool(raw.get("refunded")),
    )


def generate(
    token: str,
    kind: str,
    prompt: str,
    aspect_ratio: str,
    confirm: Callable[[Estimate], bool],
    model: str | None = None,
    opener=None,
    sleep=time.sleep,
    timeout_s: float = 600,
) -> Take:
    chosen = model or DEFAULT_MODELS["video" if kind == "video" else "image"]
    duration = 5 if kind == "video" else None
    price = estimate(token, chosen, prompt, aspect_ratio, duration, opener=opener)
    if not price.can_run:
        raise EdenGenError(price.describe(), 409)
    if not confirm(price):
        raise Cancelled()
    created = _as_take(
        _request(
            token,
            "POST",
            "/takes",
            _body(chosen, prompt, aspect_ratio, duration, price.needs_confirmation),
            headers={"Idempotency-Key": str(time.time_ns())},
            opener=opener,
        )
    )
    deadline = time.monotonic() + timeout_s
    current = created
    while current.status not in {"succeeded", "failed"}:
        if time.monotonic() > deadline:
            raise EdenGenError(f"Take {current.id} is still {current.status}. Check it in Eden Gen before creating another.", 504)
        sleep(2)
        current = _as_take(_request(token, "GET", f"/takes/{current.id}", opener=opener))
    if current.status == "failed":
        raise EdenGenError(current.error or "The take failed.", 422)
    if not current.output_url:
        raise EdenGenError("The take finished without a file.", 500)
    return current
