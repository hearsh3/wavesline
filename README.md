# WavesLine

*Mei's Terminal, some months after the Stridergate. One app is installed.*

An in-world messaging simulator for *Lyre, Speak to Me* — the group chat, the
private threads, and a live line to Claude when you want the cast to say
something new.

## Running it

```sh
python3 server.py
# → http://127.0.0.1:8791/
```

That serves the app **and** the Signal Weave, which writes new messages with
Claude. There's a `wavesline` entry in `.claude/launch.json` too.

You can also just double-click `index.html` — the terminal, the whole chat bank,
the composer and image attachments all work offline. Only live generation needs
the server.

Deep links: `#wavesline` skips the home screen and drops you into the app;
`#weave` and `#time` also open a panel.

## What it is

The Terminal boots to a home screen — clock, sky report, one app icon. Open
**WavesLine** and Mei's threads are already full.

**Every refresh draws a different week.** Each thread holds a bank of
self-contained scenes; on load the app picks a few per thread, spaces them across
the last six days, and stitches them into a history. Unread counts, previews and
the sidebar order fall out of whichever week you got. Hit **⟳ Retune** for
another one without reloading.

283 scenes and about 2,500 messages across 24 threads, so the same two
conversations rarely surface together. The group chat holds 94 of them; the seven
pack threads hold another 147 between them.

The bank is written off the side stories in the parent folder rather than
invented from scratch, so the running jokes have provenance: Chisa has been
moving Mei's mugs two inches from the counter edge for eleven months
(`the_ninth_step.md`), Ciaccona's lute takes forty percent of the hallway and
Cartethyia has walked into it nine times without mentioning her hip (same), Lupa
eats at Bo's under the ninth step of a public stairwell every Thursday and reads
the shipping notices (same), the cabin has a four-foot plush finch and a record
player tagged *For the duet. — I.* (`neon_green.md`, `It's Warm Now.md`), and
Lupa has carried a piece of the fighting pens in her shoulder since she was nine
(`requisition.md`).

## The threads

**THE Bimbos go to skool** — the group chat, named over Iuno's strenuous
objection. Eight members: Mei, Iuno, Lupa, Cartethyia, Ciaccona, Chisa, Lynae,
Amy. Bowls get broken, noodles get stolen, the lift is out again, and every so
often somebody says the quiet thing and everyone answers "heard".

Then the private lines:

| | |
|---|---|
| **Iuno** | saved as *Super Mega Priestess Iuno Lady*, which she has declined to change. Two cups, one of them cold. |
| **Amy** | nineteen, real, permanently hungry, keeping a tally of every time Mei showed up |
| **Cartethyia · Lupa · Ciaccona · Chisa · Lynae** | the pack, one at a time |
| **Cantarella · Carlotta · Phrolova** | Rinascita — camellias, information, an orchestra with a chair grievance |
| **Mornye · Lucilla · Luuk · Hiyuki · Sigrika** | Rabelle College and the people who run it |
| **Augusta · Agrat · Nuwa · Nivora** | an Ephor, two demons, and someone in a volunteer's vest |
| **Roccia · Brant** | the Troupe of Fools, still owing money in four states |
| **S.I.G.M.A. · Mengzhou Noodles** | the gate system and the noodle shop, both muted |

Twenty-three portraits are cropped from the character art in the parent folder;
everyone else gets a monogram in a hue derived from their name.

## Letting time pass

**Click the clock in the status bar.** Presets go from +1 hour to +1 week, plus
*next morning* and a custom amount in hours or days.

Messages keep the absolute timestamp they were written at, so pushing the clock
forward makes everything recede: *Today* becomes *Yesterday*, times become
weekdays, threads slide down the sidebar. The clock turns gold while the world is
running ahead, and **Reset** puts it back on real time. The offset survives a
reload (a reload still redraws the week, so you get a fresh history at the new
date).

The point is what it does to pending things. The bank is full of appointments —
a 0800 lab, a trip on Thursday, Iuno's recalibration, Lupa's fight night, a
delivery. Skip past them and they have happened.

**Catch up** collects the result. Whenever the open thread has gone quiet for
more than three hours, a banner appears above the composer: *"3 days since anyone
spoke here."* Press it and the cast fills in the gap — the server is told exactly
how long has passed and hands the model one instruction above all others: things
that were coming up have now happened, so report the outcome and don't re-plan
what was already planned.

A real 2-day skip on the group chat, from a thread that had a bowl shortage, a
broken lift, a haircut list and a rescheduled prosthetic appointment pending:

> **Cartethyia:** UPDATE the lift is fixed!!! / they made us do eleven floors on friday for NOTHING
> **Ciaccona:** i clapped when the doors opened, alone, like a lunatic
> **Chisa:** I cut Lynae's fringe on saturday. It is even now.
> **Lynae:** it is crooked and i love it, dont start
> **Iuno:** Calibration went. Arm holds.
> **Amy:** you actually went??
> **Iuno:** I went.

Catch-up messages are timestamped *inside* the gap — one conversation twenty
minutes long, finishing an hour or so before you picked the Terminal up — so a
new day separator appears and the thread reads current again rather than still
looking abandoned.

Every mode also gets the in-world date and time now, and each message in the
history is labelled with when it was sent, so a Tuesday lunchtime and a Saturday
2am read as different rooms.

## Writing to the thread

The composer is Mei's. Type and press enter. **📎** attaches images — you can
also paste them or drop them anywhere on the thread — and they send as photos
with your text as the caption.

## The Signal Weave

**⌁** in the thread header opens it. Three ways to make the cast say something new:

| Mode | What happens |
|---|---|
| **Ask for replies** | the people in this thread answer what's actually on screen |
| **New chatter** | messages arrive while Mei is away from her Terminal |
| **Situation file** | drop a `.txt` or `.md` on the dropzone and the thread reacts to it — as gossip, as a leak, as somebody's homework |
| **Catch up** | the fourth mode, reached from the gap banner rather than this panel — see *Letting time pass* |

**Steer** is an optional nudge ("the lift broke again", "everyone is hungover").
It gets worked in the way a real conversation takes a topic: obliquely, argued
about, or missed entirely by one person.

**Reply to me automatically** makes the thread answer every message you send.

Give it `The_Grand_Plan_Found_Documents.md` and watch Augusta find herself listed
under *preserved*. Give it `Spring Back 1.1.txt` and the group chat argues about
who was actually on which bike.

### Register

The prompt carries the world, every participant's bio, and the last 34 messages —
plus a hard list of the failure modes this kind of thing drifts into. Banned
outright: contrastive negation ("not X, but Y"), litotes ("not bad"),
self-correction mid-message, defining anything by what it isn't, echoing the
previous line back before replying, stage directions, and speeches about growth.
Short messages. One thought each. The model may never write as Mei — she holds
the Terminal.

The bios are load-bearing. A sharper bio produces a sharper voice.

### Models

Pick from the panel; the list comes from the server, so it lives in one place
(`MODELS` in `server.py`).

| | |
|---|---|
| **Opus 4.8** | sharpest voices — the default |
| **Sonnet 5** | close to Opus, quick on batches |
| **Fable 5** | most capable and priciest; thinks on every turn |
| **Haiku 4.5** | cheapest — blunter and more literal |

*(There is no "Opus 5" — Opus 4.8 is the current top of the Opus line, and
Fable 5 is the most capable model in the 5 family. Both are in the picker.)*

These are not interchangeable at the API level, so the server carries a small
capability table per model rather than passing the name through:

- **Fable 5** thinks unconditionally and **rejects any explicit `thinking`
  config**, so the parameter is omitted entirely. It also runs on the beta
  endpoint with `fallbacks: [{model: "claude-opus-4-8"}]`, so a safety-classifier
  decline gets re-served instead of returning nothing.
- **Haiku 4.5** predates adaptive thinking and the effort parameter — it gets neither.
- Opus 4.8 and Sonnet 5 get adaptive thinking, low effort, and the JSON schema.

### Backends

`server.py` picks whichever is available:

1. **Anthropic SDK** — used when `ANTHROPIC_API_KEY` is set and `anthropic` is installed.
2. **Claude Code CLI** — used otherwise, if `claude` is on `PATH`. Uses your
   existing login, so there's no key to configure. This is the default here.

If neither is present the panel reads `offline`, live generation is disabled, and
everything else keeps working.

```sh
python3 server.py --port 8899
python3 server.py --model claude-sonnet-5     # different default (still switchable in the UI)
```

## Files

| | |
|---|---|
| `index.html` | the device, the home screen, the app shell |
| `style.css` | everything visual |
| `data.js` | `PEOPLE` (the roster and its bios) and `THREADS` (the sidebar) |
| `chats.js` | `SCENES` — the whole chat bank |
| `app.js` | week-builder, thread renderer, composer, weave client |
| `server.py` | static host + `/api/generate` + `/api/health` |
| `avatars/*.webp` | 23 portraits, 176×176, cropped from the parent folder's art |

## Adding to it

A new person is one entry in `PEOPLE`:

```js
{ id:'someone', n:'Someone', nick:'What Mei saved them as', av:'someone', hue:210,
  b:'The bio. This is what the model reads to work out how they text.' }
```

`av` points at `avatars/<key>.webp`; leave it `null` for a monogram. Add a thread
for them in `THREADS`, then scenes under that thread id in `SCENES`:

```js
t_someone: [
  {k:'domestic', m:[
    {f:'someone', t:'the lift is out'},
    {f:'me',      t:'again'},
    {f:'someone', t:'again'},
  ]},
],
```

`f:'me'` is Mei. `{f:'x', ph:'caption'}` is a photo. `{sys:'text'}` is a thread
notice. Scenes are self-contained — they get shuffled and timestamped
independently, so nothing in one may depend on another.

## Notes

The tide behind everything is two SVG paths whose periods divide the viewBox
width exactly, drifted by a CSS keyframe — no `requestAnimationFrame`, so it
still moves in embedded browser views that report themselves hidden.

Messages are **visible by default**; the entrance animation is opt-in via a
`.enter` class that `app.js` adds only to messages arriving live, and only while
`document.visibilityState === 'visible'`. A hidden or throttled tab freezes CSS
animations at the 0% keyframe, so animating a message *into* view is a good way
to render an entire thread permanently blank. Loading a week of history without
30 simultaneous fly-ins is the nicer behaviour anyway.

Respects `prefers-reduced-motion`.

---

*WavesLine is a fan simulation. No real persons or organisations.*
