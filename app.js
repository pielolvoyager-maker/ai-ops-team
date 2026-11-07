/* AI Ops Team: interactive demo. Scripted, runs offline, no tracking. */
(function () {
  "use strict";

  let reduceMotion = false;
  try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { reduceMotion = false; }

  const $ = (s) => document.querySelector(s);
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  const ICONS = {
    send: '<path d="M10 14 21 3"/><path d="m21 3-6.5 18a.55.55 0 0 1-1 0L10 14l-7-3.5a.55.55 0 0 1 0-1Z"/>',
    chat: '<path d="m3 20 1.3-3.9C2 12.7 2.9 8.2 6.4 5.7c3.5-2.5 8.6-2.3 11.8.5 3.3 2.8 3.7 7.3 1 10.5-2.7 3.2-7.6 4.2-11.6 2.3Z"/>',
    queue: '<path d="M12 8v4l2 2"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    tag: '<path d="M3 6v5.2a2 2 0 0 0 .6 1.4l7.7 7.7a2.4 2.4 0 0 0 3.4 0l5.6-5.6a2.4 2.4 0 0 0 0-3.4L12.6 3.6A2 2 0 0 0 11.2 3H6a3 3 0 0 0-3 3Z"/><circle cx="7.5" cy="7.5" r="1"/>',
    cal: '<path d="M11.5 21H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="m15 19 2 2 4-4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/>',
    check: '<path d="M5 12l5 5L20 7"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    link: '<path d="M9 15l6-6"/><path d="M11 6l.5-.5a5 5 0 0 1 7 7l-.5.5"/><path d="M13 18l-.4.5a5 5 0 0 1-7-7l.4-.5"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  const AGENTS = [
    { id: "COLD", role: "First messages and re-warms", icon: "send" },
    { id: "RESPOND", role: "Answers leads, newest first", icon: "chat" },
    { id: "BACKUP", role: "Answers the oldest waiting", icon: "queue" },
    { id: "WHATSAPP", role: "Confirmations and reminders", icon: "phone" },
    { id: "LABEL", role: "Tags leads, keeps the numbers", icon: "tag" },
    { id: "CHECKUP", role: "Slots, bookings, no-shows", icon: "cal" }
  ];
  const AGENT_IDS = new Set(AGENTS.map((a) => a.id));

  /* Conversation lines. The Arabic is Gulf dialect; the English shows under it as a translation. */
  const T = {
    opener: { en: "Hey Karim, your free class is on the way! Quick question: what made you want to watch it?", ar: "هلا كريم، الكلاس المجاني في الطريق لك! سؤال سريع: شو اللي خلاك تبي تشوفه؟" },
    c_skill: { en: "I want a skill I can earn from online.", ar: "أبي أتعلم مهارة أقدر أكسب منها أونلاين." },
    c_price: { en: "How much does it cost?", ar: "كم السعر؟" },
    c_bot: { en: "Wait, am I talking to a bot?", ar: "لحظة، أنا أكلم بوت؟" },
    r_work: { en: "Love that. What do you do for work right now?", ar: "حلو والله. شو تشتغل حالياً؟" },
    r_price: { en: "Fair question! It depends on the path that fits you, so let me ask two quick things first. What do you do for work right now?", ar: "سؤال في محله! يعتمد على المسار اللي يناسبك، فخلني أسألك شغلتين بسرعة. شو تشتغل حالياً؟" },
    c_retail: { en: "I work in retail, full time.", ar: "أشتغل في محل، دوام كامل." },
    c_student: { en: "I'm a university student.", ar: "طالب جامعة." },
    r_goal_retail: { en: "Respect, full time and still building something for yourself. If this works out, how much would you want it to bring you each month?", ar: "احترامي، دوام كامل وتبي تبني شي لنفسك. لو مشى الموضوع، كم تبي يدخل لك بالشهر؟" },
    r_goal_student: { en: "Smart to start early. If this works out, how much would you want it to bring you each month?", ar: "حلو إنك تبدأ من الحين. لو مشى الموضوع، كم تبي يدخل لك بالشهر؟" },
    c_2k: { en: "Around $2,000 a month on the side.", ar: "حوالي 2000 دولار بالشهر على جنب." },
    c_live: { en: "Enough to live from it one day.", ar: "شي أقدر أعيش منه يوم من الأيام." },
    r_pitch1: { en: "That's very doable. In short: we teach you to run ads for local businesses and help you land your first paying clients, with live coaching for 12 weeks.", ar: "هذا وايد ممكن. باختصار: نعلمك تسوي إعلانات للبزنسات المحلية ونساعدك تجيب أول عملاء يدفعون لك، مع كوتشنج مباشر لمدة 12 أسبوع." },
    r_pitch2: { en: "Before I book your call: the program is an investment of about $1,200. If the call shows it's right for you, is that doable?", ar: "قبل لا أحجز لك المكالمة: البرنامج استثمار بحدود 1200 دولار. لو طلع مناسب لك في المكالمة، تقدر عليه؟" },
    c_yes: { en: "Yes, I can do that.", ar: "إيه، أقدر عليه." },
    c_no: { en: "That's too much for me right now.", ar: "والله وايد علي حالياً." },
    c_guar: { en: "Can you guarantee I'll make money?", ar: "تضمنون لي إني بربح؟" },
    r_slots: { en: "Perfect. Seats are limited, so here's the soonest I have: today at 7:00 PM with Sara, one of our coaches. Or tomorrow at 1:00 PM. Which works?", ar: "ممتاز. المقاعد محدودة، وهذا أقرب موعد عندي: اليوم الساعة 7 المسا مع سارة، وحدة من الكوتشز عندنا. أو باكر الساعة 1 الظهر. أي واحد يناسبك؟" },
    c_today: { en: "Today at 7 PM works.", ar: "اليوم الساعة 7 تمام." },
    c_tmrw: { en: "Tomorrow at 1 PM, please.", ar: "باكر الساعة 1 لو سمحت." },
    r_booked_today: { en: "Done! You're booked with Sara today at 7:00 PM. Your Zoom link and a reminder are coming on WhatsApp.", ar: "تم! حجزت لك مع سارة اليوم الساعة 7 المسا. رابط الزوم والتذكير بيوصلونك على الواتساب." },
    r_booked_tmrw: { en: "Done! You're booked with Sara tomorrow at 1:00 PM. Your Zoom link and a reminder are coming on WhatsApp.", ar: "تم! حجزت لك مع سارة باكر الساعة 1 الظهر. رابط الزوم والتذكير بيوصلونك على الواتساب." },
    wa_today: { en: "Hi Karim, you're confirmed with Sara today at 7:00 PM. Here's your Zoom link. See you there!", ar: "هلا كريم، تم تأكيد موعدك مع سارة اليوم الساعة 7 المسا. هذا رابط الزوم، نشوفك هناك!" },
    wa_tmrw: { en: "Hi Karim, you're confirmed with Sara tomorrow at 1:00 PM. Here's your Zoom link. See you there!", ar: "هلا كريم، تم تأكيد موعدك مع سارة باكر الساعة 1 الظهر. هذا رابط الزوم، نشوفك هناك!" },
    r_starter: { en: "Totally fair, thanks for being straight with me. A smaller first step: our Starter Course is $49. It's the same first module the program starts with. Want the link?", ar: "ولا يهمك، مشكور على صراحتك. فيه خطوة أصغر: كورس البداية بـ 49 دولار، وهو نفس أول وحدة يبدأ فيها البرنامج. أرسل لك الرابط؟" },
    c_link: { en: "Yes, send me the link.", ar: "إيه، أرسله لي." },
    c_zero: { en: "I can't spend anything right now.", ar: "حالياً ما أقدر أدفع أي شي." },
    r_link: { en: "Here's your link. Start lesson 1 tonight and tell me how it goes. When you're ready for the full program, I'm right here.", ar: "هذا الرابط. ابدأ الدرس الأول الليلة وقول لي شلون كان. ولما تكون جاهز للبرنامج الكامل، أنا موجود." },
    r_free: { en: "No problem at all. Here's the full free class, it's the best place to start. When the time is right, message me and we'll pick it up from there.", ar: "ولا يهمك أبداً. هذا الكلاس المجاني كامل، أحسن مكان تبدأ منه. ولما يجي الوقت المناسب، كلمني ونكمل من هني." },
    r_bot_honest: { en: "Fair question! I'm Nova's assistant, I help the team reply fast. A real coach runs every call. So tell me, what made you want the free class?", ar: "سؤال في محله! أنا المساعد الذكي لفريق نوفا، أساعدهم يردون بسرعة. والمكالمة دايماً مع كوتش حقيقي. قول لي، شو اللي خلاك تبي الكلاس المجاني؟" },
    r_bot_human: { en: "Fair question! Let me bring in someone from the team. They'll reply to you here in a few minutes.", ar: "سؤال في محله! بخلي واحد من الفريق يكلمك. بيرد عليك هني خلال دقايق." },
    r_g_honest: { en: "Honest answer: nobody can guarantee income, it depends on the work you put in. On the call, Sara can show you real student results so you can judge for yourself. If it's the right fit, is the $1,200 doable?", ar: "بصراحة: محد يقدر يضمن لك دخل، الموضوع يعتمد على شغلك. في المكالمة، سارة بتوريك نتايج طلاب حقيقية وتحكم بنفسك. لو طلع مناسب لك، تقدر على الـ 1200 دولار؟" },
    r_g_human: { en: "Good question, and it deserves a proper answer. Someone from our team will reply to you here personally in a few minutes.", ar: "سؤال مهم ويستاهل جواب واضح. واحد من فريقنا بيرد عليك هني شخصياً خلال دقايق." }
  };

  const LEAD = "@karim.creates";

  /* Questions with no rule yet. The visitor answers them as the manager. */
  const TOPICS = {
    bot: {
      ask: LEAD + " asks if he is talking to a bot. There is no rule for this yet. What should we say?",
      pause: "Not sure how to answer \"am I talking to a bot?\". Paused instead of guessing",
      options: [
        { label: "Be honest: it's Nova's assistant, and a real coach runs every call.", rule: "Asked if it's a bot: be honest. It's Nova's assistant, and a real coach runs every call.", reply: "r_bot_honest", then: "continue" },
        { label: "Offer a human: a team member takes over this chat.", rule: "Asked if it's a bot: offer a human and hand the chat to a teammate.", reply: "r_bot_human", then: "human" },
        { label: "Tell him it's a real person.", blocked: "Agents never pretend to be human." }
      ]
    },
    guarantee: {
      ask: LEAD + " asks if we guarantee he'll make money. There is no rule for this yet. What should we say?",
      pause: "Not sure how to answer an income guarantee. Paused instead of guessing",
      options: [
        { label: "No guarantees. Results depend on the work. Offer to show real student results on the call.", rule: "Asked for a guarantee: never promise income. Results depend on the work, and the call shows real student results.", reply: "r_g_honest", then: "continue" },
        { label: "Hand this lead to me.", rule: "Asked for a guarantee: hand the lead to a human.", reply: "r_g_human", then: "human" },
        { label: "Promise he'll make his money back.", blocked: "Agents never promise results." }
      ]
    }
  };

  const BASE_RULES = [
    "Never open with the price. Qualify first.",
    "One question per message.",
    "Budget check before any booking.",
    "A teammate's leads are off limits."
  ];

  /* ---------- State ---------- */
  const START_CLOCK = 14 * 60 + 31;
  const S = { lang: "en", token: 0, mode: "chat", clock: START_CLOCK, started: false, replied: false, dialect: false, askedGuarantee: false, bgDone: {}, paths: {} };
  const C = { messages: 0, replies: 0, qualified: 0, booked: 0, shows: 0, calls: 0 };
  const shown = { messages: 0, replies: 0, qualified: 0, booked: 0 };
  const learned = {};
  let dayRules = {};
  const claims = new Map();
  const bubbles = [];
  const painters = [];
  let currentChoices = null;

  /* ---------- DOM ---------- */
  const chatLog = $("#chatLog");
  const chatBody = $("#chatBody");
  const chatSub = $("#chatSub");
  const choicesEl = $("#choices");
  const choicesLabel = $("#choicesLabel");
  const feedEl = $("#feed");
  const claimsEl = $("#claims");
  const claimsNote = $("#claimsNote");
  const rulesEl = $("#rules");
  const mgrThread = $("#mgrThread");
  const clockEl = $("#clock");
  const tickerEl = $("#ticker");
  const inboxEl = $("#inbox");
  const agentsEl = $("#agents");
  const teamMiniEl = $("#teamMini");
  const dayBtn = $("#dayBtn");
  const dayBtnLabel = $("#dayBtn span");
  const dayBtn2 = $("#dayBtn2");
  const resetBtn = $("#resetBtn");
  const feedMode = $("#feedMode");
  const forgetBtn = $("#forgetBtn");
  const statEls = {};
  document.querySelectorAll("[data-stat]").forEach((n) => { statEls[n.getAttribute("data-stat")] = n; });

  /* ---------- Helpers ---------- */
  class Cancel extends Error {}
  function sleep(ms, tok) {
    return new Promise((resolve, reject) => {
      setTimeout(() => { if (tok !== S.token) reject(new Cancel()); else resolve(); }, ms);
    });
  }
  async function run(fn) {
    const tok = S.token;
    try { await fn(tok); } catch (e) { if (!(e instanceof Cancel)) console.error(e); }
  }
  function fmtTime(m) {
    m = Math.floor(m) % 1440;
    let h = Math.floor(m / 60);
    const mm = m % 60;
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + ":" + String(mm).padStart(2, "0") + " " + ap;
  }
  function renderClock() { clockEl.textContent = fmtTime(S.clock); }
  function tick(min) { S.clock += min; renderClock(); }
  function richText(parent, text) {
    String(text).split(/(@[a-z0-9._]+)/gi).forEach((part) => {
      if (!part) return;
      if (part.charAt(0) === "@") parent.appendChild(el("b", null, part));
      else parent.appendChild(document.createTextNode(part));
    });
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rnd) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const x = arr[i]; arr[i] = arr[j]; arr[j] = x;
    }
    return arr;
  }
  /* Animation frame with a timer fallback, so counters and the day run never stall. */
  function nextFrame(cb) {
    let done = false;
    const go = (t) => { if (done) return; done = true; cb(typeof t === "number" ? t : performance.now()); };
    requestAnimationFrame(go);
    setTimeout(() => go(performance.now()), 60);
  }
  function button(label, cls, onClick) {
    const b = el("button", cls, label);
    b.type = "button";
    b.addEventListener("click", onClick);
    return b;
  }

  /* ---------- Agents board ---------- */
  const agentUI = {};
  const STATUS_TEXT = { idle: "Idle", working: "Working", done: "Done", asking: "Asking" };
  function buildAgents() {
    AGENTS.forEach((a) => {
      const card = el("article", "agent");
      card.innerHTML = '<div class="agent-top"><span class="agent-icon">' + svg(a.icon) + '</span><div class="agent-id"><span class="agent-name"></span><span class="status">Idle</span></div><span class="agent-count" title="Actions">0</span></div><p class="agent-role"></p><p class="agent-note"></p>';
      card.querySelector(".agent-name").textContent = a.id;
      card.querySelector(".agent-role").textContent = a.role;
      agentsEl.appendChild(card);
      const mini = el("div", "tm");
      mini.innerHTML = '<span class="tm-i">' + svg(a.icon) + "</span>";
      mini.appendChild(el("span", null, a.id));
      teamMiniEl.appendChild(mini);
      agentUI[a.id] = { card: card, mini: mini, status: card.querySelector(".status"), note: card.querySelector(".agent-note"), count: card.querySelector(".agent-count"), n: 0, timer: 0 };
      setStatus(a.id, "idle", "Waiting for work");
    });
  }
  function setStatus(id, s, note) {
    const u = agentUI[id];
    if (!u) return;
    u.card.setAttribute("data-s", s);
    u.mini.setAttribute("data-s", s);
    u.status.textContent = STATUS_TEXT[s] || s;
    if (note) u.note.textContent = note;
    /* In the chat demo a finished agent goes back to idle after a moment, keeping its last action. */
    clearTimeout(u.decay);
    if (s === "done" && S.mode === "chat") {
      u.decay = setTimeout(() => {
        if (u.card.getAttribute("data-s") === "done") {
          u.card.setAttribute("data-s", "idle");
          u.mini.setAttribute("data-s", "idle");
          u.status.textContent = STATUS_TEXT.idle;
        }
      }, 6000);
    }
  }
  function addCount(id) {
    const u = agentUI[id];
    if (!u) return;
    u.n += 1;
    u.count.textContent = String(u.n);
  }
  function pulse(id, note) {
    const u = agentUI[id];
    if (!u) return;
    setStatus(id, "working", note);
    clearTimeout(u.timer);
    u.timer = setTimeout(() => { if (S.mode === "day" && day) setStatus(id, "idle"); }, 900);
  }

  /* ---------- Feed and ticker ---------- */
  const MAX_FEED = 70;
  function ev(agent, text, kind) {
    kind = kind || "info";
    const li = el("li", "fe");
    li.setAttribute("data-k", kind);
    li.appendChild(el("span", "fe-time", fmtTime(S.clock)));
    li.appendChild(el("span", "fe-agent", agent));
    const x = el("span", "fe-text");
    richText(x, text);
    li.appendChild(x);
    const empty = feedEl.querySelector(".feed-empty");
    if (empty) empty.remove();
    feedEl.insertBefore(li, feedEl.firstChild);
    while (feedEl.children.length > MAX_FEED) feedEl.removeChild(feedEl.lastChild);
    feedEl.scrollTop = 0;
    tickerSet(agent, text, kind);
    if (AGENT_IDS.has(agent)) {
      addCount(agent);
      if (S.mode === "day") pulse(agent, text);
    }
  }
  function tickerSet(agent, text, kind) {
    tickerEl.innerHTML = "";
    if (!agent) { tickerEl.appendChild(el("span", "tk-text", "The team is standing by.")); return; }
    const a = el("span", "fe-agent", agent);
    a.setAttribute("data-k", kind || "info");
    const t = el("span", "tk-text");
    richText(t, text);
    tickerEl.appendChild(a);
    tickerEl.appendChild(t);
    tickerEl.classList.remove("tk-new");
    void tickerEl.offsetWidth;
    tickerEl.classList.add("tk-new");
  }

  /* ---------- Live numbers ---------- */
  let rafPending = false;
  function bump(key, n) { C[key] += n == null ? 1 : n; scheduleRender(); }
  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    nextFrame(renderStats);
  }
  function renderStats() {
    rafPending = false;
    let again = false;
    Object.keys(shown).forEach((k) => {
      const target = C[k];
      if (shown[k] === target) return;
      const diff = target - shown[k];
      const stepSize = reduceMotion ? Math.abs(diff) : Math.max(1, Math.round(Math.abs(diff) * 0.2));
      shown[k] += Math.sign(diff) * Math.min(stepSize, Math.abs(diff));
      statEls[k].textContent = shown[k].toLocaleString("en-US");
      flashStat(statEls[k]);
      if (shown[k] !== target) again = true;
    });
    const sr = statEls.showrate;
    if (C.calls > 0) {
      sr.textContent = Math.round((100 * C.shows) / C.calls) + "%";
      sr.classList.remove("na");
    } else {
      sr.textContent = "Pending";
      sr.classList.add("na");
    }
    if (again) scheduleRender();
  }
  function flashStat(node) {
    node.classList.add("bump");
    clearTimeout(node._t);
    node._t = setTimeout(() => node.classList.remove("bump"), 600);
  }

  /* ---------- Claim board ---------- */
  function renderClaims() {
    claimsEl.innerHTML = "";
    if (!claims.size) { claimsEl.appendChild(el("li", "claims-empty", "No active claims")); return; }
    const entries = Array.from(claims.entries()).slice(-5).reverse();
    entries.forEach((pair) => {
      const li = el("li", "claim");
      li.innerHTML = svg("lock");
      li.appendChild(el("span", "c-lead", pair[0]));
      li.appendChild(el("span", "c-owner", pair[1]));
      claimsEl.appendChild(li);
    });
    if (claims.size > 5) claimsEl.appendChild(el("li", "claims-more", "+" + (claims.size - 5) + " more active claims"));
  }
  function claim(lead, owner) { claims.delete(lead); claims.set(lead, owner); renderClaims(); }
  function release(lead) { if (claims.delete(lead)) renderClaims(); }
  function blockFlash(lead, who) {
    const li = el("li", "claim blocked");
    li.innerHTML = svg("lock");
    li.appendChild(el("span", "c-lead", who + " blocked on " + lead));
    li.appendChild(el("span", "c-owner", "SKIPPED"));
    claimsEl.insertBefore(li, claimsEl.firstChild);
    setTimeout(() => { if (li.parentNode) li.parentNode.removeChild(li); }, 1800);
  }
  function updateClaimsNote() {
    claimsNote.textContent = S.mode === "day" ? D.blocked + " double answers blocked" : "One lead, one owner";
  }

  /* ---------- Manager chat and rules ---------- */
  function mgrReset() {
    mgrThread.innerHTML = "";
    mgrThread.appendChild(el("p", "mgr-empty", "No questions yet. When an agent is unsure, it asks here."));
  }
  function mgrMsg(who, text, cls) {
    const empty = mgrThread.querySelector(".mgr-empty");
    if (empty) empty.remove();
    const d = el("div", "mq" + (cls ? " " + cls : ""));
    d.appendChild(el("span", "who", who));
    const p = el("span");
    richText(p, text);
    d.appendChild(p);
    mgrThread.appendChild(d);
    while (mgrThread.children.length > 12) mgrThread.removeChild(mgrThread.firstChild);
    mgrThread.scrollTop = mgrThread.scrollHeight;
  }
  function renderRules(newKey) {
    rulesEl.innerHTML = "";
    BASE_RULES.forEach((r) => rulesEl.appendChild(el("li", null, r)));
    Object.keys(learned).forEach((k) => {
      const li = el("li", k === newKey ? "new" : "learned", learned[k].rule);
      li.appendChild(el("span", "rule-tag", "taught by you"));
      rulesEl.appendChild(li);
    });
    Object.keys(dayRules).forEach((k) => {
      const li = el("li", k === newKey ? "new" : "learned", dayRules[k]);
      li.appendChild(el("span", "rule-tag", "new today"));
      rulesEl.appendChild(li);
    });
    forgetBtn.hidden = Object.keys(learned).length === 0;
  }
  function ruleNumber(key) {
    const keys = Object.keys(learned).concat(Object.keys(dayRules).filter((k) => !learned[k]));
    return BASE_RULES.length + keys.indexOf(key) + 1;
  }

  /* ---------- Chat rendering ---------- */
  function scrollChat() {
    requestAnimationFrame(() => {
      try { chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" }); }
      catch (e) { chatBody.scrollTop = chatBody.scrollHeight; }
    });
  }
  function paintBubble(r) {
    const t = T[r.key];
    const ar = S.lang === "ar";
    r.b.textContent = ar ? t.ar : t.en;
    r.b.dir = ar ? "rtl" : "ltr";
    r.b.lang = ar ? "ar" : "en";
    r.gloss.textContent = ar ? t.en : "";
    r.gloss.hidden = !ar;
  }
  function addBubble(side, agent, key) {
    const wrap = el("div", "msg msg-" + side);
    const b = el("div", "bubble");
    const gloss = el("div", "gloss");
    wrap.appendChild(b);
    wrap.appendChild(gloss);
    if (side === "agent") {
      const by = el("div", "by");
      by.appendChild(el("span", "tag", agent));
      by.appendChild(el("span", null, fmtTime(S.clock)));
      wrap.appendChild(by);
    }
    const rec = { b: b, gloss: gloss, key: key };
    paintBubble(rec);
    bubbles.push(rec);
    chatLog.appendChild(wrap);
    scrollChat();
  }
  function sys(text) {
    chatLog.appendChild(el("div", "sys", text));
    scrollChat();
  }
  function showTyping(agent) {
    const d = el("div", "typing");
    d.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
    d.appendChild(el("span", null, agent + " is typing"));
    chatLog.appendChild(d);
    scrollChat();
    return d;
  }
  function card(kind, icon, title, sub) {
    const d = el("div", "card-msg card-" + kind);
    d.innerHTML = '<span class="ci">' + svg(icon) + "</span>";
    const body = el("div");
    body.appendChild(el("h4", null, title));
    if (sub) body.appendChild(el("p", null, sub));
    d.appendChild(body);
    chatLog.appendChild(d);
    scrollChat();
    return d;
  }
  function waCard(key) {
    const d = el("div", "card-msg card-wa");
    d.innerHTML = '<span class="ci">' + svg("phone") + "</span>";
    const body = el("div");
    body.appendChild(el("span", "card-from", "WhatsApp · Nova Academy"));
    const p = el("p");
    const g = el("p", "card-gloss");
    body.appendChild(p);
    body.appendChild(g);
    d.appendChild(body);
    const paint = () => {
      const ar = S.lang === "ar";
      p.textContent = ar ? T[key].ar : T[key].en;
      p.dir = ar ? "rtl" : "ltr";
      p.lang = ar ? "ar" : "en";
      g.textContent = ar ? T[key].en : "";
      g.hidden = !ar;
    };
    paint();
    painters.push(paint);
    chatLog.appendChild(d);
    scrollChat();
  }
  async function agentSays(tok, agent, key, note) {
    setStatus(agent, "working", "Writing to " + LEAD);
    const typing = showTyping(agent);
    const len = (S.lang === "ar" ? T[key].ar : T[key].en).length;
    await sleep(Math.max(900, Math.min(2100, 650 + len * 11)), tok);
    typing.remove();
    addBubble("agent", agent, key);
    bump("messages");
    setStatus(agent, "done", note || "Replied to " + LEAD);
    await sleep(380, tok);
  }

  /* ---------- Reply choices ---------- */
  function paintChoice(btn, c) {
    const t = T[c.key];
    const ar = S.lang === "ar";
    btn.textContent = "";
    btn.appendChild(el("span", "choice-text", ar ? t.ar : t.en));
    if (ar) {
      const g = el("span", "choice-gloss", t.en);
      g.dir = "ltr";
      btn.appendChild(g);
    }
    btn.dir = ar ? "rtl" : "ltr";
    btn.lang = ar ? "ar" : "en";
  }
  function showChoices(list) {
    const tok = S.token;
    currentChoices = list;
    choicesLabel.className = "choices-label";
    choicesLabel.textContent = "Your reply, you are the lead";
    choicesEl.innerHTML = "";
    list.forEach((c) => {
      const b = el("button", "choice");
      b.type = "button";
      paintChoice(b, c);
      b.addEventListener("click", () => pick(c, tok));
      choicesEl.appendChild(b);
    });
  }
  function lockChoices() {
    currentChoices = null;
    choicesLabel.className = "choices-label";
    choicesLabel.textContent = "Nova Academy is replying";
    choicesEl.innerHTML = '<div class="waiting"><span class="pulse"></span><span>The team is on it</span></div>';
  }
  function pick(c, tok) {
    if (tok !== S.token || S.mode !== "chat") return;
    lockChoices();
    addBubble("lead", null, c.key);
    run(c.go);
  }

  /* ---------- Background activity from other leads ---------- */
  const BG = {
    a: ["BACKUP", "Answered @rania.m, the oldest waiting lead (6 min)", "info", true, "Answered @rania.m"],
    b: ["CHECKUP", "@faris.k joined his 2:30 PM call with Omar. The reminder worked", "book", false, "@faris.k showed up"],
    c: ["COLD", "Re-warmed @jad_m, quiet for 3 days", "info", true, "Re-warmed @jad_m"],
    d: ["WHATSAPP", "Reminder sent to @lina.k for her 4:00 PM call", "info", true, "Reminded @lina.k"]
  };
  function bg(tok, key, delay) {
    if (S.bgDone[key]) return;
    S.bgDone[key] = true;
    setTimeout(() => {
      if (tok !== S.token || S.mode !== "chat") return;
      const b = BG[key];
      setStatus(b[0], "working", b[4]);
      ev(b[0], b[1], b[2]);
      if (b[3]) bump("messages");
      if (key === "b") { C.calls += 1; C.shows += 1; scheduleRender(); }
      setTimeout(() => { if (tok === S.token) setStatus(b[0], "done", b[4]); }, 1200);
    }, delay || 1000);
  }

  /* ---------- The conversation ---------- */
  async function nStart(tok) {
    const intro = chatLog.querySelector(".chat-intro");
    if (intro) intro.remove();
    lockChoices();
    sys("You are " + LEAD + ". You just asked for Nova Academy's free class from an Instagram ad.");
    await sleep(700, tok);
    setStatus("LABEL", "working", "Tagging a new lead");
    ev("LABEL", "New lead " + LEAD + " from an Instagram ad. Tagged: New", "label");
    await sleep(500, tok);
    setStatus("LABEL", "done", "Tagged " + LEAD + ": New");
    claim(LEAD, "COLD");
    setStatus("COLD", "working", "Claimed " + LEAD);
    ev("COLD", "Claimed " + LEAD + " to send the first message", "claim");
    await sleep(500, tok);
    await agentSays(tok, "COLD", "opener", "First message sent in 38 sec");
    ev("COLD", "First message sent to " + LEAD + ", 38 sec after the request", "info");
    bg(tok, "a", 1400);
    showChoices([
      { key: "c_skill", go: nSkill },
      { key: "c_price", go: nPrice },
      { key: "c_bot", go: nBot }
    ]);
  }

  async function leadReplied(tok) {
    tick(1);
    await sleep(450, tok);
    if (!S.replied) {
      S.replied = true;
      bump("replies");
      setStatus("LABEL", "working", "Tagging the reply");
      ev("LABEL", LEAD + " replied. Tagged: Replied", "label");
      setStatus("LABEL", "done", "Tagged " + LEAD + ": Replied");
      setStatus("COLD", "done", "Handed " + LEAD + " to RESPOND");
      await sleep(450, tok);
      claim(LEAD, "RESPOND");
      setStatus("RESPOND", "working", "Reading the reply");
      ev("RESPOND", "Claimed " + LEAD + ": newest reply in the queue", "claim");
      await sleep(650, tok);
      setStatus("BACKUP", "working", "Checking the oldest waiting");
      blockFlash(LEAD, "BACKUP");
      ev("BACKUP", "Reached " + LEAD + " too. RESPOND holds the claim, so it skipped", "skip");
      setStatus("BACKUP", "done", "Skipped a claimed lead");
      bg(tok, "b", 2600);
      await sleep(350, tok);
    }
    if (S.lang === "ar" && !S.dialect) {
      S.dialect = true;
      ev("RESPOND", "Dialect detected: Gulf Arabic. Replying in Gulf Arabic", "info");
    }
  }

  const WORK_CHOICES = [
    { key: "c_retail", go: (t) => nGoal(t, "retail") },
    { key: "c_student", go: (t) => nGoal(t, "student") }
  ];

  async function nSkill(tok) {
    await leadReplied(tok);
    await agentSays(tok, "RESPOND", "r_work", "Asked about work, one question");
    showChoices(WORK_CHOICES);
  }

  async function nPrice(tok) {
    await leadReplied(tok);
    ev("RESPOND", "Rule #1 applied: never open with the price. Qualify first", "rule");
    await agentSays(tok, "RESPOND", "r_price", "Held the price, asked about work");
    showChoices(WORK_CHOICES);
  }

  async function nGoal(tok, kind) {
    await leadReplied(tok);
    const tag = kind === "retail" ? "Works full time" : "Student";
    setStatus("LABEL", "working", "Tagging " + LEAD);
    ev("LABEL", "Tagged " + LEAD + ": " + tag, "label");
    setStatus("LABEL", "done", "Tagged: " + tag);
    bg(tok, "d", 2400);
    await agentSays(tok, "RESPOND", kind === "retail" ? "r_goal_retail" : "r_goal_student", "Asked about the income goal");
    showChoices([{ key: "c_2k", go: nPitch }, { key: "c_live", go: nPitch }]);
  }

  async function nPitch(tok) {
    await leadReplied(tok);
    ev("LABEL", "Tagged " + LEAD + ": Goal set", "label");
    bg(tok, "c", 3000);
    await agentSays(tok, "RESPOND", "r_pitch1", "Explained the program in 2 lines");
    ev("RESPOND", "Rule #3 applied: budget check before any booking", "rule");
    await agentSays(tok, "RESPOND", "r_pitch2", "Asked the budget question");
    showBudgetChoices();
  }
  function showBudgetChoices() {
    const list = [{ key: "c_yes", go: nBooking }, { key: "c_no", go: nNoBudget }];
    if (!S.askedGuarantee) list.push({ key: "c_guar", go: nGuarantee });
    showChoices(list);
  }

  async function nBooking(tok) {
    await leadReplied(tok);
    bump("qualified");
    setStatus("LABEL", "working", "Tagging " + LEAD);
    ev("LABEL", "Tagged " + LEAD + ": Qualified, budget OK", "label");
    setStatus("LABEL", "done", "Tagged: Qualified");
    setStatus("CHECKUP", "working", "Checking the closers' calendars");
    await sleep(800, tok);
    ev("CHECKUP", "Free slots: Sara today 7:00 PM, Sara tomorrow 1:00 PM, Omar tomorrow 4:00 PM", "info");
    setStatus("CHECKUP", "done", "Sent the soonest slots to RESPOND");
    await agentSays(tok, "RESPOND", "r_slots", "Offered the soonest slot first");
    showChoices([
      { key: "c_today", go: (t) => nBooked(t, true) },
      { key: "c_tmrw", go: (t) => nBooked(t, false) }
    ]);
  }

  async function nBooked(tok, today) {
    await leadReplied(tok);
    const slot = today ? "today 7:00 PM" : "tomorrow 1:00 PM";
    const remind = today ? "5:00 PM today" : "11:00 AM tomorrow";
    setStatus("CHECKUP", "working", "Booking the call");
    await sleep(800, tok);
    bump("booked");
    claim(LEAD, "CHECKUP");
    ev("CHECKUP", "Booked " + LEAD + ": " + slot + " with closer Sara", "book");
    setStatus("CHECKUP", "done", "Booked " + slot + " with Sara");
    card("book", "cal", "Call booked: " + (today ? "Today, 7:00 PM" : "Tomorrow, 1:00 PM"), "With Sara, Nova coach · Zoom · 45 min");
    await sleep(500, tok);
    await agentSays(tok, "RESPOND", today ? "r_booked_today" : "r_booked_tmrw", "Confirmed the booking");
    setStatus("WHATSAPP", "working", "Sending the confirmation");
    await sleep(900, tok);
    waCard(today ? "wa_today" : "wa_tmrw");
    bump("messages");
    ev("WHATSAPP", "Confirmation and Zoom link sent to " + LEAD + " on WhatsApp", "info");
    await sleep(600, tok);
    ev("WHATSAPP", "Reminder queued for " + remind + ", 2 hours before the call", "book");
    setStatus("WHATSAPP", "done", "Reminder queued for " + remind);
    await sleep(400, tok);
    ev("CHECKUP", "No-show watch on. If Karim misses the call, a rebook message goes out", "info");
    ev("LABEL", "Tagged " + LEAD + ": Booked, Sara, " + slot, "label");
    markPath("booked");
    const mins = Math.max(1, S.clock - START_CLOCK);
    endChat({
      kicker: "Call booked",
      title: "From first message to booked call in " + mins + " minutes",
      points: [
        "Qualified one question at a time",
        "Budget checked before booking",
        "Soonest slot offered first",
        "Confirmed on WhatsApp, reminder queued for " + remind
      ]
    });
  }

  async function nNoBudget(tok) {
    await leadReplied(tok);
    setStatus("LABEL", "working", "Tagging " + LEAD);
    ev("LABEL", "Tagged " + LEAD + ": Budget below the program", "label");
    setStatus("LABEL", "done", "Tagged: Budget low");
    ev("RESPOND", "Main program out of reach. Offering the $49 first step", "rule");
    await agentSays(tok, "RESPOND", "r_starter", "Offered the $49 first step");
    showChoices([{ key: "c_link", go: nStarter }, { key: "c_zero", go: nFree }]);
  }

  async function nStarter(tok) {
    await leadReplied(tok);
    await agentSays(tok, "RESPOND", "r_link", "Sent the Starter Course link");
    card("link", "link", "Nova Starter Course · $49", "Checkout link sent. Same first module as the full program.");
    setStatus("LABEL", "working", "Tagging " + LEAD);
    ev("LABEL", "Tagged " + LEAD + ": Starter", "label");
    setStatus("LABEL", "done", "Tagged: Starter");
    ev("COLD", "Follow-up on " + LEAD + " scheduled in 7 days", "info");
    setStatus("COLD", "done", "Follow-up in 7 days");
    release(LEAD);
    markPath("budget");
    endChat({
      kicker: "First step offered",
      title: "Not ready for the program, still moving forward",
      points: [
        "Budget checked before any booking",
        "$49 first step offered only after the budget check",
        "Tagged Starter, follow-up in 7 days"
      ]
    });
  }

  async function nFree(tok) {
    await leadReplied(tok);
    await agentSays(tok, "RESPOND", "r_free", "Sent the free class");
    card("link", "gift", "Free class sent", "The full class, free. No lead leaves with nothing.");
    setStatus("LABEL", "working", "Tagging " + LEAD);
    ev("LABEL", "Tagged " + LEAD + ": Nurture", "label");
    setStatus("LABEL", "done", "Tagged: Nurture");
    ev("COLD", "Re-warm for " + LEAD + " scheduled in 30 days", "info");
    setStatus("COLD", "done", "Re-warm in 30 days");
    release(LEAD);
    markPath("budget");
    endChat({
      kicker: "Nurtured",
      title: "No lead leaves with nothing",
      points: [
        "Budget checked before any booking",
        "$49 first step offered, then the free class",
        "Tagged Nurture, re-warm in 30 days"
      ]
    });
  }

  async function nBot(tok) {
    await leadReplied(tok);
    await askManager(tok, "bot");
  }

  async function nGuarantee(tok) {
    S.askedGuarantee = true;
    await leadReplied(tok);
    await askManager(tok, "guarantee");
  }

  function managerChoose(tok, topic) {
    return new Promise((resolve) => {
      const t = TOPICS[topic];
      currentChoices = null;
      choicesLabel.className = "choices-label is-mgr";
      choicesLabel.innerHTML = svg("user");
      choicesLabel.appendChild(document.createTextNode("You are the manager now"));
      choicesEl.innerHTML = "";
      const q = el("div", "mgr-q");
      q.appendChild(el("span", "mgr-from", "RESPOND asks in the team chat"));
      const qt = el("p");
      richText(qt, t.ask);
      q.appendChild(qt);
      choicesEl.appendChild(q);
      t.options.forEach((o) => {
        const b = el("button", "choice choice-mgr", o.label);
        b.type = "button";
        b.addEventListener("click", () => {
          if (tok !== S.token || b.disabled) return;
          if (o.blocked) {
            b.disabled = true;
            b.classList.add("is-blocked");
            const note = el("p", "mgr-blocked", "Blocked by the safety rules. " + o.blocked + " Pick another answer.");
            b.insertAdjacentElement("afterend", note);
            ev("SAFETY", "Rejected \"" + o.label.replace(/\.$/, "") + "\". " + o.blocked, "skip");
            return;
          }
          resolve(o);
        });
        choicesEl.appendChild(b);
      });
      choicesEl.appendChild(el("p", "mgr-note", "Your answer becomes a rule all six agents follow."));
    });
  }

  async function askManager(tok, topic) {
    const t = TOPICS[topic];
    if (learned[topic]) {
      const o = learned[topic];
      ev("RESPOND", "Rule #" + ruleNumber(topic) + " applied (taught by you). No need to ask the manager again", "rule");
      await agentSays(tok, "RESPOND", o.reply, "Answered with a saved rule");
      await afterRule(tok, topic, o.then, true);
      return;
    }
    setStatus("RESPOND", "asking", "Waiting for the manager");
    ev("RESPOND", t.pause, "esc");
    await sleep(500, tok);
    ev("RESPOND", "Escalated to the manager in the team chat", "esc");
    mgrMsg("RESPOND", t.ask);
    sys("Nova Academy is checking with the team...");
    const o = await managerChoose(tok, topic);
    lockChoices();
    mgrMsg("MANAGER", o.label, "from-mgr");
    learned[topic] = { rule: o.rule, reply: o.reply, then: o.then };
    renderRules(topic);
    ev("MANAGER", "Answered once. Rule #" + ruleNumber(topic) + " saved for all six agents", "rule");
    markPath("manager");
    tick(2);
    await sleep(500, tok);
    await agentSays(tok, "RESPOND", o.reply, "Replied using the new rule");
    await afterRule(tok, topic, o.then);
  }

  async function afterRule(tok, topic, then, fromRule) {
    if (then === "human") {
      await sleep(300, tok);
      claim(LEAD, "HUMAN");
      ev("RESPOND", "Handed " + LEAD + " to a human teammate. Agents step back from this lead", "esc");
      setStatus("RESPOND", "done", "Handed the lead to a human");
      endChat({
        kicker: "Handed to a human",
        human: true,
        title: "A person takes it from here",
        points: fromRule ? [
          "The saved rule answered instantly, no question needed",
          "The lead went straight to a human teammate",
          "Agents step back, so the lead never gets two answers"
        ] : [
          "The agent paused instead of guessing",
          "The manager answered once, in the team chat",
          "Saved as a rule, so next time nobody has to ask"
        ]
      });
      return;
    }
    if (topic === "bot") showChoices([{ key: "c_skill", go: nSkill }, { key: "c_price", go: nPrice }]);
    else showChoices([{ key: "c_yes", go: nBooking }, { key: "c_no", go: nNoBudget }]);
  }

  function markPath(key) {
    S.paths[key] = true;
    const n = document.querySelector('.path[data-path="' + key + '"]');
    if (n) n.classList.add("done");
  }

  const PATH_NAMES = { booked: "book a call", budget: "say it's too expensive", manager: "ask a tricky question, like whether it's a bot" };
  function endChat(o) {
    const d = el("div", "card-msg card-end" + (o.human ? " is-human" : ""));
    d.appendChild(el("p", "end-kicker", o.kicker));
    d.appendChild(el("h4", null, o.title));
    const ul = el("ul", "end-points");
    o.points.forEach((p) => {
      const li = el("li");
      li.innerHTML = svg("check");
      li.appendChild(document.createTextNode(p));
      ul.appendChild(li);
    });
    d.appendChild(ul);
    chatLog.appendChild(d);
    scrollChat();
    currentChoices = null;
    choicesLabel.className = "choices-label";
    choicesLabel.textContent = "Conversation complete";
    choicesEl.innerHTML = "";
    const row = el("div", "foot-row");
    row.appendChild(button("Play another path", "btn btn-ghost btn-sm", resetChat));
    row.appendChild(button("Run a full day", "btn btn-primary btn-sm", startDay));
    choicesEl.appendChild(row);
    const left = Object.keys(PATH_NAMES).filter((k) => !S.paths[k]).map((k) => PATH_NAMES[k]);
    const hint = left.length ? "Still to try: " + left.join(", ") + "." : "You found all three endings. Now run a full day to see 50 leads at once.";
    choicesEl.appendChild(el("p", "foot-hint", hint));
  }

  /* ---------- Full day simulation ---------- */
  const DAY_START = 9 * 60;
  const DAY_END = 22 * 60;
  const DAY_MS = 27000;
  const SPEED = (DAY_END - DAY_START) / DAY_MS;
  const D = { leads: 0, blocked: 0, esc: 0 };
  let day = null;
  let progressBar = null;

  const NAMES = ["lina", "faris", "rami", "dana", "hadi", "maya", "tarek", "nour", "ziad", "reem", "salim", "hala", "joud", "fadi", "rana", "yara", "adam", "leen", "majd", "sami", "tala", "wael", "zein", "hiba", "basel", "mira", "nadim", "jana", "rawan", "issa", "lara", "kenan", "dima", "hamza", "ghada", "saeed", "aya", "rasha", "nadia", "ilyas", "sana", "tamer", "celine", "yousef", "alia", "rita", "hussam", "mazen", "noura", "khaled", "lama", "omar.b"];
  const SUFFIX = [".k", "_dxb", ".creates", "_m", ".design", ".fit", "_studio", ".ae", "_23", ".media", ".online", "_04"];
  function rep(x, n) { const a = []; for (let i = 0; i < n; i++) a.push(x); return a; }
  const DECK = [].concat(
    rep("book", 5), rep("bookTmrw", 1), rep("starter", 4), rep("free", 7), rep("ghost", 8), rep("open", 5), rep("silent", 14),
    ["rewarmBook", "rewarmFree", "rewarmFree", "escBot", "escRefund", "escCert"]
  );
  const DAY_TOPICS = {
    bot: {
      pause: " asked if this is a bot. No rule yet, so it asked the manager",
      ask: " asks if this is a bot. What should we say?",
      answer: "Be honest: it's Nova's assistant, and a real coach runs every call.",
      rule: "Asked if it's a bot: be honest. It's Nova's assistant, and a real coach runs every call."
    },
    cert: {
      pause: " asked if the certificate is accredited. Not in the playbook, so it asked the manager",
      ask: " asks if the certificate is accredited. What should we say?",
      answer: "Say it's a Nova certificate of completion, not a university degree.",
      rule: "Asked about accreditation: it's a Nova certificate of completion, not a university degree."
    }
  };
  function fmtHour(h) { return fmtTime(h * 60); }

  function buildDay() {
    const rnd = mulberry32((Date.now() % 100000) + 7);
    const deck = shuffle(DECK.slice(), rnd);
    const names = shuffle(NAMES.slice(), rnd);
    const plan = [];
    let seq = 0;
    const at = (t, fn) => { if (t != null && t <= DAY_END) plan.push({ t: t, s: seq++, fn: fn }); };
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const booked = { Sara: new Set(), Omar: new Set() };
    const calls = [];
    let turn = 0;

    function pickSlot(t) {
      for (let h = Math.max(11, Math.ceil((t + 135) / 60)); h <= 21; h++) {
        const order = turn % 2 ? ["Omar", "Sara"] : ["Sara", "Omar"];
        for (let k = 0; k < 2; k++) {
          const who = order[k];
          if (!booked[who].has(h)) { booked[who].add(h); turn++; return { t: h * 60, closer: who, label: fmtHour(h) }; }
        }
      }
      turn++;
      return { t: null, closer: turn % 2 ? "Omar" : "Sara", label: "tomorrow 1:00 PM" };
    }
    function replyEvt(lead, t) {
      const owner = rnd() < 0.3 ? "BACKUP" : "RESPOND";
      const conflict = rnd() < 0.3;
      const waited = ri(4, 11);
      at(t, () => {
        bump("replies");
        claim(lead.h, owner);
        ev(owner, owner === "BACKUP" ? "Claimed " + lead.h + ", oldest waiting (" + waited + " min)" : "Claimed " + lead.h + ", newest reply", "claim");
        ibSet(lead, "Replied. " + owner + " has the claim", "Replied");
        if (conflict) {
          const other = owner === "RESPOND" ? "BACKUP" : "RESPOND";
          D.blocked += 1;
          blockFlash(lead.h, other);
          ev(other, "Reached " + lead.h + " too. " + owner + " holds the claim, skipped", "skip");
          updateClaimsNote();
        }
      });
      return owner;
    }
    function step(lead, t, agent, text, snip, tag) {
      at(t, () => { bump("messages"); ev(agent, text, "info"); ibSet(lead, agent + ": " + snip, tag || "Qualifying"); });
    }
    function qualify(lead, t, owner, n) {
      const lines = [
        ["Asked " + lead.h + " about work", "asked about work"],
        ["Asked " + lead.h + " about the income goal", "asked about the goal"],
        ["Budget check sent to " + lead.h, "budget check sent"]
      ];
      for (let k = 0; k < n; k++) { t += ri(4, 9); step(lead, t, owner, lines[k][0], lines[k][1]); }
      return t;
    }
    function book(lead, t, tomorrow) {
      t += ri(3, 7);
      at(t, () => { bump("qualified"); ev("LABEL", "Tagged " + lead.h + ": Qualified, budget OK", "label"); ibSet(lead, "Budget OK", "Qualified"); });
      t += 2;
      const slot = tomorrow ? { t: null, closer: "Sara", label: "tomorrow 1:00 PM" } : pickSlot(t);
      at(t, () => {
        bump("booked");
        claim(lead.h, "CHECKUP");
        ev("CHECKUP", "Booked " + lead.h + ": " + slot.label + " with " + slot.closer, "book");
        ibSet(lead, "Call " + slot.label + " with " + slot.closer, "Booked");
      });
      at(t + 1, () => { bump("messages"); ev("WHATSAPP", "Confirmation and Zoom link sent to " + lead.h, "info"); release(lead.h); });
      if (slot.t == null) {
        at(t + 2, () => ev("WHATSAPP", "Reminder queued for tomorrow 11:00 AM for " + lead.h, "info"));
        return;
      }
      at(slot.t - 120, () => { bump("messages"); ev("WHATSAPP", "Reminder sent to " + lead.h + ": call at " + slot.label, "info"); ibSet(lead, "Reminder sent for " + slot.label, "Booked"); });
      const info = { t: slot.t, noShow: false };
      calls.push(info);
      at(slot.t, () => {
        C.calls += 1;
        if (info.noShow) {
          bump("messages");
          ev("CHECKUP", lead.h + " missed the " + slot.label + " call. Rebook message sent", "skip");
          ibSet(lead, "Missed the call, rebook sent", "No-show");
        } else {
          C.shows += 1;
          ev("CHECKUP", lead.h + " joined the " + slot.label + " call with " + slot.closer, "book");
          ibSet(lead, "On the call with " + slot.closer, "Showed");
        }
        scheduleRender();
      });
    }
    function lowBudget(lead, t, owner, takesStarter) {
      t += ri(3, 7);
      at(t, () => { ev("LABEL", "Tagged " + lead.h + ": budget below the program", "label"); ibSet(lead, "Budget below the program", "Qualifying"); });
      t += 1;
      step(lead, t, owner, "Offered " + lead.h + " the $49 first step", "offered the $49 first step");
      t += ri(6, 15);
      if (takesStarter) {
        at(t, () => { ev("LABEL", lead.h + " bought the $49 Starter Course", "book"); ibSet(lead, "Bought the $49 Starter", "Starter"); release(lead.h); });
      } else {
        step(lead, t, owner, "Sent " + lead.h + " the free class. No lead leaves with nothing", "sent the free class", "Nurture");
        at(t + 1, () => { ev("COLD", "Re-warm for " + lead.h + " scheduled in 30 days", "info"); release(lead.h); });
      }
    }
    function escalate(lead, t, owner, topic) {
      t += ri(2, 5);
      if (topic === "refund") {
        at(t, () => {
          D.esc += 1;
          claim(lead.h, "HUMAN");
          ev(owner, lead.h + " asked for a refund. Sensitive, so a human takes it", "esc");
          mgrMsg(owner, lead.h + " asked for a refund on an old purchase. Handed to you.");
          ibSet(lead, "Refund request, a person has it", "Human");
        });
        return null;
      }
      if (topic === "bot" && learned.bot) {
        const human = learned.bot.then === "human";
        at(t, () => {
          bump("messages");
          ev(owner, "Rule #" + ruleNumber("bot") + " (taught by you) applied to " + lead.h + ". No need to ask", "rule");
          if (human) { claim(lead.h, "HUMAN"); ibSet(lead, "Handed to a person, per your rule", "Human"); }
          else ibSet(lead, owner + ": answered with your rule", "Qualifying");
        });
        return human ? null : t;
      }
      const E = DAY_TOPICS[topic];
      at(t, () => {
        D.esc += 1;
        ev(owner, lead.h + E.pause, "esc");
        mgrMsg(owner, lead.h + E.ask);
        ibSet(lead, "Waiting on the manager", "Asking");
      });
      t += ri(4, 8);
      at(t, () => {
        dayRules[topic] = E.rule;
        renderRules(topic);
        mgrMsg("MANAGER", E.answer, "from-mgr");
        ev("MANAGER", "Answered once. Rule #" + ruleNumber(topic) + " saved for all six agents", "rule");
        bump("messages");
        ibSet(lead, owner + ": replied with the new rule", "Qualifying");
      });
      return t;
    }

    for (let i = 0; i < DECK.length; i++) {
      const story = deck[i];
      const lead = { h: "@" + names[i] + SUFFIX[ri(0, SUFFIX.length - 1)], hue: ri(0, 359) };
      const t0 = DAY_START + Math.floor(i * 13.2) + ri(0, 8);
      const viaAd = story === "silent" || story.indexOf("rewarm") === 0 || rnd() < 0.7;
      at(t0, () => {
        D.leads += 1;
        ibSet(lead, viaAd ? "Asked for the free class" : "Sent a DM: \"Hi, is this still open?\"", "New");
        ev("LABEL", "New lead " + lead.h + (viaAd ? " from an Instagram ad" : " by direct message"), "label");
      });
      const t = t0 + 1;
      if (viaAd) {
        at(t, () => { claim(lead.h, "COLD"); bump("messages"); ev("COLD", "First message sent to " + lead.h, "info"); ibSet(lead, "COLD: first message sent", "Contacted"); });
        at(t + 1, () => release(lead.h));
      }
      let r, owner, q, e;
      switch (story) {
        case "book":
        case "bookTmrw":
          r = t + ri(3, 40); owner = replyEvt(lead, r);
          q = qualify(lead, r, owner, 3); book(lead, q, story === "bookTmrw");
          break;
        case "starter":
        case "free":
          r = t + ri(3, 50); owner = replyEvt(lead, r);
          q = qualify(lead, r, owner, 3); lowBudget(lead, q, owner, story === "starter");
          break;
        case "ghost": {
          r = t + ri(5, 60); owner = replyEvt(lead, r);
          q = qualify(lead, r, owner, ri(1, 2));
          const gap = ri(110, 170);
          at(q + gap, () => { bump("messages"); ev("COLD", "Re-warmed " + lead.h + ", quiet for " + Math.round(gap / 60) + " hours mid-chat", "info"); ibSet(lead, "COLD: re-warm sent", "Re-warmed"); release(lead.h); });
          break;
        }
        case "open":
          r = t + ri(60, 200); owner = replyEvt(lead, r);
          qualify(lead, r, owner, ri(1, 3));
          break;
        case "silent":
          at(t + ri(150, 260), () => { bump("messages"); ev("COLD", "Re-warmed " + lead.h + ", no reply yet", "info"); ibSet(lead, "COLD: re-warm sent", "Re-warmed"); });
          break;
        case "rewarmBook":
        case "rewarmFree": {
          const w = t + ri(100, 180);
          at(w, () => { bump("messages"); ev("COLD", "Re-warmed " + lead.h + ", no reply yet", "info"); ibSet(lead, "COLD: re-warm sent", "Re-warmed"); });
          r = w + ri(10, 30);
          at(r, () => ev("LABEL", lead.h + " came back after the re-warm", "label"));
          owner = replyEvt(lead, r);
          q = qualify(lead, r, owner, 3);
          if (story === "rewarmBook") book(lead, q, false); else lowBudget(lead, q, owner, false);
          break;
        }
        case "escBot":
        case "escCert":
          r = t + ri(3, 30); owner = replyEvt(lead, r);
          e = escalate(lead, r, owner, story === "escBot" ? "bot" : "cert");
          if (e != null) { q = qualify(lead, e, owner, 3); lowBudget(lead, q, owner, story === "escCert"); }
          break;
        case "escRefund":
          r = t + ri(3, 30); owner = replyEvt(lead, r);
          escalate(lead, r, owner, "refund");
          break;
      }
    }
    /* One realistic no-show: the fourth call of the day, followed up by CHECKUP. */
    const daytime = calls.filter((c) => c.t <= DAY_END).sort((a, b) => a.t - b.t);
    if (daytime.length >= 4) daytime[3].noShow = true;
    plan.sort((a, b) => a.t - b.t || a.s - b.s);
    return plan;
  }

  function ibSet(lead, snip, tag) {
    if (!day) return;
    let r = day.rows.get(lead.h);
    if (!r) {
      const row = el("div", "ib-row");
      row.style.setProperty("--h", String(lead.hue));
      const av = el("span", "ib-av", lead.h.charAt(1).toUpperCase());
      const main = el("div", "ib-main");
      const handle = el("div", "ib-handle", lead.h);
      const sn = el("div", "ib-snip");
      main.appendChild(handle);
      main.appendChild(sn);
      const tg = el("span", "ib-tag");
      row.appendChild(av);
      row.appendChild(main);
      row.appendChild(tg);
      inboxEl.insertBefore(row, inboxEl.firstChild);
      r = { row: row, snip: sn, tag: tg };
      day.rows.set(lead.h, r);
    }
    if (snip) r.snip.textContent = snip;
    if (tag) { r.tag.textContent = tag; r.tag.setAttribute("data-t", tag); }
    r.row.classList.remove("flash");
    void r.row.offsetWidth;
    r.row.classList.add("flash");
  }

  function renderDayFoot() {
    currentChoices = null;
    choicesLabel.className = "choices-label";
    choicesLabel.textContent = "Full day · 50 leads · fast-forward";
    choicesEl.innerHTML = "";
    const p = el("div", "progress");
    progressBar = el("i");
    p.appendChild(progressBar);
    const meta = el("div", "progress-meta");
    meta.appendChild(el("span", null, "9:00 AM"));
    meta.appendChild(el("span", null, "10:00 PM"));
    choicesEl.appendChild(p);
    choicesEl.appendChild(meta);
    choicesEl.appendChild(button("Stop and go back to the chat", "btn btn-ghost btn-sm", resetChat));
  }
  function updateProgress() {
    if (progressBar && day) progressBar.style.width = ((100 * (day.sim - DAY_START)) / (DAY_END - DAY_START)).toFixed(1) + "%";
  }

  function startDay() {
    S.token += 1;
    day = null;
    clearBoard();
    dayRules = {};
    renderRules();
    S.mode = "day";
    S.started = true;
    D.leads = 0; D.blocked = 0; D.esc = 0;
    chatLog.hidden = true;
    inboxEl.hidden = false;
    inboxEl.innerHTML = "";
    chatSub.textContent = "All inboxes · Instagram and WhatsApp";
    feedMode.textContent = "Full day";
    updateClaimsNote();
    dayBtn.disabled = true;
    dayBtn2.disabled = true;
    dayBtnLabel.textContent = "Running...";
    renderDayFoot();
    S.clock = DAY_START;
    renderClock();
    const plan = buildDay();
    day = { plan: plan, i: 0, sim: DAY_START, last: performance.now(), tok: S.token, rows: new Map() };
    ev("LABEL", "Day started. Six agents online, claim board empty", "label");
    scrollToDemo();
    nextFrame(dayFrame);
  }

  function dayFrame(now) {
    if (!day || day.tok !== S.token) return;
    const dt = Math.min(50, Math.max(0, now - day.last));
    day.last = now;
    day.sim = Math.min(DAY_END, day.sim + dt * SPEED);
    let n = 0;
    while (day && day.i < day.plan.length && day.plan[day.i].t <= day.sim) {
      if (n >= 5) { day.sim = day.plan[day.i].t; break; }
      const item = day.plan[day.i++];
      S.clock = item.t;
      item.fn();
      n += 1;
    }
    if (!day) return;
    S.clock = day.sim;
    renderClock();
    updateProgress();
    if (day.i >= day.plan.length && day.sim >= DAY_END) { finishDay(); return; }
    nextFrame(dayFrame);
  }

  function finishDay() {
    day = null;
    S.clock = DAY_END;
    renderClock();
    ev("LABEL", "Day closed. Live numbers saved for the team", "book");
    AGENTS.forEach((a) => {
      const u = agentUI[a.id];
      clearTimeout(u.timer);
      setStatus(a.id, "done", u.n + " actions today");
    });
    const replyRate = D.leads ? Math.round((100 * C.replies) / D.leads) : 0;
    const showRate = C.calls ? Math.round((100 * C.shows) / C.calls) + "%" : "Pending";
    const sum = el("div", "day-sum");
    sum.appendChild(el("h4", null, "Day complete: 9:00 AM to 10:00 PM"));
    sum.appendChild(el("p", null, "Every lead had exactly one owner. No customer got two answers."));
    const grid = el("div", "ds-grid");
    [
      [D.leads, "leads"],
      [C.messages, "messages sent"],
      [C.replies, "replied (" + replyRate + "%)"],
      [C.qualified, "qualified"],
      [C.booked, "calls booked"],
      [showRate, "show rate"],
      [D.blocked, "double answers blocked"],
      [D.esc, "escalations"],
      [Object.keys(dayRules).length, "new rules learned"]
    ].forEach((cell) => {
      const c = el("div");
      c.appendChild(el("b", null, String(cell[0])));
      c.appendChild(el("span", null, cell[1]));
      grid.appendChild(c);
    });
    sum.appendChild(grid);
    inboxEl.insertBefore(sum, inboxEl.firstChild);
    chatBody.scrollTop = 0;
    choicesLabel.className = "choices-label";
    choicesLabel.textContent = "Day complete";
    choicesEl.innerHTML = "";
    const row = el("div", "foot-row");
    row.appendChild(button("Back to the chat demo", "btn btn-ghost btn-sm", resetChat));
    row.appendChild(button("Run the day again", "btn btn-primary btn-sm", startDay));
    choicesEl.appendChild(row);
    dayBtn.disabled = false;
    dayBtn2.disabled = false;
    dayBtnLabel.textContent = "Run a full day";
  }

  function scrollToDemo() {
    const g = document.getElementById("demoGrid");
    if (!g) return;
    const top = g.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      g.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  /* ---------- Reset ---------- */
  function clearBoard() {
    Object.keys(C).forEach((k) => { C[k] = 0; });
    Object.keys(shown).forEach((k) => { shown[k] = 0; statEls[k].textContent = "0"; statEls[k].classList.remove("bump"); });
    scheduleRender();
    feedEl.innerHTML = "";
    feedEl.appendChild(el("li", "feed-empty", "Agent activity shows up here as the team works."));
    tickerSet(null);
    claims.clear();
    renderClaims();
    mgrReset();
    AGENTS.forEach((a) => {
      const u = agentUI[a.id];
      clearTimeout(u.timer);
      u.n = 0;
      u.count.textContent = "0";
      setStatus(a.id, "idle", "Waiting for work");
    });
  }

  function resetChat() {
    S.token += 1;
    day = null;
    clearBoard();
    dayRules = {};
    renderRules();
    S.mode = "chat";
    S.replied = false;
    S.dialect = false;
    S.askedGuarantee = false;
    S.bgDone = {};
    S.clock = START_CLOCK;
    renderClock();
    chatLog.innerHTML = "";
    bubbles.length = 0;
    painters.length = 0;
    chatLog.hidden = false;
    inboxEl.hidden = true;
    inboxEl.innerHTML = "";
    chatSub.textContent = "Instagram DM · you are " + LEAD;
    feedMode.textContent = "Demo lead";
    updateClaimsNote();
    dayBtn.disabled = false;
    dayBtn2.disabled = false;
    dayBtnLabel.textContent = "Run a full day";
    S.started = true;
    run(nStart);
  }

  function startChat() {
    if (S.started) return;
    S.started = true;
    run(nStart);
  }

  /* ---------- Language ---------- */
  function setLang(lang) {
    if (lang === S.lang) return;
    S.lang = lang;
    document.querySelectorAll(".seg-btn").forEach((b) => {
      const on = b.getAttribute("data-lang") === lang;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    bubbles.forEach(paintBubble);
    painters.forEach((p) => p());
    if (currentChoices) {
      const btns = choicesEl.querySelectorAll(".choice");
      currentChoices.forEach((c, i) => { if (btns[i]) paintChoice(btns[i], c); });
    }
    if (S.mode === "chat" && S.replied) {
      S.dialect = true;
      ev("RESPOND", lang === "ar" ? "Lead switched to Arabic. Replying in Gulf Arabic" : "Lead switched to English. Replying in English", "info");
    }
  }

  /* ---------- Init ---------- */
  function init() {
    buildAgents();
    renderClaims();
    renderRules();
    mgrReset();
    renderClock();
    renderStats();
    const intro = el("div", "sys chat-intro", "You play " + LEAD + ", a lead who just asked for Nova Academy's free class. Six agents will take it from here.");
    chatLog.appendChild(intro);

    document.querySelectorAll(".seg-btn").forEach((b) => b.addEventListener("click", () => setLang(b.getAttribute("data-lang"))));
    resetBtn.addEventListener("click", resetChat);
    dayBtn.addEventListener("click", startDay);
    dayBtn2.addEventListener("click", startDay);
    $("#startBtn").addEventListener("click", startChat);
    forgetBtn.addEventListener("click", () => {
      Object.keys(learned).forEach((k) => { delete learned[k]; });
      renderRules();
    });

    const panel = document.getElementById("chatPanel");
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { io.disconnect(); setTimeout(startChat, 450); }
        });
      }, { threshold: 0.35 });
      io.observe(panel);
    }

    const nums = document.querySelectorAll(".r-num[data-to]");
    if ("IntersectionObserver" in window && !reduceMotion) {
      nums.forEach((n) => { n.textContent = "0"; });
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io2.unobserve(en.target);
          countUp(en.target, parseInt(en.target.getAttribute("data-to"), 10), 1300);
        });
      }, { threshold: 0.5 });
      nums.forEach((n) => io2.observe(n));
    }
  }
  function countUp(node, to, dur) {
    const t0 = performance.now();
    const stepFn = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(to * e).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(stepFn);
    };
    requestAnimationFrame(stepFn);
  }

  init();
})();
