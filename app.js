const STORAGE_UI_LANG = "thai_cards_ui_lang";
let uiLang = localStorage.getItem(STORAGE_UI_LANG) || "de";

const I18N = {
  app_title: { de: "Thai Lernkarten", th: "บัตรคำภาษาไทย" },

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
  btn_reset: { de: "Reset Lernen", th: "เริ่มใหม่" },

  hint_tap: { de: "Tippen zum Umdrehen", th: "แตะเพื่อพลิก" },

  panel_words_title: { de: "Wortliste", th: "รายการคำ" },
  csv_hint: {
    de: "CSV Import: Spalten th, roman, en, de (cat optional). UTF-8.",
    th: "นำเข้า CSV: คอลัมน์ th, roman, en, de (cat ไม่บังคับ). UTF-8."
  },
  btn_export_csv: { de: "Export CSV", th: "ส่งออก CSV" },
  btn_clear_words: { de: "Wortliste löschen", th: "ลบรายการคำ" },

  panel_pwa_title: { de: "Installieren (PWA)", th: "ติดตั้ง (PWA)" },
  pwa_hint: {
    de: "iPhone: Safari → Teilen → „Zum Home-Bildschirm“. Android/Chrome: „Installieren“. Offline nach erstem Laden.",
    th: "iPhone: Safari → แชร์ → „เพิ่มไปยังหน้าจอโฮม“. Android/Chrome: „ติดตั้ง“. ออฟไลน์หลังโหลดครั้งแรก."
  },
  pwa_status_label: { de: "Status:", th: "สถานะ:" }
};

function t(key){
  const x = I18N[key];
  if(!x) return key;
  return (uiLang==="th") ? x.th : x.de;
}

function applyI18n(){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-opt]").forEach(el=>{
    el.textContent = t(el.getAttribute("data-i18n-opt"));
  });
}

const words = [
  { th:"สวัสดี", roman:"sawatdee", en:"hello", de:"hallo" },
  { th:"ขอบคุณ", roman:"khop khun", en:"thank you", de:"danke" },
  { th:"ไป", roman:"bpai", en:"go", de:"gehen" },
  { th:"กิน", roman:"gin", en:"eat", de:"essen" },
  { th:"น้ำ", roman:"nam", en:"water", de:"wasser" },
];

let idx = 0;
let flipped = false;
let mcAnswer = null;

const el = {
  uiLang: document.getElementById("uiLang"),
  mode: document.getElementById("mode"),
  train: document.getElementById("train"),
  stats: document.getElementById("stats"),
  net: document.getElementById("net"),
  card: document.getElementById("card"),
  frontLang: document.getElementById("frontLang"),
  frontWord: document.getElementById("frontWord"),
  sub: document.getElementById("sub"),
  pwaStatus: document.getElementById("pwaStatus"),
  flip: document.getElementById("flip"),
  again: document.getElementById("again"),
  hard: document.getElementById("hard"),
  good: document.getElementById("good"),
  next: document.getElementById("next"),
  speakFront: document.getElementById("speakFront"),
  speakBack: document.getElementById("speakBack"),
  reset: document.getElementById("reset"),
  exportCsv: document.getElementById("exportCsv"),
  clearWords: document.getElementById("clearWords"),
};

function pair(w){
  const m = el.mode.value;
  if(m==="th-en") return { frontLang:"Thai", front:w.th, frontExtra:(w.roman||""), backLang:"Englisch", back:w.en };
  if(m==="th-de") return { frontLang:"Thai", front:w.th, frontExtra:(w.roman||""), backLang:"Deutsch", back:w.de };
  if(m==="en-th") return { frontLang:"Englisch", front:w.en, frontExtra:"", backLang:"Thai", back:w.th, backExtra:(w.roman||"") };
  return { frontLang:"Deutsch", front:w.de, frontExtra:"", backLang:"Thai", back:w.th, backExtra:(w.roman||"") };
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
  const w = words[idx];
  const p = pair(w);

  el.net.textContent = navigator.onLine ? (uiLang==="th" ? "ออนไลน์" : "online") : (uiLang==="th" ? "ออฟไลน์" : "offline");
  el.stats.textContent = (uiLang==="th" ? "คำ" : "Wort") + " " + (idx+1) + "/" + words.length;

  if(el.train.value==="cards"){
    el.frontLang.textContent = flipped ? langLabel(p.backLang) : langLabel(p.frontLang);
    el.frontWord.textContent = flipped ? p.back : p.front;

    const extra = flipped ? (p.backExtra||"") : (p.frontExtra||"");
    const whichLang = flipped ? p.backLang : p.frontLang;
    el.sub.textContent = (extra && whichLang==="Thai") ? ((uiLang==="th" ? "คำอ่าน: " : "Umschrift: ") + extra) : "";
    mcAnswer = null;
    return;
  }

  flipped = false;
  el.frontLang.textContent = langLabel(p.frontLang);
  el.frontWord.textContent = p.front;

  const pool = words.map(x => pair(x).back);
  const opts = [p.back];
  while(opts.length<4){
    const r = pool[Math.floor(Math.random()*pool.length)];
    if(!opts.includes(r)) opts.push(r);
  }
  opts.sort(()=>Math.random()-0.5);
  mcAnswer = p.back;

  const btnHtml = opts.map(o => {
    const safe = o.replaceAll('"','&quot;');
    return `<div style="margin:8px 0; width:100%; max-width:760px;">
      <button style="width:100%; text-align:left;" onclick="pickMC(\"${safe}\")">${o}</button>
    </div>`;
  }).join("");

  el.sub.innerHTML = btnHtml;
}

function flip(){
  if(el.train.value!=="cards") return;
  flipped = !flipped;
  render();
}

function next(){
  idx = (idx+1) % words.length;
  flipped = false;
  render();
}

function pickMC(val){
  const ok = (val === mcAnswer);
  const msg = ok ? (uiLang==="th" ? "ถูกต้อง" : "Richtig") : (uiLang==="th" ? "ผิด" : "Falsch");
  el.sub.insertAdjacentHTML("beforeend", `<div style="margin-top:10px; font-weight:700;">${msg}</div>`);
}

function resetLearning(){
  idx = 0;
  flipped = false;
  render();
}

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
  const w = words[idx];
  const p = pair(w);
  const frontText = (el.train.value==="cards") ? (flipped ? p.back : p.front) : p.front;
  const backText = (el.train.value==="cards") ? (flipped ? p.front : p.back) : p.back;
  const frontLang = (el.train.value==="cards") ? (flipped ? p.backLang : p.frontLang) : p.frontLang;
  const backLang = (el.train.value==="cards") ? (flipped ? p.frontLang : p.backLang) : p.backLang;
  return { frontText, backText, frontLang, backLang };
}

function initPwaStatus(){
  if(!("serviceWorker" in navigator)){
    el.pwaStatus.textContent = uiLang==="th" ? "ไม่รองรับ" : "nicht verfügbar";
    return;
  }
  el.pwaStatus.textContent = uiLang==="th" ? "ใช้งาน" : "aktiv";
}

function exportCsv(){
  const rows = [["th","roman","en","de"]].concat(words.map(w=>[w.th,w.roman||"",w.en||"",w.de||""]));
  const csv = rows.map(r=>r.map(v=>{
    const s = (v??"").toString();
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download="thai_cards.csv";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

el.uiLang.value = uiLang;
el.uiLang.addEventListener("change", ()=>{
  uiLang = el.uiLang.value;
  localStorage.setItem(STORAGE_UI_LANG, uiLang);
  applyI18n();
  initPwaStatus();
  render();
});

el.mode.addEventListener("change", ()=>{ flipped=false; render(); });
el.train.addEventListener("change", ()=>{ flipped=false; render(); });

el.card.addEventListener("click", ()=>{ if(el.train.value==="cards") flip(); });

el.flip.addEventListener("click", flip);
el.next.addEventListener("click", next);
el.reset.addEventListener("click", resetLearning);

el.again.addEventListener("click", next);
el.hard.addEventListener("click", next);
el.good.addEventListener("click", next);

el.speakFront.addEventListener("click", ()=>{
  const x=currentTexts();
  const lc = (x.frontLang==="Thai")?"th":(x.frontLang==="Englisch")?"en":"de";
  speak(x.frontText, lc);
});
el.speakBack.addEventListener("click", ()=>{
  const x=currentTexts();
  const lc = (x.backLang==="Thai")?"th":(x.backLang==="Englisch")?"en":"de";
  speak(x.backText, lc);
});

el.exportCsv.addEventListener("click", exportCsv);
el.clearWords.addEventListener("click", ()=>{
  alert(uiLang==="th" ? "ยังไม่รองรับ" : "Noch nicht implementiert.");
});

applyI18n();
initPwaStatus();
render();
