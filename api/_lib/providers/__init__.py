from __future__ import annotations

from .anthropic_provider import AnthropicProvider
from .base import Provider, ProviderError
from .google_provider import GoogleProvider
from .openai_provider import OpenAIProvider

_REGISTRY: dict[str, type[Provider]] = {
    "anthropic": AnthropicProvider,
    "google": GoogleProvider,
    "openai": OpenAIProvider,
}


def get_provider(name: str) -> Provider:
    cls = _REGISTRY.get(name)
    if not cls:
        raise ProviderError(f"unknown provider {name!r}")
    return cls()
