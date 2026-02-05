const words=[
{th:"สวัสดี",en:"hello",de:"hallo"},
{th:"ขอบคุณ",en:"thank you",de:"danke"},
{th:"กิน",en:"eat",de:"essen"},
{th:"ดื่ม",en:"drink",de:"trinken"},
{th:"น้ำ",en:"water",de:"wasser"}
];

let i=0,side=0,mcAnswer=null;
const card=document.getElementById("card");
const sub=document.getElementById("sub");
const modeSel=document.getElementById("mode");
const trainSel=document.getElementById("train");

function pair(w){
if(modeSel.value==="th-en")return[w.th,w.en];
if(modeSel.value==="th-de")return[w.th,w.de];
if(modeSel.value==="en-th")return[w.en,w.th];
return[w.de,w.th];
}

function showCard(){
const p=pair(words[i]);
card.textContent=side? p[1]:p[0];
sub.textContent="";
}

function next(){
i=(i+1)%words.length;
side=0;
if(trainSel.value==="cards")showCard();else showMC();
}

function flip(){
if(trainSel.value!=="cards")return;
side=1-side;showCard();
}

function showMC(){
const p=pair(words[i]);
const pool=words.map(w=>pair(w)[1]);
const opts=[p[1]];
while(opts.length<4){
const r=pool[Math.floor(Math.random()*pool.length)];
if(!opts.includes(r))opts.push(r);
}
opts.sort(()=>Math.random()-0.5);
card.innerHTML="<div>"+p[0]+"</div>"+opts.map(o=>"<div><button onclick='pick(""+o+"")'>"+o+"</button></div>").join("");
mcAnswer=p[1];
}

function pick(v){sub.textContent=v===mcAnswer?"Richtig":"Falsch";}

trainSel.onchange=()=>next();
modeSel.onchange=()=>next();
showCard();
