"""POST /api/health — validate a provider + credentials pair.

There's no server-configured backend to report on anymore: credentials are
supplied by the client per request, so "health" means "do these credentials
actually authenticate," checked with one cheap provider call.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

from api._lib.models import PROVIDERS, model_table
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
            return self._json(400, {"ok": False, "error": f"bad request: {exc}"})

        provider_name = body.get("provider") or ""
        credentials = body.get("credentials") or {}
        if provider_name not in PROVIDERS:
            return self._json(400, {"ok": False, "error": f"unknown provider {provider_name!r}"})

        try:
            get_provider(provider_name).validate(credentials)
        except ProviderError as exc:
            return self._json(200, {"ok": False, "error": str(exc)})
        except Exception as exc:                         # noqa: BLE001
            return self._json(200, {"ok": False, "error": str(exc)[:300]})

        return self._json(200, {
            "ok": True,
            "models": model_table(provider_name),
            "default": PROVIDERS[provider_name]["default"],
        })
