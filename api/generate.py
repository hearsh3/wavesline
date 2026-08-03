"""POST /api/generate — write new in-character messages via the chosen provider."""

from __future__ import annotations

import json
import time
from http.server import BaseHTTPRequestHandler

from api._lib.models import PROVIDERS
from api._lib.parse import clean, extract_json
from api._lib.prompt import build_task
from api._lib.providers import ProviderError, get_provider


class handler(BaseHTTPRequestHandler):
    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            n = int(self.headers.get("content-length") or 0)
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception as exc:                         # noqa: BLE001
            return self._json(400, {"error": f"bad request: {exc}"})

        provider_name = body.get("provider") or ""
        credentials = body.get("credentials") or {}
        provider_cfg = PROVIDERS.get(provider_name)
        if not provider_cfg:
            return self._json(400, {"error": f"unknown provider {provider_name!r}"})

        thread = body.get("thread") or {}
        valid = {p.get("id") for p in thread.get("participants", []) if p.get("id")}
        if not valid:
            return self._json(400, {"error": "no participants supplied"})

        model = body.get("model") or provider_cfg["default"]
        if model not in provider_cfg["models"]:
            return self._json(400, {"error": f"unknown model {model!r} for {provider_name}"})

        mode = body.get("mode", "reply")
        if mode == "document" and not (body.get("document") or {}).get("text"):
            return self._json(400, {"error": "document mode needs a file"})

        task = build_task(body)
        t0 = time.time()
        try:
            provider = get_provider(provider_name)
            raw = provider.generate(task, model, credentials)
            msgs = clean(extract_json(raw), valid)
        except ProviderError as exc:
            return self._json(500, {"error": str(exc)})
        except Exception as exc:                         # noqa: BLE001
            return self._json(500, {"error": str(exc)[:600]})

        ms = int((time.time() - t0) * 1000)
        label = provider_cfg["models"][model]["label"]
        return self._json(200, {"messages": msgs, "model": label, "ms": ms})
