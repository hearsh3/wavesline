"""Prompt assembly for the Signal Weave — provider-agnostic.

Shared by every provider adapter: this module only ever produces a system
string and a task string. What backend it gets sent to is somebody else's
problem.
"""

from __future__ import annotations

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
