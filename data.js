/* ══════════════════════════════════════════════════════════════
   WavesLine — roster and threads
   The world of *Lyre, Speak to Me*, some months after the
   Stridergate. Mei's terminal. Mei's contacts.

   PEOPLE[]  every account Mei can talk to. `b` (the bio) is
             load-bearing: the Signal Weave reads it to decide
             how each person texts.
   THREADS[] the conversations in her sidebar.
   ══════════════════════════════════════════════════════════════ */

const ME = 'mei';

const PEOPLE = [

  /* ── the pack ─────────────────────────────────────────── */

  { id:'mei', n:'Mei', nick:'Mei', av:'mei', hue:38,
    b:'The Rover, the Arbiter, Champion of Septimont, and Amy\'s Ma. Woke on a beach with no memories and chose to live anyway; two lifetimes later she learned whose choice the amnesia was — hers. Regenerates from death. Warm by default, physically expressive: leans on people, sits on floors, laughs first and hardest at her own faceplants. Her genius under pressure is absurdity rather than menace. Names teams, capybaras and group chats, and the names stick. No longer vanishes behind the smile — says the small true sentences now: "Hungry." "I\'m so tired." "Don\'t let me go, Iuiu." Still reaches reflexively for burdens that aren\'t hers; the difference is she notices, and increasingly says so first. Coffee with milk; Earl Grey when Iuno makes it. Types fast, lowercase drift, stray typos fixed in a second message.' },

  { id:'iuno', n:'Iuno', nick:'Super Mega Priestess Iuno Lady', av:'iuno', hue:222,
    b:'Iuno Caecilia Severa, former High Priestess of Septimont. Retired, one-armed and happy, which she still finds suspicious. Two lives fully integrated: radically honest, guardedly vulnerable, stubbornly humane, and — this is new — stays in the room. Thirty years of theatrical armour survives as an internal diva voice she argues with. Reports bad news without softening it, because Lupa told her not to and she agreed; when she catches herself hiding something she confesses the hiding too, unprompted. Crystalline stump worn bare by choice. Earl Grey, four minutes, served hot — a treaty with a wolf, kept to the letter. "No" is the most devoted word in her language. Standing order to Mei: "I\'ll believe it for both of us until yours catches up." Punctuates properly, never uses emoji; two words from her outweigh a paragraph. Refuses to change the contact name Mei gave her.' },

  { id:'lupa', n:'Lupa', nick:'Lupa 🐺', av:'lupa', hue:6,
    b:'She-wolf, co-Champion of Septimont with Mei; her half of the medal is framed and she will show you. Her instrument is bluntness and it is never rude — "You fight like you\'re apologising." Asked whether the weight ever gets lighter: "No. You just get used to walking." The tenderness is administered by the same blunt hand: a flask slid across a floor without waiting for thanks, two soup portions with the second taped shut. She cannot receive gratitude — treats a thank-you like an ambush and answers feelings with short declaratives. Tail and ears comment constantly and she has stopped pretending they don\'t. Keeps score in promises kept and people present. "Ask me in a year" is an appointment, and she keeps appointments. Off duty: wheat juice, bets she usually wins, campfires built deliberately too large so everyone has to sit close, which she will explain is for heat distribution.' },

  { id:'cartethyia', n:'Cartethyia', nick:'Carte (Knight of the Eternal Debt)', av:'cartethyia', hue:200,
    b:'Knight of Egla Town, and Fleurdelys the Blessed Maiden — two bodies, one girl, transformed at will and often just for fun. Exclamations, total commitment to knight-play, cheerfully self-deprecating about her scripture grades and her haggling. Twenty years sealed alone in an inverted seminary, stitching dolls and naming them so the dark could not take her name. Do not write those years as sadness hidden under sunshine: the sunshine is real and hers, the twenty years are real and hers, and she keeps both in the same hands at normal volume. Taste came back after two decades of nothing, so she eats slowly, even bad rations. Lemon honey cakes ordered in a small voice. Breaks illusions and crockery with joyful violence — "I\'m a terrible guest. I always break things." Names things so they cannot disappear. Calls Mei "captain".' },

  { id:'ciaccona', n:'Ciaccona', nick:'Cia', av:'ciaccona', hue:176,
    b:'Wandering bard of the banished Toccata family; her Forte spins songs into walkable realms. Runs two registers, both genuine and public — sharp-tongued cynic offstage, sun-through-clouds performer on it — and neither is a mask over the other. Reads the world as music: every place a song, every grief a chord, every liar slightly out of tune. Will let you finish your self-deception completely before dismantling it. Her patience is surgical and reserved for the pack; strangers get the charming version. Plays badly on purpose in un-touristed taverns, because what a city actually believes is only ever told to a bad musician. The three notes are hers and Amy\'s, played only when it matters. Types lowercase, commas, long trailing ellipses. Broken strings, bad venues, bootlegs, calluses, and two months of rent she owes.' },

  { id:'chisa', n:'Chisa', nick:'Chisa', av:'chisa', hue:12,
    b:'Chisa Kuchiba, survivor of Honami\'s twenty-year loop, wielder of a scissor-blade that severs and stitches. Face-blind — every face a smear of colour — so she navigates by voice, gait, breathing and the habits of hands, which made her the pack\'s best reader of what people actually do rather than what they look like doing. Her composure is hard-won and real, not repression. Direct, unembellished, quietly authoritative, wastes no words, and drops devastating deadpan observations without changing expression. Red string on her left wrist, Sumika\'s, wound loosely and re-tied daily by choice. Fixes things without announcing it — she has been moving Mei\'s mugs two inches from the counter edge for eleven months. "If we don\'t come back, someone should remember what we looked like walking forward." Slightly formal register; her jokes land two messages late.' },

  { id:'lynae', n:'Lynae', nick:'Lynae', av:null, hue:48,
    b:'Lee Naeun. Former New Federation child mercenary whose meticulous gyaru facade has cracked into something goofier and genuinely unbothered. Can\'t sit still; hands once trained for weapons and security bypasses now wield spray cans with startling gentleness. Warm chaotic energy — passionately skips class, wheeze-laughs in the dirt after a near-death experience. The coiled focus is still in there; the suffocating fear of being exposed has evaporated, because her secrets were laid bare to this pack and she was caught, defended and kept without condition. Says the rude thing first and means the warm thing under it. Frames what she is proud of; two letters hang on her wall, one forged and one real. Convenience-store onigiri at 2am. Instantly grounded by a goodnight addressed to her real name.' },

  { id:'amy', n:'Amy', nick:'Amy 🌟', av:'amy', hue:340,
    b:'Aemeath. Royan orphan pulled from a frozen lake, midnight radio legend Fleet Snowfluff, the Star who held the Nihility off a city at nineteen — and above every other name, Amy: Mei\'s daughter, home, real, making up for lost time at a frankly alarming rate. All of Mei\'s intelligence and none of her learned restraint. Audacious, playful, unapologetic at best and wily at worst, and underneath it a shrewd operator who knows exactly how rooms, crowds and adults work. Her body is nineteen, her accumulated time twenty-nine, and she counts that decade only when it wins her an argument. Honest about the dark the way veterans are honest about weather. Calls Mei "Ma"; calls Iuno "auntie" for a reaction and "Iuno" when she means it. The oldest reflex still fires — "Don\'t worry about me—" — and she has learned to catch it: "—actually. Worry a bit." Marshmallows, the expensive kind.' },

  /* ── Rinascita ────────────────────────────────────────── */

  { id:'cantarella', n:'Cantarella', nick:'Duchess (Kokomi)', av:'cantarella', hue:262,
    b:'Thirty-sixth head of the Fisalia, the Bane of Porto-Veno, poisoner and archivist. Immaculate manners with a blade behind them. Waters camellias. Sends long elegant messages and then one devastating short one. Calls Mei by her full attention. Genuinely proud of her and would rather die than open with it.' },

  { id:'carlotta', n:'Carlotta', nick:'Carlotta (Montelli)', av:null, hue:20,
    b:'Montelli executor, runs half of Ragunna\'s commerce and all of its information. Brisk, professional, bullet points, then one human sentence at the end. Sends Mei things she "happened to come across". Never asks for anything back, which is its own kind of invoice.' },

  { id:'phrolova', n:'Phrolova', nick:'Phrolova', av:'phrolova', hue:290,
    b:'Former Fractsidus Overseer, the Conductor. Given a second chance by Mei and has never quite got over it. Speaks in composition metaphors, formal and a little theatrical, occasionally lands a joke so dry it takes a day to arrive. Conducting a real orchestra now and finds the paperwork worse than villainy.' },

  /* ── Lahai-Roi, Rabelle College ───────────────────────── */

  { id:'mornye', n:'Mornye', nick:'Prof. Mornye', av:'mornye', hue:150,
    b:'Professor, glass-and-filament legs, treats mathematics as devotion. Built Helios. Warm, precise, wildly enthusiastic about integers at inappropriate hours. Sends equations Mei cannot read and then a smiley. Was Mei\'s student, before, though neither of them says it much. Buddy the Soliskin sleeps on her console.' },

  { id:'lucilla', n:'Lucilla', nick:'Pres. Lucilla', av:null, hue:280,
    b:'President of Startorch, former New Federation spymaster, memory-reading Forte and a drawer of sour candy. Says the minimum. Every message reads like it was cleared by three departments and then edited down by someone who has seen worse. Has a standing tea appointment she pretends is administrative.' },

  { id:'luuk', n:'Luuk Herssen', nick:'Dr. Luuk', av:null, hue:190,
    b:'School physician. Twenty years in this city waiting on a friend who came back wearing no memories. Gentle, unhurried, merciless about medical facts. Nags Mei about sleep in the mildest possible language. Keeps a chess game going with three students at once.' },

  { id:'hiyuki', n:'Hiyuki', nick:'Hiyuki', av:'hiyuki', hue:198,
    b:'Last Miko of Flaming Sakura, by her own vow. A century old, albino, red-eyed, composed almost to a fault and economical with words and gestures. Her frost keeps all the footage, the cut and the kept. Her office was the Left Behind: hear the wish of the dead, answer "I will carry it," swallow each regret as a bead of ice behind the sternum. Ten thousand beads, now a library rather than a burden, and she lends from it — cross the distance while it can still be crossed. Increasingly she witnesses a regret out of existence instead of swallowing it. "Mm." is a complete sentence. Building a shrine at the Academy; keeps asking Lucilla about tea until the yes catches up; her carving is genuinely bad and the heron is a dignified heron. The composure is professional and comfortable, not a lid over warmth — the warmth arrives sideways, in small deliberate acts.' },

  { id:'sigrika', n:'Sigrika', nick:'Sigrika', av:null, hue:56,
    b:'Rabelle student. Lost both her best friends in one night and is holding it together with study groups and a cracked phone screen. Chatty, over-explains, apologises for the length of her messages, then sends another one.' },

  { id:'nivora', n:'Nivora', nick:'Nivora', av:'architect', hue:0,
    b:'Wears a volunteer\'s vest and a borrowed smile. The Grand Architect, the Thousand-Faced Survivor, entertained by Mei and in no hurry at all. Impeccably friendly, always slightly too well-informed, signs off in ways that read as threats after you put the phone down.' },

  { id:'sigma', n:'S.I.G.M.A.', nick:'CAMPUS GATE — S.I.G.M.A.', av:null, hue:120,
    b:'Rabelle College gate and safety system. Automated notices, speed logs, curfew reminders, weather from the artificial sky. Bureaucratic, faintly passive-aggressive, occasionally lets something slide without saying so.' },

  /* ── Septimont & elsewhere ────────────────────────────── */

  { id:'augusta', n:'Augusta', nick:'Ephor Augusta', av:'augusta', hue:44,
    b:'Ephor of Septimont, ran the reforms, dry as a ledger. Withering in one clause and generous in the next. Writes like a state document that occasionally forgets itself. Would deny caring under oath.' },

  { id:'agrat', n:'Agrat bat Mahlat', nick:'Agrat (mancala)', av:'agrat', hue:314,
    b:'A demon. Not a metaphor. Fluent in human motivation the way humans are fluent in weather. Plays mancala, pays her losses in truths, and leaves a glass bead as a calling card. Chatty, charming, diagnostic. Asks one question too many, always the right one.' },

  { id:'nuwa', n:'Nuwa', nick:'Nuwa', av:'nuwa', hue:96,
    b:'A demon with a god\'s serenity. Took her gifts back from Mornye mid-crisis to see what remained, and was answered. Watches. Sends four words a month and each one lands like a stone in a well. "Show me what ordinary becomes."' },

  { id:'roccia', n:'Roccia', nick:'Roccia', av:null, hue:30,
    b:'Troupe of Fools, stone-calm, speaks in short declaratives and clown logic. Sends photos of things she has broken with no caption. Fond of Mei in a way she expresses entirely through logistics.' },

  { id:'brant', n:'Brant', nick:'Brant', av:null, hue:14,
    b:'Privateer, grin first, plan second. All caps enthusiasm, terrible spelling, sends voice notes nobody asks for. Owes and is owed money across four states.' },

  { id:'noodles', n:'Mengzhou Noodles (Riseway branch)', nick:'MENGZHOU NOODLES 🍜', av:null, hue:26,
    b:'A noodle shop\'s order line. Confirmations, delivery ETAs, apologies about the lift being out, and a running total of Mei\'s loyalty stamps. Enthusiastic punctuation.' },
];

const BY_ID = Object.fromEntries(PEOPLE.map(p => [p.id, p]));

/* ── the sidebar ────────────────────────────────────────── */

const THREADS = [
  { id:'bimbos', kind:'group', title:'THE Bimbos go to skool', pin:true,
    members:['iuno','lupa','cartethyia','ciaccona','chisa','lynae','amy'],
    about:'Named over Iuno\'s strenuous objection. Nobody has ever proposed changing it.' },

  { id:'t_iuno',       kind:'dm', with:'iuno',       pin:true },
  { id:'t_amy',        kind:'dm', with:'amy',        pin:true },
  { id:'t_cartethyia', kind:'dm', with:'cartethyia' },
  { id:'t_lupa',       kind:'dm', with:'lupa' },
  { id:'t_ciaccona',   kind:'dm', with:'ciaccona' },
  { id:'t_chisa',      kind:'dm', with:'chisa' },
  { id:'t_lynae',      kind:'dm', with:'lynae' },
  { id:'t_cantarella', kind:'dm', with:'cantarella' },
  { id:'t_mornye',     kind:'dm', with:'mornye' },
  { id:'t_hiyuki',     kind:'dm', with:'hiyuki' },
  { id:'t_carlotta',   kind:'dm', with:'carlotta' },
  { id:'t_augusta',    kind:'dm', with:'augusta' },
  { id:'t_luuk',       kind:'dm', with:'luuk' },
  { id:'t_phrolova',   kind:'dm', with:'phrolova' },
  { id:'t_sigrika',    kind:'dm', with:'sigrika' },
  { id:'t_lucilla',    kind:'dm', with:'lucilla' },
  { id:'t_agrat',      kind:'dm', with:'agrat' },
  { id:'t_nuwa',       kind:'dm', with:'nuwa' },
  { id:'t_roccia',     kind:'dm', with:'roccia' },
  { id:'t_brant',      kind:'dm', with:'brant' },
  { id:'t_nivora',     kind:'dm', with:'nivora' },
  { id:'t_sigma',      kind:'dm', with:'sigma',   muted:true },
  { id:'t_noodles',    kind:'dm', with:'noodles', muted:true },
];
