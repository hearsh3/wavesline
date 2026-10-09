"""GET /api/prompt — the default world brief and writing rules.

The Weave's prompt editor prefills its textareas from here, so a user can
tweak a line of the defaults rather than having to rewrite them from an
empty box. Overrides themselves live in the browser and ride along with
each /api/generate request.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

from api._lib.prompt import RULES, WORLD


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({"world": WORLD, "rules": RULES}).encode()
        self.send_response(200)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(body)))
        self.send_header("cache-control", "no-store")
        self.end_headers()
        self.wfile.write(body)
