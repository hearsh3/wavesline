#!/usr/bin/env python3
"""
WavesLine — local host for the terminal, plus the Signal Weave.

Serves the static app and exposes two endpoints, mirroring the Vercel
serverless functions in api/health.py and api/generate.py exactly — both
this script and those functions import the same api/_lib adapters, so
behavior can't drift between local dev and production:

    POST /api/health    -> validate a provider + credentials pair
    POST /api/generate  -> write new in-character messages

Provider + credentials normally come from the Weave's settings menu in the
app (stored in the browser, sent per-request). For local convenience, if a
request omits them entirely, this script falls back to the Anthropic API
key in the ANTHROPIC_API_KEY environment variable — the Vercel functions
don't do this fallback, since there's no server-side env var to read once
credentials are meant to be user-supplied.

Run:  python3 server.py                    # then open the printed address
      python3 server.py --port 8899
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from api._lib.models import PROVIDERS, model_table       # noqa: E402
from api._lib.parse import clean, extract_json           # noqa: E402
from api._lib.prompt import RULES, WORLD, build_task, system_prompt  # noqa: E402
from api._lib.providers import ProviderError, get_provider  # noqa: E402


def _local_fallback(provider_name: str, credentials: dict) -> tuple[str, dict]:
    """Fill in ANTHROPIC_API_KEY from the environment if the client sent nothing."""
    if not provider_name and not (credentials or {}).get("apiKey"):
        key = os.environ.get("ANTHROPIC_API_KEY")
        if key:
            return "anthropic", {"apiKey": key}
    return provider_name, credentials


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def log_message(self, fmt, *args):
        if "/api/" in (self.path or ""):
            sys.stderr.write("  %s\n" % (fmt % args))

    def end_headers(self):
        # never cache the app itself — edit a file, reload, see the change
        if not (self.path or "").startswith("/api/"):
            self.send_header("cache-control", "no-store, must-revalidate")
        super().end_headers()

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> dict:
        n = int(self.headers.get("content-length") or 0)
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        if self.path.split("?")[0] == "/api/prompt":
            return self._json(200, {"world": WORLD, "rules": RULES})
        return super().do_GET()

    def do_POST(self):
        path = self.path.split("?")[0]
        if path == "/api/health":
            return self._health()
        if path == "/api/generate":
            return self._generate()
        return self.send_error(404)

    def _health(self):
        try:
            body = self._read_body()
        except Exception as exc:                         # noqa: BLE001
            return self._json(400, {"ok": False, "error": f"bad request: {exc}"})

        provider_name, credentials = _local_fallback(body.get("provider") or "", body.get("credentials") or {})
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

    def _generate(self):
        try:
            body = self._read_body()
        except Exception as exc:                         # noqa: BLE001
            return self._json(400, {"error": f"bad request: {exc}"})

        provider_name, credentials = _local_fallback(body.get("provider") or "", body.get("credentials") or {})
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
            raw = provider.generate(task, model, credentials, system_prompt(body))
            msgs = clean(extract_json(raw), valid)
        except ProviderError as exc:
            print(f"  ! {exc}", file=sys.stderr)
            return self._json(500, {"error": str(exc)})
        except Exception as exc:                         # noqa: BLE001
            print(f"  ! {exc}", file=sys.stderr)
            return self._json(500, {"error": str(exc)[:600]})

        ms = int((time.time() - t0) * 1000)
        label = provider_cfg["models"][model]["label"]
        print(f"  ✓ {len(msgs)} msgs · {mode} · {thread.get('title','?')} · {label} · {ms}ms",
              file=sys.stderr)
        return self._json(200, {"messages": msgs, "model": label, "ms": ms})


def main():
    ap = argparse.ArgumentParser(description="WavesLine — Terminal host")
    ap.add_argument("--port", type=int, default=8791)
    ap.add_argument("--host", default="127.0.0.1")
    args = ap.parse_args()

    print("\n  \033[96m〰  WavesLine\033[0m — Terminal OS 4.2")
    if os.environ.get("ANTHROPIC_API_KEY"):
        print("  weave   : ANTHROPIC_API_KEY set — used automatically if the Weave has no provider configured")
    else:
        print("  weave   : configure a provider from the Weave's settings menu (gear icon) in the app")

    port = args.port
    srv = None
    for attempt in range(12):
        try:
            srv = ThreadingHTTPServer((args.host, port), Handler)
            break
        except OSError as exc:
            if exc.errno not in (48, 98):            # EADDRINUSE
                raise
            port += 1
    if srv is None:
        print(f"  ! no free port near {args.port}", file=sys.stderr)
        return 1

    print(f"  open    : \033[4mhttp://{args.host}:{port}/\033[0m\n")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\n  signing off.\n")
    finally:
        srv.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
