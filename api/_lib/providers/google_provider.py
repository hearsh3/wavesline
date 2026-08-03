"""Google Vertex AI — Gemini via a pasted GCP service-account key.

Unlike the other two providers this isn't a bare API key: the client pastes
a project id, a region, and a full service-account JSON key, and the adapter
mints short-lived OAuth credentials from that JSON on every request (nothing
is cached server-side between invocations).

This is the adapter most likely to need adjustment once actually run against
a real GCP project — `response_schema` support and accepted region/model
combinations vary by `google-genai` SDK version.
"""

from __future__ import annotations

import json

from ..prompt import RULES, SCHEMA, WORLD
from .base import Provider, ProviderError


class GoogleProvider(Provider):
    def _client(self, credentials: dict):
        from google import genai
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
        except Exception as exc:                         # noqa: BLE001
            raise ProviderError(f"bad service-account key: {exc}") from exc

        return genai.Client(vertexai=True, project=project, location=location, credentials=sa_creds)

    def validate(self, credentials: dict) -> None:
        try:
            self._client(credentials).models.list()
        except ProviderError:
            raise
        except Exception as exc:                        # noqa: BLE001
            raise ProviderError(str(exc)[:300]) from exc

    def generate(self, task: str, model: str, credentials: dict) -> str:
        client = self._client(credentials)
        try:
            resp = client.models.generate_content(
                model=model,
                contents=task,
                config={
                    "system_instruction": WORLD + "\n" + RULES,
                    "response_mime_type": "application/json",
                    "response_schema": SCHEMA,
                },
            )
        except Exception as exc:                         # noqa: BLE001
            raise ProviderError(str(exc)[:600]) from exc

        if not resp.candidates:
            raise ProviderError("the model declined this request")
        return resp.text or ""
