/* ══════════════════════════════════════════════════════════════
   WavesLine — engine
   Draws a fresh week of chatter on every load, runs the
   composer, and talks to the Signal Weave.
   ══════════════════════════════════════════════════════════════ */
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rnd  = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;

/* Signal Weave providers. Mirrors api/_lib/models.py — keep the two in sync
   by hand; this table only drives the settings menu and dropdown, the
   server independently validates whatever model id actually gets sent. */
const PROVIDERS = {
  google: {
    label: 'Google (Vertex AI)',
    default: 'gemini-2.5-pro',
    models: [
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', note: 'flagship — best for nuanced dialogue' },
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', note: 'fast and cheap, blunter' },
    ],
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    default: 'claude-opus-4-8',
    models: [
      { id: 'claude-opus-4-8', label: 'Opus 4.8', note: 'sharpest voices — the default' },
      { id: 'claude-sonnet-5', label: 'Sonnet 5', note: 'close to Opus, quick on batches' },
      { id: 'claude-fable-5', label: 'Fable 5', note: 'most capable, priciest — thinks on every turn' },
      { id: 'claude-haiku-4-5', label: 'Haiku 4.5', note: 'cheapest — blunter, more literal' },
    ],
  },
  openai: {
    label: 'OpenAI',
    default: 'gpt-5',
    models: [
      { id: 'gpt-5', label: 'GPT-5', note: 'flagship' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini', note: 'cheaper, quicker' },
    ],
  },
};
const DEFAULT_PROVIDER = 'google';

/* Weave provider + credentials, pasted into the settings menu and kept only
   in this browser — sent per-request, never stored server-side. */
const WEAVE_CFG_KEY = 'wl.weaveCfg';
function loadWeaveCfg() {
  const base = { provider: DEFAULT_PROVIDER, google: {}, anthropic: {}, openai: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(WEAVE_CFG_KEY) || 'null');
    if (saved && typeof saved === 'object') {
      return Object.assign(base, saved, {
        google: Object.assign({}, base.google, saved.google),
        anthropic: Object.assign({}, base.anthropic, saved.anthropic),
        openai: Object.assign({}, base.openai, saved.openai),
      });
    }
  } catch { /* private mode or corrupt value */ }
  return base;
}
function saveWeaveCfg() {
  try { localStorage.setItem(WEAVE_CFG_KEY, JSON.stringify(state.weaveCfg)); } catch { /* private mode */ }
}
function currentCredentials() {
  const p = state.weaveCfg.provider;
  const c = state.weaveCfg[p] || {};
  return p === 'google'
    ? { projectId: c.projectId || '', location: c.location || '', serviceAccountJson: c.serviceAccountJson || '' }
    : { apiKey: c.apiKey || '' };
}
function hasCredentials() {
  const p = state.weaveCfg.provider;
  const c = state.weaveCfg[p] || {};
  return p === 'google' ? !!(c.projectId && c.location && c.serviceAccountJson) : !!c.apiKey;
}

/* Terminal time. `skew` is how far ahead of the wall clock the world has been
   pushed; NOW() is the only clock anything else is allowed to read. Messages
   keep the absolute timestamp they were written at, so pushing the clock
   forward makes the whole app recede into the past exactly as it should. */
const SKEW_KEY = 'wl.skew';
const state = {
  threads: {},        // id -> {meta, msgs, unread}
  open: null,
  weave: false,
  weaveCfg: loadWeaveCfg(),
  backend: null,
  busy: false,
  doc: null,          // {name, text}
  pending: [],        // staged image attachments
  skew: Math.max(0, +(localStorage.getItem(SKEW_KEY) || 0) || 0),
};

const NOW = () => Date.now() + state.skew;

/* ══ tide ════════════════════════════════════════════════ */
// Periods divide 1200 exactly, so the CSS drift loops without a seam.
function wavePath(amp, period, baseY, phase) {
  const pts = [];
  for (let x = -1200; x <= 2400; x += 20) {
    const y = baseY
      + Math.sin((x / period) * Math.PI * 2 + phase) * amp
      + Math.sin((x / (period / 4)) * Math.PI * 2 + phase * 1.7) * amp * 0.32;
    pts.push(`${x} ${y.toFixed(1)}`);
  }
  return `M-1200 900 L` + pts.join(' L') + ' L2400 900 Z';
}
function paintTide() {
  const a = document.querySelector('.tide-a');
  const b = document.querySelector('.tide-b');
  if (a) a.setAttribute('d', wavePath(46, 600, 470, 0));
  if (b) b.setAttribute('d', wavePath(34, 400, 590, 2.1));
}

/* ══ people helpers ══════════════════════════════════════ */
const person = id => BY_ID[id] || { id, n: id, nick: id, hue: 200, av: null };

function monoHue(p) { return p.hue ?? (([...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) * 47) % 360); }

function avatarEl(id, cls = 'av-md') {
  const p = person(id);
  if (p.av) {
    const img = document.createElement('img');
    img.className = `av ${cls}`;
    img.src = `avatars/${p.av}.webp`;
    img.alt = p.n;
    return img;
  }
  const d = document.createElement('div');
  const h = monoHue(p);
  d.className = `av av-mono ${cls}`;
  d.style.background = `linear-gradient(150deg, hsl(${h} 78% 70%), hsl(${(h + 42) % 360} 70% 52%))`;
  d.textContent = (p.n || '?').replace(/[^A-Za-z]/g, '').charAt(0).toUpperCase() || '?';
  d.title = p.n;
  return d;
}

function groupAvatar(members) {
  const w = document.createElement('div');
  w.className = 'av-stack';
  members.slice(0, 3).forEach(id => w.appendChild(avatarEl(id, '')));
  return w;
}

const threadTitle = t => t.kind === 'group' ? t.title : person(t.with).nick;
const threadSub   = t => t.kind === 'group'
  ? `${t.members.length + 1} members`
  : (person(t.with).n === person(t.with).nick ? 'online' : person(t.with).n);

/* ══ building a week ═════════════════════════════════════ */
let uid = 0;

function buildHistories() {
  state.threads = {};
  const now = NOW();

  THREADS.forEach(meta => {
    const bank = SCENES[meta.id] || [];
    const msgs = [];
    if (bank.length) {
      // how many scenes this thread gets — busy threads get more
      const want = meta.pin ? 3 + rnd(3) : (meta.muted ? 1 + rnd(2) : 2 + rnd(2));
      const chosen = shuffle([...bank]).slice(0, Math.min(want, bank.length));

      // spread them over the last ~6 days, newest last
      const slots = shuffle([...Array(11).keys()]).slice(0, chosen.length).sort((a, b) => b - a);
      chosen.forEach((scene, i) => {
        const slot = slots[i];
        const base = now - (slot * 13 * HOUR) - rnd(6 * HOUR) - 8 * MIN;
        let t = base;
        scene.m.forEach(raw => {
          t += 18000 + rnd(150000);
          // the bank writes Mei as 'me'; normalise it to her real id
          const mine = raw.f === 'me' || raw.f === ME;
          msgs.push({
            id: 'm' + (++uid),
            from: raw.sys ? null : (mine ? ME : raw.f),
            sys:  raw.sys || null,
            text: raw.t || null,
            ph:   raw.ph || null,
            ts:   t,
            mine,
          });
        });
      });
      msgs.sort((a, b) => a.ts - b.ts);
    }

    const last = msgs[msgs.length - 1];
    let unread = 0;
    if (last && !last.mine && !meta.muted && (now - last.ts) < 30 * HOUR && Math.random() < 0.55) {
      // count the tail of their messages as unread
      for (let i = msgs.length - 1; i >= 0 && !msgs[i].mine && unread < 9; i--) unread++;
    }
    state.threads[meta.id] = { meta, msgs, unread };
  });
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ══ time formatting ═════════════════════════════════════ */
const pad = n => String(n).padStart(2, '0');
const clock = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dayKey = ts => new Date(ts).toDateString();

function dayLabel(ts) {
  const t = dayKey(ts);
  if (t === dayKey(NOW())) return 'Today';
  if (t === dayKey(NOW() - DAY)) return 'Yesterday';
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
}

/* how long a span reads as, in words */
function spanWords(ms) {
  const m = Math.round(ms / MIN);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'}`;
  const h = Math.round(ms / HOUR);
  if (h < 36) return `${h} hour${h === 1 ? '' : 's'}`;
  const d = Math.round(ms / DAY);
  if (d < 14) return `${d} day${d === 1 ? '' : 's'}`;
  const w = Math.round(ms / (7 * DAY));
  return `${w} week${w === 1 ? '' : 's'}`;
}
function rowStamp(ts) {
  const age = NOW() - ts;
  if (age < DAY && dayKey(ts) === dayKey(NOW())) return clock(ts);
  if (age < 7 * DAY) return new Date(ts).toLocaleDateString(undefined, { weekday: 'short' });
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' });
}

/* ══ chat list ═══════════════════════════════════════════ */
function previewText(m) {
  if (!m) return '';
  if (m.sys) return m.sys;
  if (m.img) return '📷 Photo';
  if (m.ph)  return '📷 ' + m.ph;
  return m.text || '';
}

function renderList() {
  const q = ($('#search').value || '').trim().toLowerCase();
  const box = $('#chatlist');
  box.innerHTML = '';

  const rows = Object.values(state.threads)
    .map(t => ({ t, last: t.msgs[t.msgs.length - 1] }))
    .filter(({ t }) => {
      if (!q) return true;
      const hay = (threadTitle(t.meta) + ' ' +
        (t.meta.kind === 'group' ? t.meta.members.map(m => person(m).n).join(' ') : person(t.meta.with).n) + ' ' +
        t.msgs.slice(-40).map(m => m.text || m.ph || '').join(' ')).toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => {
      if (!!a.t.meta.pin !== !!b.t.meta.pin) return a.t.meta.pin ? -1 : 1;
      return (b.last?.ts || 0) - (a.last?.ts || 0);
    });

  rows.forEach(({ t, last }) => {
    const meta = t.meta;
    const row = document.createElement('button');
    row.className = 'row' + (state.open === meta.id ? ' is-active' : '') + (meta.muted ? ' is-muted' : '');
    row.appendChild(meta.kind === 'group' ? groupAvatar(meta.members) : avatarEl(meta.with, 'av-lg'));

    const body = document.createElement('div');
    body.className = 'row-body';

    const top = document.createElement('div');
    top.className = 'row-top';
    const nm = document.createElement('span'); nm.className = 'row-name'; nm.textContent = threadTitle(meta);
    const tm = document.createElement('span'); tm.className = 'row-time'; tm.textContent = last ? rowStamp(last.ts) : '';
    top.append(nm, tm);

    const prev = document.createElement('div');
    prev.className = 'row-prev';
    if (last && !last.sys && !last.mine && meta.kind === 'group') {
      const b = document.createElement('b'); b.textContent = person(last.from).n.split(' ')[0] + ': ';
      prev.appendChild(b);
    } else if (last && last.mine) {
      const b = document.createElement('b'); b.textContent = 'You: ';
      prev.appendChild(b);
    }
    prev.append(document.createTextNode(previewText(last)));
    body.append(top, prev);

    row.appendChild(body);
    if (t.unread) {
      const u = document.createElement('span'); u.className = 'row-unread'; u.textContent = t.unread;
      row.appendChild(u);
    }
    if (meta.pin) { const p = document.createElement('span'); p.className = 'row-pin'; p.textContent = '📌'; row.appendChild(p); }

    row.onclick = () => openThread(meta.id);
    box.appendChild(row);
  });

  const total = Object.values(state.threads).reduce((n, t) => n + t.unread, 0);
  const badge = $('#homeBadge');
  badge.hidden = !total;
  badge.textContent = total > 99 ? '99+' : total;
}

/* ══ thread ══════════════════════════════════════════════ */
function openThread(id) {
  state.open = id;
  const t = state.threads[id];
  t.unread = 0;

  const meta = t.meta;
  const head = $('#thHead .th-id');
  head.innerHTML = '';
  head.appendChild(meta.kind === 'group' ? groupAvatar(meta.members) : avatarEl(meta.with, 'av-md'));
  const txt = document.createElement('div');
  txt.className = 'th-txt';
  txt.innerHTML = `<b></b><span></span>`;
  txt.querySelector('b').textContent = threadTitle(meta);
  txt.querySelector('span').textContent = meta.kind === 'group'
    ? [ME, ...meta.members].map(m => person(m).n).join(' · ')
    : threadSub(meta);
  head.appendChild(txt);

  renderMessages();
  renderList();
  updateGapbar();
  $('#app').classList.add('thread-open');
  $('#input').focus({ preventScroll: true });
}

function renderMessages() {
  const box = $('#msgs');
  box.innerHTML = '';
  const t = state.threads[state.open];
  if (!t) return;

  if (!t.msgs.length) {
    box.classList.add('is-empty');
    box.innerHTML = `<div class="blank"><span class="wl-mark"></span><p>No signal yet — say something</p></div>`;
    return;
  }
  box.classList.remove('is-empty');

  let lastDay = null;
  t.msgs.forEach((m, i) => {
    const dk = dayKey(m.ts);
    if (dk !== lastDay) {
      lastDay = dk;
      const s = document.createElement('div');
      s.className = 'daysep'; s.textContent = dayLabel(m.ts);
      box.appendChild(s);
    }

    if (m.sys) {
      const n = document.createElement('div');
      n.className = 'notice'; n.textContent = m.sys;
      box.appendChild(n);
      return;
    }

    const prev = t.msgs[i - 1], next = t.msgs[i + 1];
    const runStart = !prev || prev.sys || prev.from !== m.from || dayKey(prev.ts) !== dk || (m.ts - prev.ts) > 5 * MIN;
    const runEnd   = !next || next.sys || next.from !== m.from || dayKey(next.ts) !== dk || (next.ts - m.ts) > 5 * MIN;

    // Only messages that landed during this session animate in, and only when the
    // page is actually being painted — see the .enter note in style.css. This is a
    // flag rather than a timestamp comparison because catch-up messages are
    // deliberately backdated and the Terminal clock can run ahead of the real one.
    const live = m.live && document.visibilityState === 'visible';
    const el = document.createElement('div');
    el.className = `m ${m.mine ? 'mine' : 'them'}${runStart ? ' first' : ''}${runEnd ? ' last' : ''}${live ? ' enter' : ''}`;
    el.appendChild(avatarEl(m.mine ? ME : m.from, 'av-sm'));

    const bub = document.createElement('div');
    bub.className = 'bub';
    if (runStart && !m.mine && t.meta.kind === 'group') {
      const who = document.createElement('span');
      who.className = 'who';
      who.style.color = `hsl(${monoHue(person(m.from))} 80% 72%)`;
      who.textContent = person(m.from).n;
      bub.appendChild(who);
    }
    if (m.ph || m.img) bub.appendChild(photoEl(m));
    if (m.text) bub.append(document.createTextNode(m.text));

    const st = document.createElement('span');
    st.className = 'stamp'; st.textContent = clock(m.ts);

    el.append(bub, st);
    box.appendChild(el);
  });

  requestIdle(() => { box.scrollTop = box.scrollHeight; });
}

function photoEl(m) {
  const fig = document.createElement('figure');
  fig.className = 'photo';
  if (m.img) {
    const img = document.createElement('img');
    img.src = m.img; img.alt = m.ph || 'attachment';
    fig.appendChild(img);
  } else {
    const fr = document.createElement('div');
    fr.className = 'frame';
    fr.style.filter = `hue-rotate(${rnd(80) - 40}deg)`;
    fr.innerHTML = `<b>IMG_${1000 + rnd(8999)}</b>`;
    fig.appendChild(fr);
  }
  if (m.ph) { const c = document.createElement('figcaption'); c.textContent = m.ph; fig.appendChild(c); }
  return fig;
}

// the browser pane can report itself hidden, which stalls rAF — fall back to a timer
function requestIdle(fn) { setTimeout(fn, 0); }

/* ══ sending ═════════════════════════════════════════════ */
function pushMsg(threadId, msg) {
  const t = state.threads[threadId];
  t.msgs.push(Object.assign({ id: 'm' + (++uid), ts: NOW(), live: true }, msg));
  t.msgs.sort((a, b) => a.ts - b.ts);   // catch-up messages land back inside the gap
  if (threadId === state.open) renderMessages(); else if (!msg.mine) t.unread++;
  renderList();
}

function sendComposed(e) {
  e?.preventDefault();
  const inp = $('#input');
  const text = inp.value.trim();
  if (!text && !state.pending.length) return;

  if (state.pending.length) {
    state.pending.forEach((p, i) => {
      pushMsg(state.open, {
        from: ME, mine: true, img: p.url,
        ph: (i === state.pending.length - 1 && text) ? text : (p.name || null),
        text: null,
      });
    });
    state.pending = [];
    renderTray();
    if (text) { inp.value = ''; autoGrow(); if ($('#wvAuto').checked) generate('reply'); return; }
  } else {
    pushMsg(state.open, { from: ME, mine: true, text });
  }

  inp.value = ''; autoGrow();
  if ($('#wvAuto').checked && state.backend) generate('reply');
}

function autoGrow() {
  const i = $('#input');
  i.style.height = 'auto';
  i.style.height = Math.min(i.scrollHeight, 132) + 'px';
  $('#send').disabled = !i.value.trim() && !state.pending.length;
}

function renderTray() {
  const tray = $('#tray');
  tray.innerHTML = '';
  tray.hidden = !state.pending.length;
  state.pending.forEach((p, i) => {
    const f = document.createElement('figure');
    const img = document.createElement('img'); img.src = p.url; img.alt = p.name;
    const x = document.createElement('button'); x.textContent = '×';
    x.onclick = () => { state.pending.splice(i, 1); renderTray(); autoGrow(); };
    f.append(img, x); tray.appendChild(f);
  });
  autoGrow();
}

function takeImages(files) {
  [...files].filter(f => f.type.startsWith('image/')).slice(0, 6).forEach(f => {
    const r = new FileReader();
    r.onload = () => { state.pending.push({ url: r.result, name: f.name }); renderTray(); };
    r.readAsDataURL(f);
  });
}

/* ══ letting time pass ═══════════════════════════════════ */
function saveSkew() {
  try { localStorage.setItem(SKEW_KEY, String(state.skew)); } catch { /* private mode */ }
}

// how far NOW() must jump for a named preset
function skipAmount(kind) {
  if (kind === 'morning') {
    const d = new Date(NOW());
    d.setHours(8, 0, 0, 0);
    if (d.getTime() <= NOW()) d.setDate(d.getDate() + 1);
    return d.getTime() - NOW();
  }
  const m = /^(\d+)([hd])$/.exec(kind);
  if (!m) return 0;
  return +m[1] * (m[2] === 'd' ? DAY : HOUR);
}

function skipTime(ms) {
  if (ms <= 0) return;
  const from = NOW();
  state.skew += ms;
  saveSkew();
  log(`time passes — ${spanWords(ms)} · now ${new Date(NOW()).toLocaleString(undefined,
      { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`);
  afterTimeChange();
  return from;
}

function resetTime() {
  if (!state.skew) return;
  state.skew = 0;
  saveSkew();
  log('terminal clock back on real time');
  afterTimeChange();
}

function afterTimeChange() {
  tickClock();
  paintTimePop();
  renderList();
  if (state.open) renderMessages();
  updateGapbar();
}

function paintTimePop() {
  $('#tpNow').textContent = new Date(NOW()).toLocaleString(undefined,
    { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const shifted = state.skew > 0;
  $('#tpSkew').textContent = shifted ? `${spanWords(state.skew)} ahead` : 'real time';
  $('#tpReset').disabled = !shifted;
  $('#sbClock').classList.toggle('is-shifted', shifted);
}

function toggleTimePop(on) {
  const pop = $('#timePop');
  const show = on ?? pop.hidden;
  pop.hidden = !show;
  if (show) paintTimePop();
}

/* The banner above the composer whenever the open thread has gone quiet. */
function threadGap(id) {
  const t = state.threads[id];
  const last = t?.msgs[t.msgs.length - 1];
  return last ? NOW() - last.ts : 0;
}

function updateGapbar() {
  const bar = $('#gapbar');
  if (!state.open) { bar.hidden = true; return; }
  const gap = threadGap(state.open);
  const show = gap > 3 * HOUR;
  bar.hidden = !show;
  if (!show) return;
  $('#gapTxt').textContent = state.backend
    ? `${spanWords(gap)} since anyone spoke here.`
    : `${spanWords(gap)} since anyone spoke here — the weave is offline.`;
  $('#gapGo').disabled = !state.backend || state.busy;
}

/* ══ signal weave ════════════════════════════════════════ */
function log(msg, cls = '') {
  const el = $('#wvLog');
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = `${clock(NOW())}  ${msg}`;
  el.appendChild(line);
  while (el.childElementCount > 60) el.firstChild.remove();
  el.scrollTop = el.scrollHeight;
}

function populateModels() {
  const p = state.weaveCfg.provider;
  const cfg = PROVIDERS[p];
  const saved = (state.weaveCfg[p] || {}).model;
  const sel = $('#wvModel');
  sel.innerHTML = '';
  cfg.models.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id; o.textContent = m.label; o.dataset.note = m.note || '';
    if (m.id === (saved || cfg.default)) o.selected = true;
    sel.appendChild(o);
  });
  showNote();
}

async function refreshWeaveStatus() {
  populateModels();

  if (!hasCredentials()) {
    state.backend = null;
    $('#wvDot').className = 'dot bad';
    $('#wvBackend').textContent = 'offline — set up a provider';
    gate();
    return;
  }

  $('#wvDot').className = 'dot busy';
  $('#wvBackend').textContent = 'checking…';
  try {
    const r = await fetch('api/health', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: state.weaveCfg.provider, credentials: currentCredentials() }),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) throw new Error(j.error || 'no backend');
    state.backend = PROVIDERS[state.weaveCfg.provider].label;
    $('#wvDot').className = 'dot ok';
    $('#wvBackend').textContent = state.backend;
    log('weave ready · ' + state.backend, 'ok');
  } catch (err) {
    state.backend = null;
    $('#wvDot').className = 'dot bad';
    $('#wvBackend').textContent = 'offline — stock chatter only';
    log('offline: ' + err.message, 'er');
  }
  gate();
}

function showNote() {
  const o = $('#wvModel').selectedOptions[0];
  $('#wvNote').textContent = o ? (o.dataset.note || '') : '';
}

function gate() {
  const off = !state.backend || state.busy;
  $('#wvReply').disabled = off;
  $('#wvAmbient').disabled = off;
  $('#wvAuto').disabled = !state.backend;
  updateGapbar();
}

// wall-clock description of the world, for the prompt
function nowStamp(ts = NOW()) {
  const d = new Date(ts);
  return {
    iso: d.toISOString(),
    label: d.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long',
                                       hour: '2-digit', minute: '2-digit' }),
  };
}

function threadPayload() {
  const t = state.threads[state.open];
  const meta = t.meta;
  const ids = meta.kind === 'group' ? meta.members : [meta.with];
  return {
    id: meta.id,
    kind: meta.kind,
    title: threadTitle(meta),
    about: meta.about || '',
    participants: ids.map(id => {
      const p = person(id);
      return { id: p.id, name: p.n, nick: p.nick, bio: p.b || '' };
    }),
    history: t.msgs.slice(-34).map(m => ({
      from: m.mine ? 'mei' : (m.from || 'system'),
      when: nowStamp(m.ts).label,
      text: m.sys ? `[notice] ${m.sys}` : (m.text || (m.ph ? `[photo] ${m.ph}` : '[photo]')),
    })),
  };
}

async function generate(mode) {
  if (!state.open || state.busy || !state.backend) return;
  state.busy = true; gate();
  $('#wvDot').className = 'dot busy';

  const typing = $('#typing');
  typing.hidden = false;
  typing.querySelector('em').textContent =
    mode === 'document' ? 'reading'
    : mode === 'catchup' ? 'catching up'
    : (state.threads[state.open].meta.kind === 'group' ? 'the pack is typing' : 'typing');

  const threadId = state.open;
  const gap = threadGap(threadId);
  const model = $('#wvModel').value;
  const body = {
    mode, model,
    provider: state.weaveCfg.provider,
    credentials: currentCredentials(),
    steer: $('#wvSteer').value.trim(),
    thread: threadPayload(),
    document: mode === 'document' ? state.doc : null,
    now: nowStamp(),
    elapsed: mode === 'catchup'
      ? { ms: gap, words: spanWords(gap), since: nowStamp(NOW() - gap).label }
      : null,
  };

  log(`${mode} · ${$('#wvModel').selectedOptions[0].textContent} · ${body.thread.title}`);
  const t0 = Date.now();

  try {
    const r = await fetch('api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.statusText);

    const out = j.messages || [];
    if (!out.length) { log('nothing came back', 'er'); }
    else log(`${out.length} message${out.length > 1 ? 's' : ''} · ${j.ms}ms`, 'ok');

    if (mode === 'catchup' && out.length) {
      // These arrived while Mei was away, so they belong inside the gap rather than
      // at "now". Anchor the burst to the END of the gap — one conversation, a few
      // minutes long, finishing shortly before she picked the Terminal up — so the
      // thread reads current again afterwards instead of still looking abandoned.
      const msgs = state.threads[threadId].msgs;
      const floor = (msgs[msgs.length - 1]?.ts ?? NOW() - gap) + MIN;
      const steps = out.map(() => 20000 + rnd(160000));
      const finish = NOW() - (10 + rnd(110)) * MIN;
      let cursor = Math.max(floor, finish - steps.reduce((a, b) => a + b, 0));
      out.forEach((m, i) => {
        cursor = Math.min(cursor + steps[i], NOW() - MIN);
        pushMsg(threadId, { from: m.from, mine: false, text: m.text, ts: Math.round(cursor) });
      });
      updateGapbar();
    } else {
      for (const m of out) {
        await wait(340 + Math.min(1500, (m.text || '').length * 22));
        pushMsg(threadId, { from: m.from, mine: false, text: m.text });
      }
    }
  } catch (err) {
    log('failed: ' + err.message, 'er');
  } finally {
    typing.hidden = true;
    state.busy = false;
    $('#wvDot').className = state.backend ? 'dot ok' : 'dot bad';
    gate();
    log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}

const wait = ms => new Promise(r => setTimeout(r, ms));

function loadDoc(file) {
  const r = new FileReader();
  r.onload = () => {
    state.doc = { name: file.name, text: String(r.result).slice(0, 60000) };
    const info = $('#wvFileInfo');
    info.hidden = false;
    info.innerHTML = '';
    const b = document.createElement('b'); b.textContent = file.name;
    const s = document.createElement('span'); s.textContent = `${(state.doc.text.length / 1000).toFixed(1)}k chars`;
    info.append(b, s);
    log(`loaded ${file.name}`);
    if (state.backend) generate('document');
    else log('no backend — the file is staged for when one appears', 'er');
  };
  r.readAsText(file);
}

/* ══ wiring ══════════════════════════════════════════════ */
function tickClock() {
  const d = new Date(NOW());
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  $('#sbClock').textContent = hm;
  $('#homeTime').textContent = hm;
  $('#homeDate').textContent = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  $('#sbClock').classList.toggle('is-shifted', state.skew > 0);
}

function showHome() {
  $('#home').hidden = false;
  $('#app').hidden = true;
  $('#app').classList.remove('thread-open');
}
function showApp() {
  $('#home').hidden = true;
  $('#app').hidden = false;
  if (!state.open) {
    const first = THREADS.find(t => (state.threads[t.id]?.msgs || []).length);
    if (first) openThread(first.id);
  }
}

function toggleWeave(on) {
  state.weave = on ?? !state.weave;
  $('#paneWeave').hidden = !state.weave;
  $('#app').classList.toggle('weave-open', state.weave);
  $('#openWeave').classList.toggle('is-on', state.weave);
  if (!state.weave) toggleWeaveCfg(false);
}

/* ── provider settings popover ────────────────────────────── */
function showProviderFields(p) {
  $('#wcFieldsAnthropic').hidden = p !== 'anthropic';
  $('#wcFieldsOpenai').hidden = p !== 'openai';
  $('#wcFieldsGoogle').hidden = p !== 'google';
}

function paintWeaveCfg() {
  const p = state.weaveCfg.provider;
  $('#wcProvider').value = p;
  showProviderFields(p);
  const c = state.weaveCfg[p] || {};
  if (p === 'anthropic') $('#wcAnthropicKey').value = c.apiKey || '';
  if (p === 'openai') $('#wcOpenaiKey').value = c.apiKey || '';
  if (p === 'google') {
    $('#wcGoogleProject').value = c.projectId || '';
    $('#wcGoogleLocation').value = c.location || '';
    $('#wcGoogleSA').value = c.serviceAccountJson || '';
  }
}

function toggleWeaveCfg(on) {
  const pop = $('#weaveCfgPop');
  const show = on ?? pop.hidden;
  pop.hidden = !show;
  $('#openWeaveCfg').classList.toggle('is-on', show);
  if (show) paintWeaveCfg();
}

function retune() {
  buildHistories();
  state.open = null;
  renderList();
  const first = THREADS.find(t => (state.threads[t.id]?.msgs || []).length);
  if (first) openThread(first.id);
  log('retuned — fresh week drawn');
}

function boot() {
  paintTide();
  tickClock();
  setInterval(tickClock, 20000);

  buildHistories();
  renderList();

  $('#openWavesLine').onclick = showApp;
  $('#toHome').onclick = showHome;
  $('#toList').onclick = () => $('#app').classList.remove('thread-open');
  $('#reshuffle').onclick = retune;
  $('#search').oninput = renderList;

  // letting time pass
  $('#sbClock').onclick = e => { e.stopPropagation(); toggleTimePop(); };
  $$('#timePop .tp-grid button').forEach(b => {
    b.onclick = () => { skipTime(skipAmount(b.dataset.skip)); toggleTimePop(false); };
  });
  $('#tpGo').onclick = () => {
    const n = Math.max(1, Math.min(999, +$('#tpAmt').value || 1));
    skipTime(n * ($('#tpUnit').value === 'd' ? DAY : HOUR));
    toggleTimePop(false);
  };
  $('#tpReset').onclick = () => { resetTime(); toggleTimePop(false); };
  $('#timePop').onclick = e => e.stopPropagation();
  document.addEventListener('click', () => toggleTimePop(false));
  $('#gapGo').onclick = () => generate('catchup');

  $('#openWeave').onclick = () => toggleWeave();
  $('#closeWeave').onclick = () => toggleWeave(false);
  $('#wvModel').onchange = () => {
    showNote();
    const p = state.weaveCfg.provider;
    if (state.weaveCfg[p]) { state.weaveCfg[p].model = $('#wvModel').value; saveWeaveCfg(); }
  };
  $('#wvReply').onclick   = () => generate('reply');
  $('#wvAmbient').onclick = () => generate('ambient');

  // provider settings
  $('#openWeaveCfg').onclick = e => { e.stopPropagation(); toggleWeaveCfg(); };
  $('#weaveCfgPop').onclick = e => e.stopPropagation();
  document.addEventListener('click', () => toggleWeaveCfg(false));
  $('#wcProvider').onchange = () => showProviderFields($('#wcProvider').value);
  $('#wcSave').onclick = () => {
    const p = $('#wcProvider').value;
    if (p === 'anthropic') state.weaveCfg.anthropic.apiKey = $('#wcAnthropicKey').value.trim();
    else if (p === 'openai') state.weaveCfg.openai.apiKey = $('#wcOpenaiKey').value.trim();
    else if (p === 'google') {
      state.weaveCfg.google.projectId = $('#wcGoogleProject').value.trim();
      state.weaveCfg.google.location = $('#wcGoogleLocation').value.trim();
      state.weaveCfg.google.serviceAccountJson = $('#wcGoogleSA').value.trim();
    }
    state.weaveCfg.provider = p;
    saveWeaveCfg();
    toggleWeaveCfg(false);
    refreshWeaveStatus();
  };

  $('#composer').addEventListener('submit', sendComposed);
  const inp = $('#input');
  inp.addEventListener('input', autoGrow);
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComposed(); }
  });
  $('#pickImg').addEventListener('change', e => { takeImages(e.target.files); e.target.value = ''; });

  // paste / drop images straight into the thread
  inp.addEventListener('paste', e => {
    const imgs = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
    if (imgs.length) { e.preventDefault(); takeImages(imgs); }
  });
  $('#paneThread').addEventListener('dragover', e => e.preventDefault());
  $('#paneThread').addEventListener('drop', e => { e.preventDefault(); takeImages(e.dataTransfer.files); });

  // situation file
  const dz = $('#wvDrop');
  dz.onclick = () => $('#wvFile').click();
  $('#wvFile').addEventListener('change', e => { if (e.target.files[0]) loadDoc(e.target.files[0]); e.target.value = ''; });
  ['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) loadDoc(f); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('#weaveCfgPop').hidden) toggleWeaveCfg(false);
    else if (!$('#timePop').hidden) toggleTimePop(false);
    else if (state.weave) toggleWeave(false);
    else if (!$('#app').hidden) showHome();
  });

  autoGrow();
  paintTimePop();
  refreshWeaveStatus();

  // deep links: #wavesline drops into the app, #weave and #time also open a panel
  const h = location.hash;
  if (h === '#wavesline' || h === '#in' || h === '#weave' || h === '#time') showApp();
  if (h === '#weave') toggleWeave(true);
  if (h === '#time') setTimeout(() => toggleTimePop(true), 0);
}

document.addEventListener('DOMContentLoaded', boot);
