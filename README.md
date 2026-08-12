# WavesLine

*Mei's Terminal, some months after the Stridergate. One app is installed.*

An in-world messaging simulator for *Lyre, Speak to Me* — the group chat, the
private threads, and a live line to a model of your choosing when you want the
cast to say something new.

## Running it

```sh
python3 server.py
# → http://127.0.0.1:8791/
```

That serves the app **and** the Signal Weave, which writes new messages through
whichever provider you configure in the panel. There's a `wavesline` entry in `.claude/launch.json` too.

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

The prompt lives in `api/_lib/prompt.py` and is built along the lines of the
Marinara Spaghetti group-roleplay preset. The model is framed as a **game master**
running a continuous group roleplay: it plays everyone, the user plays Mei and
only Mei. Four critical instructions carry the weight:

1. **Resistance play.** These are autonomous people with their own agendas, and
   they must resist Mei when their beliefs clash with where she is pushing —
   kindly or cruelly, whichever fits. Nobody exists to agree with her. *A thread
   in which everyone validates Mei is a failed thread.*
2. **Show, don't tell** — the object, the hour, the number. Nobody narrates their
   own emotional state or explains their own character.
3. **Character dialogue** — quick, back-and-forth, natural, with the relationships
   between these people taken into account.
4. **Guidelines** — SFW for mature audiences; the user sets the boundaries; dark
   themes and profanity are fine, anyone can be harmed, explicit content cuts to
   black.

On top of that sit the texting rules and the same hard prohibitions as before:
no contrastive negation ("not X, but Y"), no litotes ("not bad"), no
self-correction mid-message, no defining a thing by what it isn't, no echoing the
previous line back, no stage directions, no speeches about growth.

**The burst size is rolled fresh on every request** — 1 to 6 messages for a
conversational turn, so the cadence never settles into a recognisable rhythm.
Sometimes one word from one person; sometimes six piling over each other. The two
modes that stand in for elapsed time (catch-up, situation file) roll 4 to 11,
since one message would defeat the feature.

The bios in `data.js` are load-bearing, and are now written down from the
SillyTavern character cards in the parent folder (`Iuno.json`, `Lupa.json`,
`Cartethyia.json`, `Ciaccona.json`, `Chisa.json`, `Lynae.json`, `Aemeath.json`,
`Mei1.json`, `Hiyuki.json`) — specimens rather than adjectives, which is what
makes a voice hold. A sharper bio produces a sharper voice.

The Weave's prompt editor can override the world brief and the rules per request
from the browser; anything it doesn't send falls back to the defaults above.

### Providers and models

The Weave is multi-provider. Pick a provider and model from the panel's settings
menu; credentials are supplied by you, stored in the browser, and sent per
request. The table lives in one place — `PROVIDERS` in `api/_lib/models.py`:

| | |
|---|---|
| **Anthropic (Claude)** | Opus 4.8 (default), Sonnet 5, Fable 5, Haiku 4.5 |
| **Google (Vertex AI)** | Gemini 3.1 Pro, 3.5 Flash, 3.6 Flash |
| **OpenAI** | GPT-5, GPT-5 mini |

Each provider adapter lives in `api/_lib/providers/`. Prompt assembly is shared
and provider-agnostic (`api/_lib/prompt.py`), so the register above is identical
whichever model you point it at.

Running locally, `server.py` mirrors the Vercel functions in `api/` — both import
the same adapters, so behaviour can't drift between dev and production. If a local
request omits credentials entirely it falls back to `ANTHROPIC_API_KEY` from the
environment; the deployed functions don't, since credentials are meant to be
user-supplied.

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
