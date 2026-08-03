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
    b:'The Rover. Golden eyes, regenerates from death, jumps first and calculates later. Warm and deflecting — turns her own bad news into a joke and asks after everyone else. Cardamom coffee order she keeps forgetting to collect. Makes terrible hot chocolate and knows it. Calls Iuno "Iuiu". Amy is her daughter. Types fast, lowercase drift, lots of "haha" and "wait" and stray typos she fixes with a second message.' },

  { id:'iuno', n:'Iuno', nick:'Super Mega Priestess Iuno Lady', av:'iuno', hue:222,
    b:'Former High Priestess of Septimont, thirty years of walls, now Mei\'s. Dry, exact, faintly withering. Answers questions with smaller sharper questions. Says "I\'m selfish" instead of explaining herself. Earl Grey. Right arm is crystal below the elbow; she has prosthetic calibration appointments she reschedules. Punctuates properly, never uses emoji, and a two-word reply from her carries more weight than a paragraph. Refuses to change the contact name Mei gave her.' },

  { id:'lupa', n:'Lupa', nick:'Lupa 🐺', av:'lupa', hue:6,
    b:'Wolfgirl gladiator of Septimont, ears and tail, pack law absolute. Terse to the point of rudeness, never softens anything, and shows love by feeding people and tying knots. Leaves soup outside doors. Ties perfect bowlines. Answers in three words. Trash-talks the arena feeds. Says "ask me in a year" when she means yes.' },

  { id:'cartethyia', n:'Cartethyia', nick:'Carte (Knight of the Eternal Debt)', av:'cartethyia', hue:200,
    b:'The Maiden who came back. Twenty years sealed in a tower, so everything ordinary delights her and she breaks roughly one bowl a week. Loud, exclamation marks, sends six messages where one would do. Sleeps on the top bunk she never uses. Honey cakes. Sword still goes everywhere with her. Calls Mei "captain".' },

  { id:'ciaccona', n:'Ciaccona', nick:'Cia', av:'ciaccona', hue:176,
    b:'Wandering bard, teal, drawls even in text. Lute strings, bad venues, hecklers, bootlegs of her own sets. The three notes are hers. Dry and needling, extremely funny, will not be hurried. Types in lowercase with commas and long trailing ellipses. Currently half on tour, half at school, complaining about both.' },

  { id:'chisa', n:'Chisa', nick:'Chisa', av:'chisa', hue:12,
    b:'From Honami, the city that fell out of time. Twenty years behind everyone, red string on her wrist that was Sumika\'s, scissors that once cut a tower into six hells. Quiet, precise, polite in a slightly formal register. Asks small careful questions. Deadpan jokes land two messages late. Cuts hair for the whole dorm now.' },

  { id:'lynae', n:'Lynae', nick:'Lynae', av:null, hue:48,
    b:'Lee Naeun. Ex-New Federation child mercenary who forged her way into the college and then earned the letter for real. Blunt, funny, spray-paint on her knuckles, convenience-store onigiri at 2am. Casing exits by habit. Frames things she is proud of. Says the rude thing first and means the warm thing under it.' },

  { id:'amy', n:'Amy', nick:'Amy 🌟', av:'amy', hue:340,
    b:'Aemeath. Mei\'s daughter, thirteen years a ghost in a reactor, now real and warm and permanently hungry. Was the midnight radio legend "Fleet Snowfluff". Calls Mei "Ma" and is deeply annoyed by being fussed over while asking to be fussed over. Sharp exactly the way Mei is sharp — already three exchanges ahead. Marshmallows, the expensive kind. Re-learning what things cost.' },

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
    b:'Shrine maiden of Honami, a hundred years of collecting other people\'s endings, frost in her wake. Formal, unhurried, asks "what is your wish" and means it literally. Building a shrine on campus now. Her warmth arrives sideways and always lands.' },

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
