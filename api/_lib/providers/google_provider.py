"""Google Vertex AI — Gemini via a pasted GCP service-account key.

Unlike the other two providers this isn't a bare API key: the client pastes
a project id, a region, and a full service-account JSON key, and the adapter
mints a short-lived OAuth token from that JSON on every request (nothing is
cached server-side between invocations).

Talks to the Vertex AI REST endpoint directly with urllib (stdlib) rather
than the `google-genai` SDK. The SDK's async httpx transport has a known
failure mode — "Cannot send a request, as the client has been closed." —
when it's handed a synchronous `service_account.Credentials` object inside
a one-shot serverless call; a plain REST POST sidesteps that whole class of
transport-lifecycle bug.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from ..models import GOOGLE_DEFAULT
from ..prompt import RULES, SCHEMA, WORLD
from .base import Provider, ProviderError

TIMEOUT = 55  # seconds — stay under vercel.json's maxDuration for api/generate.py


def _load_credentials(credentials: dict):
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    creds = credentials or {}
    project = creds.get("projectId", "").strip()
    location = creds.get("location", "").strip()
    sa_raw = creds.get("serviceAccountJson", "").strip()
    if not project or not location or not sa_raw:
        raise ProviderError("Vertex AI needs a project id, a region, and a service-account key")

    try:
        sa_info = json.loads(sa_raw)
    except json.JSONDecodeError as exc:
        raise ProviderError("service-account key isn't valid JSON") from exc

    try:
        sa_creds = service_account.Credentials.from_service_account_info(
            sa_info, scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        sa_creds.refresh(Request())
    except ProviderError:
        raise
    except Exception as exc:                             # noqa: BLE001
        raise ProviderError(f"bad service-account key: {exc}") from exc

    return project, location, sa_creds.token


def _endpoint(project: str, location: str, model: str) -> str:
    # The "global" endpoint has no location prefix on the hostname — every
    # other region does (e.g. "us-central1-aiplatform.googleapis.com").
    host = "aiplatform.googleapis.com" if location == "global" else f"{location}-aiplatform.googleapis.com"
    return (
        f"https://{host}/v1/projects/{project}/locations/{location}"
        f"/publishers/google/models/{model}:generateContent"
    )


def _post(url: str, token: str, payload: dict) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")[:600]
        raise ProviderError(f"{exc.code} {exc.reason}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise ProviderError(str(exc.reason)[:300]) from exc


class GoogleProvider(Provider):
    def validate(self, credentials: dict) -> None:
        project, location, token = _load_credentials(credentials)
        # A trivial, cheap generateContent call — this exercises auth, the
        # project/region combo, and API enablement all at once, which a bare
        # OAuth token mint would not catch (e.g. Vertex AI API not enabled).
        url = _endpoint(project, location, GOOGLE_DEFAULT)
        _post(url, token, {
            "contents": [{"role": "user", "parts": [{"text": "ping"}]}],
            "generationConfig": {"maxOutputTokens": 1},
        })

    def generate(self, task: str, model: str, credentials: dict) -> str:
        project, location, token = _load_credentials(credentials)
        url = _endpoint(project, location, model)
        payload = {
            "contents": [{"role": "user", "parts": [{"text": task}]}],
            "systemInstruction": {"parts": [{"text": WORLD + "\n" + RULES}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": SCHEMA,
            },
        }
        data = _post(url, token, payload)

        candidates = data.get("candidates") or []
        if not candidates:
            raise ProviderError("the model declined this request")
        parts = (candidates[0].get("content") or {}).get("parts") or []
        return "".join(p.get("text", "") for p in parts)
