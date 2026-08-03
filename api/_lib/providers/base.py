"""Provider adapter interface — one shape, three backends."""

from __future__ import annotations


class ProviderError(Exception):
    """Anything a provider adapter wants to surface as a clean user-facing message."""


class Provider:
    def validate(self, credentials: dict) -> None:
        """Cheap authenticated call. Raise ProviderError if the credentials don't work."""
        raise NotImplementedError

    def generate(self, task: str, model: str, credentials: dict) -> str:
        """Return the model's raw text response. Raise ProviderError on failure."""
        raise NotImplementedError
