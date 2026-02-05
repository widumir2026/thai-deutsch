
// ===============================
// Thai Lernkarten – Features/Design
// - UI Sprache Umschalter (DE/TH)
// - Decks: A1, Alltag, Custom (CSV Import)
// - Kartenmodus + Multiple Choice
// - Einfaches Spaced Repetition (Again/Hard/Good)
// - Offline: Wörter + Progress in localStorage
// ===============================

const VERSION = "2026-02-05-1";

// ---------- Storage Keys ----------
const K_UI_LANG = "thai_cards_ui_lang";
const K_CUSTOM_WORDS = "thai_cards_custom_words_v1";
const K_PROGRESS = "thai_cards_progress_v1";
const K_ACTIVE_DECK = "thai_cards_active_deck_v1";
const K_MC_STATS = "thai_cards_mc_stats_v1";

let uiLang = localStorage.getItem(K_UI_LANG) || "de";

// ---------- i18n ----------
const I18N = {
  app_title: { de: "Thai Lernkarten", th: "บัตรคำภาษาไทย" },

  deck_custom: { de: "Eigenes Set", th: "ชุดของฉัน" },
  deck_a1: { de: "A1 (200)", th: "A1 (200)" },
  deck_alltag: { de: "Alltag (200)", th: "ชีวิตประจำวัน (200)" },

  mode_th_en: { de: "Thai → Englisch", th: "ไทย → อังกฤษ" },
  mode_th_de: { de: "Thai → Deutsch", th: "ไทย → เยอรมัน" },
  mode_en_th: { de: "Englisch → Thai", th: "อังกฤษ → ไทย" },
  mode_de_th: { de: "Deutsch → Thai", th: "เยอรมัน → ไทย" },

  train_cards: { de: "Kartenmodus", th: "โหมดบัตร" },
  train_mc: { de: "Multiple-Choice", th: "ปรนัย" },

  btn_flip: { de: "Umdrehen", th: "พลิก" },
  btn_again: { de: "Nochmal", th: "อีกครั้ง" },
  btn_hard: { de: "Schwer", th: "ยาก" },
  btn_good: { de: "Gekonnt", th: "รู้แล้ว" },
  btn_next: { de: "Nächste", th: "ถัดไป" },
  btn_audio_front: { de: "Audio vorne", th: "เสียงหน้า" },
  btn_audio_back: { de: "Audio hinten", th: "เสียงหลัง" },

  btn_reset_progress: { de: "Fortschritt löschen", th: "ลบความคืบหน้า" },

  hint_tap: { de: "Tippen zum Umdrehen", th: "แตะเพื่อพลิก" },

  panel_import_title: { de: "Wortliste (CSV)", th: "รายการคำ (CSV)" },
  csv_hint: {
    de: "Import-CSV: Header th,roman,en,de,cat. UTF-8. Kommas in Feldern vermeiden.",
    th: "CSV: ส่วนหัว th,roman,en,de,cat. UTF-8. หลีกเลี่ยงเครื่องหมายจุลภาคในข้อความ"
  },
  btn_export_csv: { de: "Export CSV", th: "ส่งออก CSV" },
  btn_clear_custom: { de: "Eigenes Set löschen", th: "ลบชุดของฉัน" },
  current_deck_label: { de: "Aktiv:", th: "ใช้งาน:" },

  panel_pwa_title: { de: "Installieren (PWA)", th: "ติดตั้ง (PWA)" },
  pwa_hint: {
    de: "iPhone: Safari → Teilen → „Zum Home-Bildschirm“. Android/Chrome: „Installieren“. Offline nach erstem Laden.",
    th: "iPhone: Safari → แชร์ → „เพิ่มไปยังหน้าจอโฮม“. Android/Chrome: „ติดตั้ง“. ออฟไลน์หลังโหลดครั้งแรก."
  },
  pwa_status_label: { de: "Status:", th: "สถานะ:" },
  version_label: { de: "Version:", th: "เวอร์ชัน:" },

  msg_import_ok: { de: "Wörter importiert", th: "นำเข้าคำแล้ว" },
  msg_import_fail: { de: "Import fehlgeschlagen", th: "นำเข้าไม่สำเร็จ" },
  msg_need_custom: { de: "Eigenes Set ist leer. Bitte CSV importieren.", th: "ชุดของฉันว่าง กรุณานำเข้า CSV" },
  msg_progress_cleared: { de: "Fortschritt gelöscht", th: "ลบความคืบหน้าแล้ว" },
  msg_custom_cleared: { de: "Eigenes Set gelöscht", th: "ลบชุดของฉันแล้ว" }
};

function t(key){
  const x = I18N[key];
  if(!x) return key;
  return uiLang === "th" ? x.th : x.de;
}

function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-opt]").forEach(el=>{
    el.textContent = t(el.getAttribute("data-i18n-opt"));
  });
}

// ---------- Deck Daten (werden per CSV geliefert; hier laden wir per fetch) ----------
async function fetchCsv(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error("Fetch failed: " + path);
  const text = await res.text();
  return parseCsv(text);
}

function parseCsv(text){
  // Simple CSV parser (keine Kommas in Feldern; passt zu unseren Listen)
  const rows = text.split(/\r?\n/).filter(r => r.trim());
  if(rows.length < 2) return [];
  const header = rows[0].split(",").map(s => s.trim().toLowerCase());
  const idx = (name) => header.indexOf(name);

  const iTh = idx("th");
  const iRo = idx("roman");
  const iEn = idx("en");
  const iDe = idx("de");
  const iCat = idx("cat");

  const out = [];
  for(const row of rows.slice(1)){
    const c = row.split(",");
    out.push({
      th: (c[iTh] || "").trim(),
      roman: (iRo>=0 ? (c[iRo] || "").trim() : ""),
      en: (c[iEn] || "").trim(),
      de: (c[iDe] || "").trim(),
      cat: (iCat>=0 ? (c[iCat] || "").trim() : "")
    });
  }
  return out.filter(w => w.th || w.en || w.de);
}

// ---------- Progress (Spaced Repetition) ----------
// box: 0..5, nextDue: timestamp
let progress = safeJsonParse(localStorage.getItem(K_PROGRESS), {});

let mcStats = safeJsonParse(localStorage.getItem(K_MC_STATS), {});

function getMcStats(deckKey){
  if(!mcStats[deckKey]) mcStats[deckKey] = { correct: 0, total: 0 };
  return mcStats[deckKey];
}
function saveMcStats(){
  localStorage.setItem(K_MC_STATS, JSON.stringify(mcStats));
}
function resetMcStats(deckKey=null){
  if(deckKey){
    mcStats[deckKey] = { correct: 0, total: 0 };
  } else {
    mcStats = {};
  }
  saveMcStats();
}

// wordId: stable hash of content
function wordId(w){
  return hashStr((w.th||"") + "|" + (w.en||"") + "|" + (w.de||""));
}

function hashStr(s){
  // simple deterministic hash (FNV-1a like)
  let h = 2166136261;
  for(let i=0;i<s.length;i++){
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function safeJsonParse(s, fallback){
  try{ return s ? JSON.parse(s) : fallback; }catch(e){ return fallback; }
}

function saveProgress(){
  localStorage.setItem(K_PROGRESS, JSON.stringify(progress));
}

function getProg(id){
  if(!progress[id]) progress[id] = { box: 0, nextDue: 0, seen: 0, right: 0, wrong: 0 };
  return progress[id];
}

function schedule(id, grade){
  // grade: again|hard|good
  const p = getProg(id);
  p.seen += 1;

  if(grade === "again"){
    p.wrong += 1;
    p.box = 0;
    p.nextDue = Date.now() + 2*60*1000; // 2 Minuten
  } else if(grade === "hard"){
    p.right += 1;
    p.box = Math.min(5, Math.max(0, p.box + 1));
    const mins = [5, 15, 60, 6*60, 24*60, 3*24*60][p.box];
    p.nextDue = Date.now() + mins*60*1000;
  } else {
    p.right += 1;
    p.box = Math.min(5, p.box + 2);
    const mins = [10, 60, 6*60, 24*60, 3*24*60, 7*24*60][p.box];
    p.nextDue = Date.now() + mins*60*1000;
  }
  saveProgress();
}

// ---------- App State ----------
const el = {
  uiLang: document.getElementById("uiLang"),
  deck: document.getElementById("deck"),
  mode: document.getElementById("mode"),
  train: document.getElementById("train"),
  card: document.getElementById("card"),
  frontLang: document.getElementById("frontLang"),
  frontWord: document.getElementById("frontWord"),
  sub: document.getElementById("sub"),
  hint: document.getElementById("hint"),
  flip: document.getElementById("flip"),
  again: document.getElementById("again"),
  hard: document.getElementById("hard"),
  good: document.getElementById("good"),
  next: document.getElementById("next"),
  speakFront: document.getElementById("speakFront"),
  speakBack: document.getElementById("speakBack"),
  resetProgress: document.getElementById("resetProgress"),
  csvFile: document.getElementById("csvFile"),
  exportCsv: document.getElementById("exportCsv"),
  clearCustom: document.getElementById("clearCustom"),
  deckPill: document.getElementById("deckPill"),
  statsPill: document.getElementById("statsPill"),
  netPill: document.getElementById("netPill"),
  deckInfo: document.getElementById("deckInfo"),
  pwaStatus: document.getElementById("pwaStatus"),
  ver: document.getElementById("ver")
};

el.ver.textContent = VERSION;

let decks = {
  a1: [],
  alltag: [],
  custom: []
};

let activeDeck = localStorage.getItem(K_ACTIVE_DECK) || "custom";
let currentList = [];
let current = null;
let flipped = false;
let mcAnswer = null;

// ---------- Deck Loading ----------
function loadCustomFromStorage(){
  decks.custom = safeJsonParse(localStorage.getItem(K_CUSTOM_WORDS), []);
}

function saveCustomToStorage(){
  localStorage.setItem(K_CUSTOM_WORDS, JSON.stringify(decks.custom));
}

function deckLabel(key){
  if(key==="a1") return t("deck_a1");
  if(key==="alltag") return t("deck_alltag");
  return t("deck_custom");
}

function setDeck(key){
  activeDeck = key;
  localStorage.setItem(K_ACTIVE_DECK, key);

  currentList = decks[key] || [];
  if(key==="custom" && currentList.length===0){
    toast(t("msg_need_custom"));
  }
  pickNext(true);
  updateTop();
}

function updateTop(){
  el.deckPill.textContent = deckLabel(activeDeck);
  el.netPill.textContent = navigator.onLine ? (uiLang==="th" ? "ออนไลน์" : "online") : (uiLang==="th" ? "ออฟไลน์" : "offline");

  const due = countDue(currentList);
  const base = (uiLang==="th" ? "พร้อม" : "fällig") + ": " + due + " / " + currentList.length;

  const s = getMcStats(activeDeck);
  const mcPart = (uiLang==="th" ? " | MC ถูก: " : " | MC richtig: ") + s.correct + " / " + s.total;

  el.statsPill.textContent = base + mcPart;

  el.deckInfo.textContent = activeDeck + " (" + currentList.length + ")";
}

function countDue(list){
  const now = Date.now();
  let n = 0;
  for(const w of list){
    const id = wordId(w);
    const p = getProg(id);
    if(p.nextDue <= now) n += 1;
  }
  return n;
}

// ---------- Card Generation ----------
function pair(w){
  const m = el.mode.value;
  if(m==="th-en") return { frontLang:"Thai", front:w.th, frontExtra:w.roman||"", backLang:"Englisch", back:w.en, backExtra:"" };
  if(m==="th-de") return { frontLang:"Thai", front:w.th, frontExtra:w.roman||"", backLang:"Deutsch", back:w.de, backExtra:"" };
  if(m==="en-th") return { frontLang:"Englisch", front:w.en, frontExtra:"", backLang:"Thai", back:w.th, backExtra:w.roman||"" };
  return { frontLang:"Deutsch", front:w.de, frontExtra:"", backLang:"Thai", back:w.th, backExtra:w.roman||"" };
}

function langLabel(name){
  if(uiLang==="th"){
    if(name==="Thai") return "ไทย";
    if(name==="Deutsch") return "เยอรมัน";
    if(name==="Englisch") return "อังกฤษ";
  }
  return name;
}

function render(){
  if(!current){
    el.frontLang.textContent = "-";
    el.frontWord.textContent = uiLang==="th" ? "ไม่มีคำ" : "Keine Wörter";
    el.sub.textContent = "";
    el.again.disabled = el.hard.disabled = el.good.disabled = true;
    el.flip.disabled = el.next.disabled = true;
    el.speakFront.disabled = el.speakBack.disabled = true;
    return;
  }

  el.again.disabled = el.hard.disabled = el.good.disabled = false;
  el.flip.disabled = el.next.disabled = false;
  el.speakFront.disabled = el.speakBack.disabled = false;

  const p = pair(current);

  if(el.train.value==="cards"){
    el.frontLang.textContent = flipped ? langLabel(p.backLang) : langLabel(p.frontLang);
    el.frontWord.textContent = flipped ? p.back : p.front;

    const extra = flipped ? (p.backExtra||"") : (p.frontExtra||"");
    const whichLang = flipped ? p.backLang : p.frontLang;
    el.sub.textContent = (extra && whichLang==="Thai")
      ? ((uiLang==="th" ? "คำอ่าน: " : "Umschrift: ") + extra)
      : "";
    return;
  }

  // Multiple choice
  flipped = false;
  el.frontLang.textContent = langLabel(p.frontLang);
  el.frontWord.textContent = p.front;

  // Umschrift immer anzeigen, wenn Thai die FRAGE ist
  const qRoman = (p.frontLang === "Thai" && (p.frontExtra||"")) ? (p.frontExtra||"") : "";
  const qRomanHtml = qRoman
    ? `<div style="opacity:.7; font-size:15px; margin-top:6px;">${uiLang==="th" ? "คำอ่าน: " : "Umschrift: "}${escapeHtml(qRoman)}</div>`
    : "";

  // Optionen: wenn die Loesung Thai ist, zeige auch Umschrift (roman)
  const isThaiAnswer = (p.backLang === "Thai");
  const candidates = currentList.map(x => {
    const px = pair(x);
    return { val: px.back, roman: (px.backLang==="Thai" ? (px.backExtra||"") : ""), lang: px.backLang };
  }).filter(c => c.lang === p.backLang && (c.val||"").trim() !== "");

  const opts = [{ val: p.back, roman: isThaiAnswer ? (p.backExtra||"") : "" }];

  while(opts.length < 4 && candidates.length){
    const r = candidates[Math.floor(Math.random() * candidates.length)];
    if(!opts.some(o => o.val === r.val)){
      opts.push({ val: r.val, roman: r.roman || "" });
    }
  }

  // Shuffle
  opts.sort(() => Math.random() - 0.5);

  mcAnswer = { val: p.back, roman: isThaiAnswer ? (p.backExtra||"") : "" };

  const optsHtml = opts.map(o => {
    const v = escapeHtml(o.val);
    const ro = escapeHtml(o.roman || "");
    if(isThaiAnswer && ro){
      return `<button class="mcBtn" data-val="${v}">
        <div style="font-size:20px; font-weight:700;">${v}</div>
        <div style="font-size:13px; opacity:.7; margin-top:2px;">${uiLang==="th" ? "คำอ่าน: " : "Umschrift: "}${ro}</div>
      </button>`;
    }
    return `<button class="mcBtn" data-val="${v}">${v}</button>`;
  }).join("");

  // sub wird zum Container: optional Umschrift der Frage + Optionen
  el.sub.innerHTML = qRomanHtml + optsHtml;

  mcLocked = false;
}

function escapeHtml(s){
  return (s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;");
}

// ---------- Selection ----------
function pickNext(forceAny=false){
  if(!currentList.length){
    current = null;
    render();
    updateTop();
    return;
  }

  const now = Date.now();
  const due = currentList.filter(w => getProg(wordId(w)).nextDue <= now);
  const pool = due.length ? due : (forceAny ? currentList : due);

  const w = pool[Math.floor(Math.random()*pool.length)];
  current = w;
  flipped = false;
  mcAnswer = null;
  render();
  updateTop();
}

// ---------- Actions ----------
function flip(){
  if(el.train.value!=="cards") return;
  flipped = !flipped;
  render();
}

function grade(kind){
  if(!current) return;
  schedule(wordId(current), kind);
  pickNext();
}

function next(){
  pickNext(true);
}

// Multiple-Choice Klick-Handling (mit Feedback + Statistik)
let mcLocked = false;

el.sub.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-val]");
  if(!btn) return;
  if(el.train.value !== "mc") return;
  if(mcLocked) return;

  mcLocked = true;

  const buttons = Array.from(el.sub.querySelectorAll("button[data-val]"));
  buttons.forEach(b => b.disabled = true);

  const chosen = btn.getAttribute("data-val") || "";
  const correctEsc = escapeHtml(mcAnswer?.val || "");
  const ok = (correctEsc === chosen);

  // Statistik
  const st = getMcStats(activeDeck);
  st.total += 1;
  if(ok) st.correct += 1;
  saveMcStats();
  updateTop();

  // Feedback Farben
  const green = "#047857";
  const red = "#b91c1c";

  btn.style.background = ok ? green : red;
  btn.style.borderColor = ok ? green : red;
  btn.style.color = "#fff";

  if(!ok){
    const correctBtn = buttons.find(b => (b.getAttribute("data-val") || "") === correctEsc);
    if(correctBtn){
      correctBtn.style.background = green;
      correctBtn.style.borderColor = green;
      correctBtn.style.color = "#fff";
    }
  }

  // Nach kurzer Anzeige automatisch weiter (und SR bewerten)
  setTimeout(() => {
    mcLocked = false;
    if(ok){
      grade("good");
    } else {
      grade("again");
    }
  }, 900);
});

function exportCsv(list){
  const rows = [["th","roman","en","de","cat"]].concat(list.map(w=>[w.th||"", w.roman||"", w.en||"", w.de||"", w.cat||""]));
  const csv = rows.map(r => r.map(v => {
    const s = (v ?? "").toString();
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(",")).join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "thai_cards_" + activeDeck + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

el.exportCsv.addEventListener("click", ()=> exportCsv(currentList));

el.clearCustom.addEventListener("click", ()=>{
  if(activeDeck !== "custom"){
    toast(uiLang==="th" ? "สลับไปที่ ชุดของฉัน ก่อน" : "Bitte zuerst auf „Eigenes Set“ wechseln.");
    return;
  }
  decks.custom = [];
  saveCustomToStorage();
  toast(t("msg_custom_cleared"));
  setDeck("custom");
});

// ---------- Progress Reset ----------
el.resetProgress.addEventListener("click", ()=>{
  progress = {};
  saveProgress();
  resetMcStats(activeDeck);
  toast(t("msg_progress_cleared"));
  updateTop();
});

// ---------- UI wiring ----------
el.uiLang.value = uiLang;
el.uiLang.addEventListener("change", ()=>{
  uiLang = el.uiLang.value;
  localStorage.setItem(K_UI_LANG, uiLang);
  applyI18n();
  updateTop();
  render();
});

el.deck.value = activeDeck;
el.deck.addEventListener("change", ()=> setDeck(el.deck.value));

el.mode.addEventListener("change", ()=>{ flipped=false; render(); });
el.train.addEventListener("change", ()=>{ flipped=false; render(); });

el.card.addEventListener("click", ()=>{
  if(el.train.value==="cards") flip();
});

el.flip.addEventListener("click", flip);
el.again.addEventListener("click", ()=> grade("again"));
el.hard.addEventListener("click", ()=> grade("hard"));
el.good.addEventListener("click", ()=> grade("good"));
el.next.addEventListener("click", next);

el.speakFront.addEventListener("click", ()=>{
  const x = currentTexts();
  if(!x) return;
  const lc = (x.frontLang==="Thai")?"th":(x.frontLang==="Englisch")?"en":"de";
  speak(x.frontText, lc);
});
el.speakBack.addEventListener("click", ()=>{
  const x = currentTexts();
  if(!x) return;
  const lc = (x.backLang==="Thai")?"th":(x.backLang==="Englisch")?"en":"de";
  speak(x.backText, lc);
});

// ---------- PWA Status ----------
function initPwaStatus(){
  if(!("serviceWorker" in navigator)){
    el.pwaStatus.textContent = uiLang==="th" ? "ไม่รองรับ" : "nicht verfügbar";
    return;
  }
  el.pwaStatus.textContent = uiLang==="th" ? "พร้อม" : "bereit";
}

// ---------- Toast (minimal) ----------
let toastTimer = null;
function toast(msg){
  clearTimeout(toastTimer);
  el.sub.textContent = msg;
  toastTimer = setTimeout(()=>{ if(el.train.value==="cards") el.sub.textContent=""; }, 2500);
}

function bumpCacheAndReloadHint(){
  // Hinweis: beim CSV Import braucht es keinen SW cache.
  // Diese Funktion bleibt als Platzhalter fuer spaetere Cache-Versionen.
}

// ---------- Init ----------
async function init(){
  applyI18n();
  initPwaStatus();

  // Load decks
  loadCustomFromStorage();

  // Fetch A1/Alltag lists (same repo)
  try{
    decks.a1 = await fetchCsv("./thai_cards_A1_200.csv");
  }catch(e){ console.warn("A1 CSV missing"); decks.a1 = []; }
  try{
    decks.alltag = await fetchCsv("./thai_cards_alltag_200.csv");
  }catch(e){ console.warn("Alltag CSV missing"); decks.alltag = []; }

  // Default deck
  el.deck.value = activeDeck;
  setDeck(activeDeck);

  window.addEventListener("online", updateTop);
  window.addEventListener("offline", updateTop);
}

init();
