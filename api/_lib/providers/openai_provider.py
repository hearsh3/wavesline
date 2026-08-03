"""OpenAI — Chat Completions with Structured Outputs."""

from __future__ import annotations

from ..prompt import RULES, SCHEMA, WORLD
from .base import Provider, ProviderError


class OpenAIProvider(Provider):
    def _client(self, credentials: dict):
        import openai
        key = (credentials or {}).get("apiKey", "").strip()
        if not key:
            raise ProviderError("no OpenAI API key given")
        return openai.OpenAI(api_key=key)

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
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": WORLD + "\n" + RULES},
                    {"role": "user", "content": task},
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {"name": "weave_messages", "schema": SCHEMA, "strict": True},
                },
            )
        except Exception as exc:                         # noqa: BLE001
            raise ProviderError(str(exc)[:600]) from exc

        choice = resp.choices[0]
        if getattr(choice, "finish_reason", None) == "content_filter":
            raise ProviderError("the model declined this request")
        return choice.message.content or ""
