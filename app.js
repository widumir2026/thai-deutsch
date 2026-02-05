// DIAGNOSTIK-BUILD (zeigt Fehler direkt in der UI)
const VERSION = "diag-2026-02-05-1";

function $(id){ return document.getElementById(id); }

function showFatal(msg, err){
  console.error(msg, err);
  const fw = $("frontWord");
  const sub = $("sub");
  const fl = $("frontLang");
  if(fl) fl.textContent = "ERROR";
  if(fw) fw.textContent = msg;
  if(sub) sub.textContent = String(err || "");
  alert(msg);
}

try{
  const needed = ["deck","mode","train","card","frontLang","frontWord","sub","flip","again","hard","good","next","csvFile","deckPill","statsPill","netPill","deckInfo","resetProgress"];
  const missing = needed.filter(id => !$(id));
  if(missing.length){
    showFatal("HTML IDs fehlen: " + missing.join(", "), "");
    throw new Error("Missing DOM");
  }

  // simple banner to confirm correct JS is loaded
  $("netPill").textContent = "JS: " + VERSION;

  // minimal safe state just to verify Thai+Roman everywhere rendering logic
  const words = [
    { th:"ลดราคา", roman:"lot rakhaa", en:"discount", de:"Rabatt", cat:"A1" },
    { th:"ข้างหลัง", roman:"khang lang", en:"behind", de:"hinten", cat:"A1" }
  ];

  let currentList = words;
  let current = words[0];
  let flipped = false;

  function pair(w){
    const m = $("mode").value;
    if(m==="th-en") return { frontLang:"Thai", front:w.th, frontExtra:w.roman||"", backLang:"Englisch", back:w.en, backExtra:"" };
    if(m==="th-de") return { frontLang:"Thai", front:w.th, frontExtra:w.roman||"", backLang:"Deutsch", back:w.de, backExtra:"" };
    if(m==="en-th") return { frontLang:"Englisch", front:w.en, frontExtra:"", backLang:"Thai", back:w.th, backExtra:w.roman||"" };
    return { frontLang:"Deutsch", front:w.de, frontExtra:"", backLang:"Thai", back:w.th, backExtra:w.roman||"" };
  }

  function render(){
    const p = pair(current);
    const train = $("train").value;

    if(train==="cards"){
      const whichLang = flipped ? p.backLang : p.frontLang;
      $("frontLang").textContent = whichLang;
      $("frontWord").textContent = flipped ? p.back : p.front;

      const extra = flipped ? (p.backExtra||"") : (p.frontExtra||"");
      if(whichLang==="Thai" && extra){
        $("sub").textContent = "Umschrift: " + extra;
      } else {
        $("sub").textContent = "";
      }
      return;
    }

    // MC: show roman if Thai question
    $("frontLang").textContent = p.frontLang;
    $("frontWord").textContent = p.front;

    const qRoman = (p.frontLang==="Thai" && p.frontExtra) ? p.frontExtra : "";
    const qRomanHtml = qRoman ? `<div style="opacity:.7;font-size:15px;margin-top:6px;">Umschrift: ${qRoman}</div>` : "";

    const isThaiAnswer = (p.backLang==="Thai");
    const opts = [
      { val:p.back, roman: isThaiAnswer ? p.backExtra : "" },
      { val:"Dummy1", roman:"" },
      { val:"Dummy2", roman:"" },
      { val:"Dummy3", roman:"" }
    ];

    const optsHtml = opts.map(o=>{
      if(isThaiAnswer && o.roman){
        return `<button class="mcBtn" style="width:100%;margin:6px 0;" data-val="${o.val}"><div style="font-size:20px;font-weight:700;">${o.val}</div><div style="font-size:13px;opacity:.7;">Umschrift: ${o.roman}</div></button>`;
      }
      return `<button class="mcBtn" style="width:100%;margin:6px 0;" data-val="${o.val}">${o.val}</button>`;
    }).join("");

    $("sub").innerHTML = qRomanHtml + optsHtml;
  }

  function next(){
    current = currentList[(currentList.indexOf(current)+1)%currentList.length];
    flipped = false;
    render();
  }

  $("flip").addEventListener("click", ()=>{ flipped=!flipped; render(); });
  $("next").addEventListener("click", next);
  $("card").addEventListener("click", ()=>{ flipped=!flipped; render(); });
  $("mode").addEventListener("change", ()=>{ flipped=false; render(); });
  $("train").addEventListener("change", ()=>{ flipped=false; render(); });

  render();
}catch(e){
  showFatal("JS Crash", e);
}
