"""Direct Anthropic API — the user pastes an ANTHROPIC_API_KEY-shaped key."""

from __future__ import annotations

from ..models import ANTHROPIC_MODELS, FALLBACK_BETA, FALLBACK_MODEL
from ..prompt import SCHEMA
from .base import Provider, ProviderError


class AnthropicProvider(Provider):
    def _client(self, credentials: dict):
        import anthropic
        key = (credentials or {}).get("apiKey", "").strip()
        if not key:
            raise ProviderError("no Anthropic API key given")
        return anthropic.Anthropic(api_key=key)

    def validate(self, credentials: dict) -> None:
        try:
            self._client(credentials).models.list(limit=1)
        except ProviderError:
            raise
        except Exception as exc:                        # noqa: BLE001
            raise ProviderError(str(exc)[:300]) from exc

    def generate(self, task: str, model: str, credentials: dict, system: str) -> str:
        caps = ANTHROPIC_MODELS.get(model)
        if not caps:
            raise ProviderError(f"unknown Anthropic model {model!r}")
        client = self._client(credentials)

        kwargs = {
            "model": model,
            "max_tokens": 8000,
            "system": [{"type": "text", "text": system,
                        "cache_control": {"type": "ephemeral"}}],
            "messages": [{"role": "user", "content": task}],
        }

        # Fable 5 thinks unconditionally and rejects an explicit config.
        if caps["thinking"] == "adaptive":
            kwargs["thinking"] = {"type": "adaptive"}

        output_config = {}
        if caps["effort"]:
            output_config["effort"] = "low"
        if caps["schema"]:
            output_config["format"] = {"type": "json_schema", "schema": SCHEMA}
        if output_config:
            kwargs["output_config"] = output_config

        try:
            if caps["beta"]:
                # Safety classifiers can decline outright; let the API rescue the call.
                kwargs["betas"] = [FALLBACK_BETA]
                kwargs["fallbacks"] = [{"model": FALLBACK_MODEL}]
                resp = client.beta.messages.create(**kwargs)
            else:
                resp = client.messages.create(**kwargs)
        except Exception as exc:                         # noqa: BLE001
            raise ProviderError(str(exc)[:600]) from exc

        if resp.stop_reason == "refusal":
            raise ProviderError("the model declined this request")
        return next((b.text for b in resp.content if b.type == "text"), "")
