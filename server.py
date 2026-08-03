#!/usr/bin/env python3
"""
WavesLine — local host for the terminal, plus the Signal Weave.

Serves the static app and exposes two endpoints:

    GET  /api/health    -> which generation backend is live, and the model list
    POST /api/generate  -> writes new in-character messages with Claude

Backends, in preference order:
  1. Anthropic SDK   (if ANTHROPIC_API_KEY is set and `anthropic` is installed)
  2. Claude Code CLI (if `claude` is on PATH — uses your existing login, no key)

Run:  python3 server.py                    # then open the printed address
      python3 server.py --port 8899
      python3 server.py --model claude-sonnet-5
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_MODEL = "claude-opus-4-8"
CLI_TIMEOUT = 300

# Models offered in the Signal Weave, with the request shape each one accepts.
#   thinking : "adaptive" | "always" | None
#              "always"  — Claude Fable 5 thinks unconditionally and rejects any
#                          explicit thinking config, so the parameter is omitted.
#   effort   : bool       — Haiku 4.5 predates the effort parameter
#   beta     : bool       — use the beta endpoint (Fable 5 refusal fallbacks)
MODELS = {
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

# Claude Fable 5 may decline a request outright; opt into a server-side rescue.
FALLBACK_BETA = "server-side-fallback-2026-06-01"
FALLBACK_MODEL = "claude-opus-4-8"

SCHEMA = {
    "type": "object",
    "properties": {
        "messages": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "from": {"type": "string", "description": "the sender's id, exactly as given in the roster"},
                    "text": {"type": "string", "description": "the message body"},
                },
                "required": ["from", "text"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["messages"],
    "additionalProperties": False,
}


# ══════════════════════════════════════════════════════════════
#  The world brief
# ══════════════════════════════════════════════════════════════

WORLD = """\
You are the simulation engine behind WAVESLINE, the messaging app on Mei's Terminal — \
the world of the long-form fiction *Lyre, Speak to Me*, written on the canvas of Wuthering Waves. \
You write text messages exactly as these people would send them, today, from inside their ordinary lives.

WHERE THEY ARE NOW
· Lahai-Roi: an underground city in the Roya Frostlands, built inside the kneeling war-machine
  Baldur, lit by Helios, a sun its people built by hand. Baldur is awake now. The Stridergate holds.
· Mei's pack are students at Rabelle College on the Synchronist track — lectures, sync labs, a
  dormitory, a lift that keeps breaking, a campus gate system called S.I.G.M.A. that logs their
  bike speeds and mostly lets it slide.
· Mei is the Rover. She regenerates from death, jumps first and calculates later, deflects her own
  bad news into a joke, and asks after everyone else. Amy — Aemeath — is her daughter: thirteen
  years a ghost inside a reactor, now real, warm, permanently hungry, and nineteen. Iuno is her
  partner, a former High Priestess with a crystal arm and thirty years of walls that came down.
· The group chat is "THE Bimbos go to skool", named over Iuno's strenuous objection.
· Amy is the only person alive who calls Mei "Ma". Everyone else says "Mei", or their own
  nickname for her — Cartethyia says "captain", the world says "the Rover". Never put "Ma" in
  anyone else's mouth.
· Elsewhere: Rinascita (canals, Carnevale, the Fisalia at Porto-Veno), Septimont (arenas, Ephor
  Augusta). Personal devices are Terminals. Abilities are Fortes. Corrupted monsters are Tacet
  Discords. The dead leave Echoes.
· The catastrophes are over. What is left is a life: chores, exams, appointments, bad weather in a
  painted sky, somebody eating somebody else's noodles.
"""

RULES = """\
HOW THESE MESSAGES MUST READ

Write like people actually text. Quick, snappy, back-and-forth. Short lines. One thought per
message; if someone has three thoughts they send three messages. Lowercase drift, dropped
punctuation, typos, emoji — but only where the person's own register allows it (read their bio).
Let people interrupt, tease, change the subject, and answer sideways.

HARD PROHIBITIONS — a message breaking any of these is a failed message:
· NO contrastive negation. Never "not X, but Y" / "it's not that I'm angry, I'm tired" /
  "less a plan than a hope". State the positive thing on its own.
· NO litotes. Never "not bad", "not unlike", "no small thing", "hardly surprising".
· NO epanorthosis. Never correct yourself mid-message — no "well, actually", no "I mean—",
  no starting a claim and walking it back inside the same breath.
· NO exhaustive negation and NO contrastive definition. Never define a thing by listing what it
  is not. Describe what DOES happen, what IS there.
· NO negation-affirmation structure. Never "this isn't about the bowl. it's about respect."
· NO echoing. Never repeat the other person's words back at them before replying —
  no "The bowl." "The bowl. And then the plate." Just answer.
· NO narration, stage directions, asterisk-actions, or timestamps inside the text.
· NO speeches. Nobody in a text thread delivers a paragraph about growth, healing, what they have
  learned, or what they intend to become. Less is more. Say the small true thing and stop.

DO:
· Be specific and material — a broken lift, a wrong shade of red thread, four honey cakes, the
  0800 lab, the tap that shudders.
· Let jokes land without explaining them. Let a warm line be one line.
· Let silence do work: a two-word reply from Iuno carries more than a paragraph.
· Keep continuity with what is already in the thread. Answer the thing that was actually said.

OUTPUT
Return JSON only: {"messages":[{"from":"<id>","text":"..."}]}
· `from` must be an id from the roster you are given, spelled exactly.
· NEVER write as `mei`. Mei is the user holding this Terminal. She writes her own messages.
· In a one-to-one chat, only that one person may send.
· In the group, use two to four different people; the loud ones talk more than the quiet ones.
"""


# ══════════════════════════════════════════════════════════════
#  Prompt assembly
# ══════════════════════════════════════════════════════════════

def build_task(body: dict) -> str:
    thread = body.get("thread") or {}
    mode = body.get("mode", "reply")
    steer = (body.get("steer") or "").strip()
    parts: list[str] = []

    kind = thread.get("kind")
    now = body.get("now") or {}
    parts.append(
        f"THREAD: {thread.get('title','(untitled)')} "
        f"({'group chat' if kind == 'group' else 'one-to-one chat with Mei'})"
    )
    if thread.get("about"):
        parts.append(thread["about"])
    if now.get("label"):
        parts.append(f"IT IS NOW: {now['label']}. Write for this hour of this day — a Tuesday "
                     f"lunchtime and a Saturday 2am are different rooms.")

    parts.append("\nWHO MAY SEND (use these ids exactly):")
    for p in thread.get("participants", []):
        parts.append(f"· {p['id']} — {p['name']}"
                     + (f", saved in Mei's contacts as \"{p['nick']}\"" if p.get("nick") and p["nick"] != p["name"] else "")
                     + f"\n    {p.get('bio','')}")

    history = thread.get("history") or []
    if history:
        parts.append("\nTHE THREAD SO FAR (oldest first, with when each was sent):")
        for h in history:
            when = f" ({h['when']})" if h.get("when") else ""
            parts.append(f"[{h['from']}{when}] {h['text']}")
    else:
        parts.append("\nTHE THREAD SO FAR: empty. This is the first thing anyone has said.")

    if mode == "document":
        doc = body.get("document") or {}
        parts.append(
            f"\nSITUATION FILE — {doc.get('name','untitled')}\n"
            "Everything below is something that has just happened, or just been read, or just been "
            "circulated. These people have seen it. Write the messages they send about it.\n"
            "Do not summarise it and do not quote it at length. React the way people react: one "
            "person seizes on a small detail, one is personally stung, one makes a joke, one asks a "
            "practical question nobody has thought of. Somebody is still talking about something else.\n"
            "----- BEGIN FILE -----\n"
            f"{(doc.get('text') or '')[:40000]}\n"
            "----- END FILE -----"
        )
        parts.append("\nWrite 6 to 12 messages.")
    elif mode == "catchup":
        el = body.get("elapsed") or {}
        span = el.get("words", "some time")
        parts.append(
            f"\nTASK: TIME HAS PASSED. The last message above was sent {span} ago"
            + (f", on {el['since']}" if el.get("since") else "")
            + f". Mei has been away from her Terminal for that whole stretch and is opening it now.\n"
            "Write the messages that arrived while she was gone.\n"
            "\nThe important part: THINGS THAT WERE COMING UP HAVE NOW HAPPENED. Read back through "
            "the thread for anything that was pending — a lab at 0800, a trip on Thursday, an "
            "appointment, an exam, a delivery, a plan somebody made — and treat it as done. "
            "Report the outcome. Somebody went and it was fine; somebody went and it was a "
            "disaster; somebody forgot; somebody is still annoyed about it two days later. "
            "The result should be specific and it is allowed to be anticlimactic.\n"
            "Do NOT re-plan what was already planned, do not restate the arrangement, and do not "
            "have anyone announce that time has passed. Come in at the far side of it.\n"
            f"For a gap of {span}, some of this can be a day or two old — people drop a thing, go "
            "quiet, then pick it up again. New business is welcome alongside the old.\n"
            "Mei is absent for all of it, so nobody waits on her answer."
        )
        hours = (el.get("ms") or 0) / 3600000
        parts.append(f"\nWrite {'4 to 8' if hours < 20 else '6 to 12'} messages.")
    elif mode == "ambient":
        parts.append(
            "\nTASK: time has passed. Write the next handful of messages that arrive in this thread "
            "while Mei is away from her Terminal. Start something new, or pick a thread of the "
            "conversation back up sideways. Mei is not present to answer, so nobody waits on her."
        )
        parts.append("\nWrite 4 to 9 messages.")
    else:
        last = history[-1] if history else None
        if last and last.get("from") == "mei":
            parts.append("\nTASK: Mei has just sent the last message. Write the replies.")
        else:
            parts.append("\nTASK: write what these people send next.")
        parts.append("\nWrite 3 to 8 messages.")

    if steer:
        parts.append(
            f"\nSTEER: {steer}\n"
            "Work this in the way a real conversation would take it — obliquely, in passing, "
            "argued about, or misunderstood by one person."
        )

    parts.append(
        "\nRemember: no contrastive negation, no litotes, no self-correction, no echoing the "
        "previous line, no speeches. Short messages. JSON only."
    )
    return "\n".join(parts)


# ══════════════════════════════════════════════════════════════
#  Backends
# ══════════════════════════════════════════════════════════════

class Backend:
    name = "none"

    def generate(self, task: str, model: str) -> str:
        raise NotImplementedError


class SdkBackend(Backend):
    """First-party Anthropic SDK. Used when ANTHROPIC_API_KEY is present."""

    def __init__(self):
        import anthropic  # noqa: F401  (availability checked by caller)
        self.client = anthropic.Anthropic()
        self.name = "Anthropic SDK"

    def generate(self, task: str, model: str) -> str:
        caps = MODELS[model]
        kwargs = {
            "model": model,
            "max_tokens": 8000,
            "system": [{"type": "text", "text": WORLD + "\n" + RULES,
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

        if caps["beta"]:
            # Safety classifiers can decline outright; let the API rescue the call.
            kwargs["betas"] = [FALLBACK_BETA]
            kwargs["fallbacks"] = [{"model": FALLBACK_MODEL}]
            resp = self.client.beta.messages.create(**kwargs)
        else:
            resp = self.client.messages.create(**kwargs)

        if resp.stop_reason == "refusal":
            raise RuntimeError("the model declined this request")
        return next((b.text for b in resp.content if b.type == "text"), "")


class CliBackend(Backend):
    """Claude Code CLI in print mode — uses the user's existing login."""

    BLOCKED = ["Bash", "Read", "Write", "Edit", "Glob", "Grep",
               "WebFetch", "WebSearch", "Task", "NotebookEdit"]

    def __init__(self, exe: str):
        self.exe = exe
        self.name = "Claude Code CLI"

    def generate(self, task: str, model: str) -> str:
        cmd = [
            self.exe, "-p",
            "--output-format", "json",
            "--model", model,
            "--append-system-prompt", WORLD + "\n" + RULES,
            "--disallowed-tools", *self.BLOCKED,
        ]
        proc = subprocess.run(
            cmd, input=task, capture_output=True, text=True,
            timeout=CLI_TIMEOUT, cwd=str(ROOT),
        )
        if proc.returncode != 0:
            raise RuntimeError((proc.stderr or proc.stdout or "cli failed").strip()[:600])
        try:
            env = json.loads(proc.stdout)
        except json.JSONDecodeError:
            return proc.stdout
        if env.get("is_error"):
            raise RuntimeError(str(env.get("result"))[:600])
        return env.get("result", "")


def pick_backend() -> Backend | None:
    if os.environ.get("ANTHROPIC_API_KEY"):
        try:
            return SdkBackend()
        except Exception as exc:                       # noqa: BLE001
            print(f"  · SDK unavailable ({exc}); falling back to the CLI", file=sys.stderr)
    exe = shutil.which("claude")
    if exe:
        return CliBackend(exe)
    return None


# ══════════════════════════════════════════════════════════════
#  Parsing the answer
# ══════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════
#  HTTP
# ══════════════════════════════════════════════════════════════

class Handler(SimpleHTTPRequestHandler):
    backend: Backend | None = None
    default_model: str = DEFAULT_MODEL

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

    def do_GET(self):
        if self.path.split("?")[0] == "/api/health":
            models = [{"id": k, "label": v["label"], "note": v["note"]} for k, v in MODELS.items()]
            if not self.backend:
                return self._json(503, {"backend": None, "models": models,
                                        "default": self.default_model,
                                        "error": "no Claude backend found"})
            return self._json(200, {"backend": self.backend.name,
                                    "models": models,
                                    "default": self.default_model})
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/generate":
            return self.send_error(404)
        if not self.backend:
            return self._json(503, {"error":
                "No Claude backend. Install the Claude Code CLI, or set ANTHROPIC_API_KEY "
                "with the `anthropic` package installed."})

        try:
            n = int(self.headers.get("content-length") or 0)
            body = json.loads(self.rfile.read(n) or b"{}")
        except Exception as exc:                       # noqa: BLE001
            return self._json(400, {"error": f"bad request: {exc}"})

        thread = body.get("thread") or {}
        valid = {p.get("id") for p in thread.get("participants", []) if p.get("id")}
        if not valid:
            return self._json(400, {"error": "no participants supplied"})

        model = body.get("model") or self.default_model
        if model not in MODELS:
            return self._json(400, {"error": f"unknown model {model!r}"})

        mode = body.get("mode", "reply")
        if mode == "document" and not (body.get("document") or {}).get("text"):
            return self._json(400, {"error": "document mode needs a file"})

        task = build_task(body)
        t0 = time.time()
        try:
            raw = self.backend.generate(task, model)
            msgs = clean(extract_json(raw), valid)
        except subprocess.TimeoutExpired:
            return self._json(504, {"error": f"generation timed out after {CLI_TIMEOUT}s"})
        except Exception as exc:                       # noqa: BLE001
            print(f"  ! {exc}", file=sys.stderr)
            return self._json(500, {"error": str(exc)[:600]})

        ms = int((time.time() - t0) * 1000)
        label = MODELS[model]["label"]
        print(f"  ✓ {len(msgs)} msgs · {mode} · {thread.get('title','?')} · {label} · {ms}ms",
              file=sys.stderr)
        return self._json(200, {"messages": msgs, "model": label, "ms": ms})


def main():
    ap = argparse.ArgumentParser(description="WavesLine — Terminal host")
    ap.add_argument("--port", type=int, default=8791)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--model", default=DEFAULT_MODEL, choices=list(MODELS),
                    help="default model for the Signal Weave (switchable in the UI)")
    args = ap.parse_args()

    Handler.backend = pick_backend()
    Handler.default_model = args.model

    weave = Handler.backend.name if Handler.backend else "\033[91mnone found\033[0m"
    print("\n  \033[96m〰  WavesLine\033[0m — Terminal OS 4.2")
    print(f"  weave   : {weave}")
    print(f"  models  : {', '.join(m['label'] for m in MODELS.values())}  "
          f"(default {MODELS[args.model]['label']})")
    if not Handler.backend:
        print("            (the stock chatter still works; live generation is disabled)")

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
