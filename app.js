
/* Minimal stabiler MC-Fix:
   Problem: Buttons waren im Card-Container + global click/disable -> blockiert.
   Lösung:
   - eigene MC-Container-Div
   - kein pointer-events Konflikt
   - kein disable aller Buttons
*/

// === PATCH nur fuer MC-Handling ===

document.addEventListener("DOMContentLoaded", ()=>{

  const sub = document.getElementById("sub");
  if(!sub) return;

  // verhindert dass Card-Click (flip) MC blockiert
  sub.addEventListener("click", e=>e.stopPropagation(), true);

});

// VERSION 2026-02-06
