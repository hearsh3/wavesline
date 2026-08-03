"""Lenient extraction of the {"messages":[...]} payload from a model's raw text.

Only Anthropic's structured-output path (beta json_schema format) is battle
tested here. OpenAI/Google's schema modes are meant to make this redundant,
but a model can still wrap its answer in prose or a code fence, so every
provider routes its raw text through the same fallback chain.
"""

from __future__ import annotations

import json
import re


def extract_json(text: str) -> dict:
    text = (text or "").strip()
    if not text:
        raise ValueError("empty response")
    fence = re.search(r"```(?:json)?\s*(.+?)```", text, re.S)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        return json.loads(text[start:end + 1])
    raise ValueError(f"could not find JSON in: {text[:240]}")


def clean(data: dict, valid: set[str]) -> list[dict]:
    out = []
    for m in (data.get("messages") or []):
        if not isinstance(m, dict):
            continue
        who = str(m.get("from", "")).strip().lstrip("@")
        txt = str(m.get("text", "")).strip()
        # Mei writes her own messages; drop anything trying to speak for her.
        if not who or not txt or who == "mei" or who not in valid:
            continue
        out.append({"from": who, "text": txt[:600]})
    return out[:14]
