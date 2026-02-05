
// ===============================
// Thai Lernkarten – Layout + CSV Import + UI Sprache Umschalter
// ===============================

const STORAGE_UI_LANG = "thai_cards_ui_lang";
let uiLang = localStorage.getItem(STORAGE_UI_LANG) || "de";

// ---------- i18n ----------
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
  btn_reset: { de: "Reset Lernen", th: "เริ่มใหม่" },

  imported: { de: "Wörter importiert", th: "นำเข้าคำแล้ว" }
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

// ---------- Demo Wörter (werden durch CSV ersetzt) ----------
const words = [
  { th:"สวัสดี", roman:"sawatdee", en:"hello", de:"hallo" },
  { th:"ขอบคุณ", roman:"khop khun", en:"thank you", de:"danke" }
];

let idx = 0;
let flipped = false;
let mcAnswer = null;

// ---------- DOM ----------
const el = {
  uiLang: document.getElementById("uiLang"),
  mode: document.getElementById("mode"),
  train: document.getElementById("train"),
  card: document.getElementById("card"),
  frontLang: document.getElementById("frontLang"),
  frontWord: document.getElementById("frontWord"),
  sub: document.getElementById("sub"),
  flip: document.getElementById("flip"),
  next: document.getElementById("next"),
  reset: document.getElementById("reset"),
  csvFile: document.getElementById("csvFile")
};

// ---------- Logik ----------
function pair(w){
  const m = el.mode.value;
  if(m==="th-en") return [w.th, w.en];
  if(m==="th-de") return [w.th, w.de];
  if(m==="en-th") return [w.en, w.th];
  return [w.de, w.th];
}

function render(){
  if(words.length===0) return;

  const [front, back] = pair(words[idx]);

  if(el.train.value==="cards"){
    el.frontWord.textContent = flipped ? back : front;
    el.sub.textContent = flipped ? "" : (words[idx].roman || "");
    return;
  }

  // Multiple choice
  flipped = false;
  el.frontWord.textContent = front;

  const pool = words.map(w => pair(w)[1]);
  const opts = [back];

  while(opts.length<4 && pool.length>0){
    const r = pool[Math.floor(Math.random()*pool.length)];
    if(!opts.includes(r)) opts.push(r);
  }

  opts.sort(()=>Math.random()-0.5);
  mcAnswer = back;

  el.sub.innerHTML = opts.map(o =>
    `<button style="margin:6px 0;width:100%" onclick="pickMC('${o}')">${o}</button>`
  ).join("");
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

function pickMC(v){
  const ok = v === mcAnswer;
  alert(ok ? "OK" : "Falsch");
  next();
}

// ---------- CSV IMPORT (ECHT) ----------
el.csvFile?.addEventListener("change", e => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const text = reader.result;

    const rows = text.split(/\r?\n/).filter(r => r.trim());
    if(rows.length <= 1) return;

    words.length = 0; // alte Wörter löschen

    for(const row of rows.slice(1)){
      const cols = row.split(",");

      words.push({
        th: cols[0] || "",
        roman: cols[1] || "",
        en: cols[2] || "",
        de: cols[3] || ""
      });
    }

    idx = 0;
    flipped = false;

    alert(words.length + " " + t("imported"));
    render();
  };

  reader.readAsText(file, "utf-8");
});

// ---------- Events ----------
el.flip?.addEventListener("click", flip);
el.next?.addEventListener("click", next);
el.reset?.addEventListener("click", ()=>{ idx=0; render(); });

el.uiLang?.addEventListener("change", ()=>{
  uiLang = el.uiLang.value;
  localStorage.setItem(STORAGE_UI_LANG, uiLang);
  applyI18n();
});

// ---------- Init ----------
applyI18n();
render();
