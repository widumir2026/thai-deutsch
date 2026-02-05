
// ===============================
// Thai Lernkarten – stabile Version
// CSV Import funktioniert garantiert
// ===============================

const words = [];

let idx = 0;
let flipped = false;

// ---------- DOM ----------
const el = {
  card: document.getElementById("card"),
  frontWord: document.getElementById("frontWord"),
  sub: document.getElementById("sub"),
  mode: document.getElementById("mode"),
  train: document.getElementById("train"),
  flip: document.getElementById("flip"),
  next: document.getElementById("next"),
  csvFile: document.getElementById("csvFile")
};

// ---------- Helpers ----------
function pair(w){
  const m = el.mode.value;

  if(m==="th-en") return [w.th, w.en];
  if(m==="th-de") return [w.th, w.de];
  if(m==="en-th") return [w.en, w.th];

  return [w.de, w.th];
}

function render(){
  if(!words.length){
    el.frontWord.textContent = "Keine Wörter geladen";
    el.sub.textContent = "";
    return;
  }

  const [front, back] = pair(words[idx]);

  if(el.train.value === "cards"){
    el.frontWord.textContent = flipped ? back : front;
    el.sub.textContent = flipped ? "" : (words[idx].roman || "");
    return;
  }

  // Multiple choice
  flipped = false;
  el.frontWord.textContent = front;

  const pool = words.map(w => pair(w)[1]);
  const opts = [back];

  while(opts.length < 4 && pool.length){
    const r = pool[Math.floor(Math.random()*pool.length)];
    if(!opts.includes(r)) opts.push(r);
  }

  opts.sort(()=>Math.random()-0.5);

  el.sub.innerHTML = opts.map(o =>
    `<button style="display:block;margin:6px 0;width:100%" onclick="pick('${o}')">${o}</button>`
  ).join("");
}

function flip(){
  flipped = !flipped;
  render();
}

function next(){
  idx = (idx+1) % words.length;
  flipped = false;
  render();
}

function pick(v){
  alert(v === pair(words[idx])[1] ? "Richtig" : "Falsch");
  next();
}

// ---------- CSV IMPORT (robust) ----------
el.csvFile.addEventListener("change", e => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const lines = reader.result.split(/\r?\n/).filter(l => l.trim());

    const newWords = [];

    for(const row of lines.slice(1)){
      const c = row.split(",");

      newWords.push({
        th: c[0] || "",
        roman: c[1] || "",
        en: c[2] || "",
        de: c[3] || ""
      });
    }

    words.length = 0;
    words.push(...newWords);

    idx = 0;
    flipped = false;

    alert(words.length + " Wörter importiert");

    render();
  };

  reader.readAsText(file, "utf-8");
});

// ---------- Events ----------
el.flip?.addEventListener("click", flip);
el.next?.addEventListener("click", next);
el.card?.addEventListener("click", flip);

// ---------- Init ----------
render();
