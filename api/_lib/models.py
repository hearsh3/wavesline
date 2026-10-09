"""Per-provider model tables.

Single source of truth for what shows up in the Weave's model dropdown and
what's valid to send `/api/generate`. Model ids drift — whoever's touching
this file should double check current ids/regions against the provider's own
console before trusting what's hardcoded here.

Anthropic's table carries extra capability flags (thinking/effort/schema/beta)
because the different Claude models genuinely take different request shapes.
Google/Google and OpenAI's tables are plain (id, label, note) — their
adapters use one request shape per provider, not per model.
"""

from __future__ import annotations

DEFAULT_PROVIDER = "google"

# ══ Anthropic (direct API) ══════════════════════════════════════
#   thinking : "adaptive" | "always" | None
#              "always"  — Claude Fable 5 thinks unconditionally and rejects any
#                          explicit thinking config, so the parameter is omitted.
#   effort   : bool       — Haiku 4.5 predates the effort parameter
#   beta     : bool       — use the beta endpoint (Fable 5 refusal fallbacks)
ANTHROPIC_MODELS = {
    "claude-opus-4-8": {
        "label": "Opus 4.8", "note": "sharpest voices — the default",
        "thinking": "adaptive", "effort": True, "schema": True, "beta": False,
    },
    "claude-sonnet-5": {
        "label": "Sonnet 5", "note": "close to Opus, quick on batches",
        "thinking": "adaptive", "effort": True, "schema": True, "beta": False,
    },
    "claude-fable-5": {
        "label": "Fable 5", "note": "most capable, priciest — thinks on every turn",
        "thinking": "always", "effort": True, "schema": True, "beta": True,
    },
    "claude-haiku-4-5": {
        "label": "Haiku 4.5", "note": "cheapest — blunter, more literal",
        "thinking": None, "effort": False, "schema": True, "beta": False,
    },
}
ANTHROPIC_DEFAULT = "claude-opus-4-8"

# Claude Fable 5 may decline a request outright; opt into a server-side rescue.
FALLBACK_BETA = "server-side-fallback-2026-06-01"
FALLBACK_MODEL = "claude-opus-4-8"

# ══ Google (Vertex AI) ══════════════════════════════════════════
GOOGLE_MODELS = {
    "gemini-3.1-pro-preview": {"label": "Gemini 3.1 Pro (preview)", "note": "flagship — best for nuanced dialogue"},
    "gemini-3.5-flash": {"label": "Gemini 3.5 Flash", "note": "fast and cheap, blunter"},
    "gemini-3.6-flash": {"label": "Gemini 3.6 Flash", "note": "newest flash — quicker still"},
}
GOOGLE_DEFAULT = "gemini-3.1-pro-preview"

# ══ OpenAI ═══════════════════════════════════════════════════════
OPENAI_MODELS = {
    "gpt-5": {"label": "GPT-5", "note": "flagship"},
    "gpt-5-mini": {"label": "GPT-5 mini", "note": "cheaper, quicker"},
}
OPENAI_DEFAULT = "gpt-5"

PROVIDERS = {
    "anthropic": {"label": "Anthropic (Claude)", "models": ANTHROPIC_MODELS, "default": ANTHROPIC_DEFAULT},
    "google":    {"label": "Google (Vertex AI)",  "models": GOOGLE_MODELS,    "default": GOOGLE_DEFAULT},
    "openai":    {"label": "OpenAI",              "models": OPENAI_MODELS,    "default": OPENAI_DEFAULT},
}


def model_table(provider: str) -> list[dict]:
    cfg = PROVIDERS.get(provider)
    if not cfg:
        return []
    return [{"id": k, "label": v["label"], "note": v.get("note", "")} for k, v in cfg["models"].items()]
