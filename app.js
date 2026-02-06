// Thai Lernkarten – kompletter Build (2026-02-06)
const VERSION = "2026-02-06-wronglist-2";

// Storage
const K_UI_LANG = "thai_cards_ui_lang";
const K_CUSTOM_WORDS = "thai_cards_custom_words_v1";
const K_PROGRESS = "thai_cards_progress_v1";
const K_ACTIVE_DECK = "thai_cards_active_deck_v1";
const K_MC_STATS = "thai_cards_mc_stats_v1";
const K_MC_WRONG = "thai_cards_mc_wrong_v1";
const K_STUDY_WRONG_ONLY = "thai_cards_study_wrong_only_v1";

let uiLang = localStorage.getItem(K_UI_LANG) || "de";
let activeDeck = localStorage.getItem(K_ACTIVE_DECK) || "custom";

function safeJsonParse(s, fallback){ try{ return s ? JSON.parse(s) : fallback; }catch(e){ return fallback; } }
function $(id){ return document.getElementById(id); }

function escapeHtml(s){ return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }
function unescapeHtml(s){ return (s||"").replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"').replaceAll("&#39;","'").replaceAll("&amp;","&"); }

// Progress (SR)
let progress = safeJsonParse(localStorage.getItem(K_PROGRESS), {});
function saveProgress(){ localStorage.setItem(K_PROGRESS, JSON.stringify(progress)); }

// MC stats + wrong
let mcStats = safeJsonParse(localStorage.getItem(K_MC_STATS), {});
let mcWrong = safeJsonParse(localStorage.getItem(K_MC_WRONG), {});
let studyWrongOnly = (localStorage.getItem(K_STUDY_WRONG_ONLY) === "1");

function getMcStats(deckKey){ if(!mcStats[deckKey]) mcStats[deckKey] = { correct:0, total:0 }; return mcStats[deckKey]; }
function saveMcStats(){ localStorage.setItem(K_MC_STATS, JSON.stringify(mcStats)); }
function resetMcStats(deckKey){ mcStats[deckKey] = { correct:0, total:0 }; saveMcStats(); }

function getMcWrong(deckKey){ if(!mcWrong[deckKey]) mcWrong[deckKey] = []; return mcWrong[deckKey]; }
function saveMcWrong(){ localStorage.setItem(K_MC_WRONG, JSON.stringify(mcWrong)); }
function addMcWrong(deckKey, entry){
  const arr = getMcWrong(deckKey);
  arr.unshift(entry);
  if(arr.length > 200) arr.length = 200;
  saveMcWrong();
}
function clearMcWrong(deckKey){ mcWrong[deckKey] = []; saveMcWrong(); }

// Word id/hash
function hashStr(s){ let h = 2166136261; for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h>>>0).toString(16); }
function wordId(w){ return hashStr((w.th||"")+"|"+(w.en||"")+"|"+(w.de||"")); }

function getProg(id){ if(!progress[id]) progress[id] = { box:0, nextDue:0, seen:0, right:0, wrong:0 }; return progress[id]; }
function schedule(id, grade){ 
  const p = getProg(id); p.seen += 1;
  if(grade==="again"){ p.wrong += 1; p.box = 0; p.nextDue = Date.now() + 2*60*1000; }
  else if(grade==="hard"){ p.right += 1; p.box = Math.min(5, Math.max(0, p.box+1)); const mins=[5,15,60,6*60,24*60,3*24*60][p.box]; p.nextDue = Date.now()+mins*60*1000; }
  else { p.right += 1; p.box = Math.min(5, p.box+2); const mins=[10,60,6*60,24*60,3*24*60,7*24*60][p.box]; p.nextDue = Date.now()+mins*60*1000; }
  saveProgress();
}

// DOM
const el = {
  titlePill: $("titlePill"),
  deckPill: $("deckPill"),
  statsPill: $("statsPill"),
  netPill: $("netPill"),
  uiLang: $("uiLang"),
  deck: $("deck"),
  mode: $("mode"),
  train: $("train"),
  resetProgress: $("resetProgress"),
  card: $("card"),
  frontLang: $("frontLang"),
  frontWord: $("frontWord"),
  sub: $("sub"),
  hint: $("hint"),
  flip: $("flip"),
  again: $("again"),
  hard: $("hard"),
  good: $("good"),
  next: $("next"),
  speakFront: $("speakFront"),
  speakBack: $("speakBack"),
  csvFile: $("csvFile"),
  exportCsv: $("exportCsv"),
  clearCustom: $("clearCustom"),
  deckInfo: $("deckInfo"),
  pwaStatus: $("pwaStatus"),
  ver: $("ver"),
  wrongList: $("wrongList"),
  learnWrong: $("learnWrong"),
  clearWrong: $("clearWrong")
};

el.ver.textContent = VERSION;

// Decks
let decks = { a1:[], alltag:[], custom:[] };
function loadCustom(){ decks.custom = safeJsonParse(localStorage.getItem(K_CUSTOM_WORDS), []); }
function saveCustom(){ localStorage.setItem(K_CUSTOM_WORDS, JSON.stringify(decks.custom)); }

// CSV parse (simple, no commas in fields)
function parseCsv(text){
  const rows = text.split(/\r?\n/).filter(r => r.trim());
  if(rows.length < 2) return [];
  const header = rows[0].split(",").map(x => x.trim().toLowerCase());
  const idx = (n) => header.indexOf(n);
  const iTh=idx("th"), iRo=idx("roman"), iEn=idx("en"), iDe=idx("de"), iCat=idx("cat");
  const out=[];
  for(const row of rows.slice(1)){
    const c = row.split(",");
    out.push({
      th: (c[iTh]||"").trim(),
      roman: (iRo>=0 ? (c[iRo]||"").trim() : ""),
      en: (c[iEn]||"").trim(),
      de: (c[iDe]||"").trim(),
      cat: (iCat>=0 ? (c[iCat]||"").trim() : "")
    });
  }
  return out.filter(w => w.th || w.en || w.de);
}

async function fetchCsv(path){
  const res = await fetch(path, { cache:"no-store" });
  if(!res.ok) return [];
  return parseCsv(await res.text());
}

function deckLabel(k){
  if(uiLang==="th"){ if(k==="a1") return "A1 (200)"; if(k==="alltag") return "ชีวิตประจำวัน (200)"; return "ชุดของฉัน"; }
  if(k==="a1") return "A1 (200)";
  if(k==="alltag") return "Alltag (200)";
  return "Eigenes Set";
}

function langLabel(name){
  if(uiLang==="th"){ if(name==="Thai") return "ไทย"; if(name==="Deutsch") return "เยอรมัน"; if(name==="Englisch") return "อังกฤษ"; }
  return name;
}

let currentList = [];
let current = null;
let flipped = false;
let mcAnswer = null;
let mcLocked = false;

function rebuildCurrentList(){
  if(studyWrongOnly){
    const wrong = getMcWrong(activeDeck);
    const ids = new Set(wrong.map(e => e.id).filter(Boolean));
    currentList = (decks[activeDeck]||[]).filter(w => ids.has(wordId(w)));
  } else {
    currentList = decks[activeDeck] || [];
  }
}

function countDue(list){
  const now=Date.now(); let n=0;
  for(const w of list){ if(getProg(wordId(w)).nextDue <= now) n++; }
  return n;
}

function updateWrongPanel(){
  if(!el.wrongList) return;
  const wrong = getMcWrong(activeDeck);
  const seen=new Set(); const unique=[];
  for(const e of wrong){ if(!e.id) continue; if(seen.has(e.id)) continue; seen.add(e.id); unique.push(e); if(unique.length>=40) break; }
  el.learnWrong.textContent = studyWrongOnly ? (uiLang==="th" ? "กลับไปเรียนปกติ" : "Zurück zum normalen Lernen") : (uiLang==="th" ? "เรียนเฉพาะที่ตอบผิด" : "Nur falsche MC lernen");
  el.clearWrong.textContent = uiLang==="th" ? "ลบรายการผิด" : "Falsche Liste leeren";

  if(unique.length===0){
    el.wrongList.innerHTML = `<div class="small">${uiLang==="th" ? "ยังไม่มีข้อที่ตอบผิด" : "Noch keine falschen Antworten."}</div>`;
    return;
  }

  el.wrongList.innerHTML = unique.map(e=>{
    const q = escapeHtml(e.q||"");
    const qro = escapeHtml(e.qRoman||"");
    const corr = escapeHtml(e.correct||"");
    const cro = escapeHtml(e.correctRoman||"");
    const chosen = escapeHtml(e.chosen||"");

    const qLine = qro ? `${q}<div class="small">${uiLang==="th" ? "คำอ่าน: " : "Umschrift: "}${qro}</div>` : q;
    const cLine = cro ? `${corr}<div class="small">${uiLang==="th" ? "คำอ่าน: " : "Umschrift: "}${cro}</div>` : corr;

    return `
      <div style="border:1px solid var(--border); border-radius:12px; padding:10px; background:var(--card); margin-top:8px;">
        <div class="small" style="opacity:.7">Frage (${escapeHtml(e.qLang||"")})</div>
        <div style="font-weight:700; margin-top:2px">${qLine}</div>
        <div class="small" style="opacity:.7; margin-top:8px">Richtig</div>
        <div style="font-weight:700; margin-top:2px">${cLine}</div>
        <div class="small" style="opacity:.7; margin-top:8px">Deine Antwort</div>
        <div style="margin-top:2px">${chosen}</div>
      </div>
    `;
  }).join("");
}

function updateTop(){
  el.deckPill.textContent = deckLabel(activeDeck);
  el.netPill.textContent = navigator.onLine ? (uiLang==="th" ? "ออนไลน์" : "online") : (uiLang==="th" ? "ออฟไลน์" : "offline");

  const due = countDue(currentList);
  const base = (uiLang==="th" ? "พร้อม" : "fällig") + ": " + due + " / " + currentList.length;

  const s = getMcStats(activeDeck);
  const wrong = s.total - s.correct;
  const mcPart = (uiLang==="th" ? " | ปรนัย ถูก/ผิด: " : " | Multiple-Choice richtig/falsch: ") + s.correct + " / " + wrong;

  el.statsPill.textContent = base + mcPart;
  el.deckInfo.textContent = activeDeck + " (" + currentList.length + ")" + (studyWrongOnly ? " [WRONG]" : "");

  updateWrongPanel();
}

function pair(w){
  const m = el.mode.value;
  if(m==="th-en") return { frontLang:"Thai", front:w.th, frontExtra:w.roman||"", backLang:"Englisch", back:w.en, backExtra:"" };
  if(m==="th-de") return { frontLang:"Thai", front:w.th, frontExtra:w.roman||"", backLang:"Deutsch", back:w.de, backExtra:"" };
  if(m==="en-th") return { frontLang:"Englisch", front:w.en, frontExtra:"", backLang:"Thai", back:w.th, backExtra:w.roman||"" };
  return { frontLang:"Deutsch", front:w.de, frontExtra:"", backLang:"Thai", back:w.th, backExtra:w.roman||"" };
}

function pickNext(forceAny=false){
  if(!currentList.length){ current=null; render(); updateTop(); return; }
  const now=Date.now();
  const due = currentList.filter(w => getProg(wordId(w)).nextDue <= now);
  const pool = due.length ? due : (forceAny ? currentList : due);
  current = pool[Math.floor(Math.random()*pool.length)];
  flipped=false; mcAnswer=null; mcLocked=false;
  render(); updateTop();
}

function render(){
  if(!current){
    el.frontLang.textContent = "-";
    el.frontWord.textContent = uiLang==="th" ? "ไม่มีคำ" : "Keine Wörter";
    el.sub.textContent = "";
    return;
  }

  const p = pair(current);

  if(el.train.value==="cards"){
    const showLang = flipped ? p.backLang : p.frontLang;
    const showWord = flipped ? p.back : p.front;
    const extra = flipped ? (p.backExtra||"") : (p.frontExtra||"");

    el.frontLang.textContent = langLabel(showLang);
    el.frontWord.textContent = showWord;

    if(showLang==="Thai" && extra){
      el.sub.textContent = (uiLang==="th" ? "คำอ่าน: " : "Umschrift: ") + extra;
    } else {
      el.sub.textContent = "";
    }
    return;
  }

  // Multiple-Choice
  el.frontLang.textContent = langLabel(p.frontLang);
  el.frontWord.textContent = p.front;

  const qRoman = (p.frontLang==="Thai" && (p.frontExtra||"")) ? p.frontExtra : "";
  const qRomanHtml = qRoman ? `<div style="opacity:.7; font-size:15px; margin-top:6px;">${uiLang==="th" ? "คำอ่าน: " : "Umschrift: "}${escapeHtml(qRoman)}</div>` : "";

  const isThaiAnswer = (p.backLang==="Thai");
  const candidates = currentList.map(x => {
    const px = pair(x);
    return { val:px.back, roman:(px.backLang==="Thai" ? (px.backExtra||"") : ""), lang:px.backLang };
  }).filter(c => c.lang===p.backLang && (c.val||"").trim()!=="");

  const opts = [{ val:p.back, roman: isThaiAnswer ? (p.backExtra||"") : "" }];
  while(opts.length<4 && candidates.length){
    const r = candidates[Math.floor(Math.random()*candidates.length)];
    if(!opts.some(o => o.val===r.val)) opts.push({ val:r.val, roman:r.roman||"" });
  }
  opts.sort(()=>Math.random()-0.5);
  mcAnswer = { val:p.back, roman: isThaiAnswer ? (p.backExtra||"") : "" };

  const optsHtml = opts.map(o=>{
    const v=escapeHtml(o.val);
    const ro=escapeHtml(o.roman||"");
    if(isThaiAnswer && ro){
      return `<button class="mcBtn" data-val="${v}">
        <div style="font-size:20px; font-weight:700;">${v}</div>
        <div style="font-size:13px; opacity:.7; margin-top:2px;">${uiLang==="th" ? "คำอ่าน: " : "Umschrift: "}${ro}</div>
      </button>`;
    }
    return `<button class="mcBtn" data-val="${v}">${v}</button>`;
  }).join("");

  el.sub.innerHTML = qRomanHtml + optsHtml;
}

function flip(){ if(el.train.value!=="cards") return; flipped=!flipped; render(); }
function next(){ pickNext(true); }
function grade(kind){ if(!current) return; schedule(wordId(current), kind); pickNext(); }

// MC click handling with colours + stats + wrong list
el.sub.addEventListener("click", (e)=>{
  const btn = e.target.closest("button[data-val]");
  if(!btn) return;
  if(el.train.value!=="mc") return;
  if(mcLocked) return;

  mcLocked = true;
  const buttons = Array.from(el.sub.querySelectorAll("button[data-val]"));
  buttons.forEach(b => b.disabled = true);

  const chosenEsc = btn.getAttribute("data-val") || "";
  const correctEsc = escapeHtml(mcAnswer?.val || "");
  const ok = (chosenEsc === correctEsc);

  const st = getMcStats(activeDeck);
  st.total += 1;
  if(ok) st.correct += 1;
  saveMcStats();

  const green="#047857", red="#b91c1c";
  btn.style.background = ok ? green : red;
  btn.style.borderColor = ok ? green : red;
  btn.style.color = "#fff";

  if(!ok){
    const pw = pair(current);
    addMcWrong(activeDeck, {
      id: wordId(current),
      ts: Date.now(),
      q: pw.front,
      qLang: pw.frontLang,
      qRoman: (pw.frontLang==="Thai" ? (pw.frontExtra||"") : ""),
      correct: pw.back,
      correctRoman: (pw.backLang==="Thai" ? (pw.backExtra||"") : ""),
      chosen: unescapeHtml(chosenEsc)
    });

    const corrBtn = buttons.find(b => (b.getAttribute("data-val")||"") === correctEsc);
    if(corrBtn){
      corrBtn.style.background = green;
      corrBtn.style.borderColor = green;
      corrBtn.style.color = "#fff";
    }
  }

  updateTop();

  setTimeout(()=>{
    mcLocked = false;
    if(ok) grade("good");
    else grade("again");
  }, 900);
});

// Audio
function speak(text, lang){
  if(!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if(lang==="th") u.lang="th-TH";
  if(lang==="en") u.lang="en-US";
  if(lang==="de") u.lang="de-DE";
  window.speechSynthesis.speak(u);
}
function currentTexts(){
  if(!current) return null;
  const p = pair(current);
  const frontText = (el.train.value==="cards") ? (flipped ? p.back : p.front) : p.front;
  const backText  = (el.train.value==="cards") ? (flipped ? p.front : p.back) : p.back;
  const frontLang = (el.train.value==="cards") ? (flipped ? p.backLang : p.frontLang) : p.frontLang;
  const backLang  = (el.train.value==="cards") ? (flipped ? p.frontLang : p.backLang) : p.backLang;
  return { frontText, backText, frontLang, backLang };
}

el.speakFront.addEventListener("click", ()=>{
  const x=currentTexts(); if(!x) return;
  const lc = (x.frontLang==="Thai")?"th":(x.frontLang==="Englisch")?"en":"de";
  speak(x.frontText, lc);
});
el.speakBack.addEventListener("click", ()=>{
  const x=currentTexts(); if(!x) return;
  const lc = (x.backLang==="Thai")?"th":(x.backLang==="Englisch")?"en":"de";
  speak(x.backText, lc);
});

// CSV import/export
el.csvFile.addEventListener("change", (e)=>{
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = ()=>{
    const list = parseCsv(r.result);
    if(!list.length) return alert("Import fehlgeschlagen");
    decks.custom = list; saveCustom();
    activeDeck = "custom"; localStorage.setItem(K_ACTIVE_DECK, activeDeck);
    rebuildCurrentList(); pickNext(true); updateTop();
    alert(list.length + " Wörter importiert");
  };
  r.readAsText(file, "utf-8");
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
  a.href=url; a.download="thai_cards_"+activeDeck+".csv";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
el.exportCsv.addEventListener("click", ()=> exportCsv(currentList));

el.clearCustom.addEventListener("click", ()=>{
  if(activeDeck!=="custom") return alert("Bitte zuerst auf „Eigenes Set“ wechseln.");
  decks.custom = []; saveCustom();
  rebuildCurrentList(); pickNext(true); updateTop();
});

// Wrong list controls
el.clearWrong.addEventListener("click", ()=>{ clearMcWrong(activeDeck); updateTop(); });
el.learnWrong.addEventListener("click", ()=>{
  studyWrongOnly = !studyWrongOnly;
  localStorage.setItem(K_STUDY_WRONG_ONLY, studyWrongOnly ? "1" : "0");
  rebuildCurrentList(); pickNext(true); updateTop();
});

// UI controls
el.uiLang.value = uiLang;
el.uiLang.addEventListener("change", ()=>{
  uiLang = el.uiLang.value;
  localStorage.setItem(K_UI_LANG, uiLang);
  updateTop(); render();
});

el.deck.value = activeDeck;
el.deck.addEventListener("change", ()=>{
  activeDeck = el.deck.value;
  localStorage.setItem(K_ACTIVE_DECK, activeDeck);
  rebuildCurrentList(); pickNext(true); updateTop();
});

el.mode.addEventListener("change", ()=>{ flipped=false; render(); });
el.train.addEventListener("change", ()=>{ flipped=false; render(); });

el.card.addEventListener("click", ()=>{ if(el.train.value==="cards") flip(); });
el.flip.addEventListener("click", flip);
el.next.addEventListener("click", next);
el.again.addEventListener("click", ()=>grade("again"));
el.hard.addEventListener("click", ()=>grade("hard"));
el.good.addEventListener("click", ()=>grade("good"));

el.resetProgress.addEventListener("click", ()=>{
  progress = {}; saveProgress();
  resetMcStats(activeDeck);
  clearMcWrong(activeDeck);
  updateTop();
});

// PWA status
if(!("serviceWorker" in navigator)) el.pwaStatus.textContent = uiLang==="th" ? "ไม่รองรับ" : "nicht verfügbar";
else el.pwaStatus.textContent = uiLang==="th" ? "bereit" : "bereit";

window.addEventListener("online", updateTop);
window.addEventListener("offline", updateTop);

// Init
(async function init(){
  loadCustom();
  decks.a1 = await fetchCsv("./thai_cards_A1_200.csv");
  decks.alltag = await fetchCsv("./thai_cards_alltag_200.csv");
  rebuildCurrentList();
  pickNext(true);
  updateTop();
})();
