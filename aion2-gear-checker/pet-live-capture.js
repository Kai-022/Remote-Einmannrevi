/* Aion 2 Pet Spezieskenntnisse: optional guided game-window walkthrough.
   Explicit browser window-share permission; local OCR, no background uploading.
   A species turns green only after 9 distinct slot rows are mapped to one species.
   Partial or ambiguous reads wait for explicit review. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const api=window.aionPetOCR;
const panel=$('pet-screenshot'),upload=$('pet-ocr-upload'),read=$('pet-ocr-read'),preview=$('pet-ocr-canvas');
if(!panel||!upload||!read||!preview||!api)return;
const species=api.species.slice();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const section=document.createElement('section');
section.className='pet-live-capture';
section.style.cssText='border:1px solid #776344;border-radius:12px;padding:16px;margin:16px 0;background:#202c3a';
section.innerHTML=
 '<div class="eyebrow">BETA · PET-DURCHLAUF</div>'+
 '<h3 style="margin:6px 0">Einmal starten – durch die fünf Pets klicken</h3>'+
 '<p style="margin:8px 0">Gib das <b>Aion-2-Fenster</b> einmal frei. Öffne im Spiel die Spezieskenntnisse und klicke langsam durch die fünf Spezies (etwa 6–10 Sekunden je Ansicht). Der Scanner liest automatisch die freigeschalteten Talentwerte – ohne weitere Screenshots oder Knöpfe pro Pet.</p>'+
 '<div class="actions">'+
 '<button type="button" class="primary" id="pet-live-start">▶ Durchlauf starten · Fenster freigeben</button>'+
 '<button type="button" id="pet-live-pause" disabled>Automatik pausieren</button>'+
 '<button type="button" id="pet-live-scan" disabled>Einzelbild prüfen</button>'+
 '<button type="button" id="pet-live-stop" disabled>Freigabe beenden</button></div>'+
 '<div id="pet-live-status" role="status" aria-live="polite" style="margin:12px 0;font-size:13px">Noch nicht gestartet.</div>'+
 '<details id="pet-icon-mapping" style="margin:10px 0;border:1px solid #69778a;border-radius:8px;padding:9px"><summary>Einmalig: Die fünf Pet-Symbole von oben nach unten zuordnen</summary><p class="tip">Links im Spiel stehen fünf Symbole ohne Pet-Namen. Bitte die Zuordnung bestätigen, damit keine Werte beim falschen Pet landen.</p><div id="pet-icon-map-fields" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px"></div><button type="button" id="pet-icon-map-save" style="margin-top:9px">Zuordnung bestätigen</button></details>'+
 '<div id="pet-live-progress" role="group" aria-label="Fortschritt der fünf Pet-Spezies" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px;margin-top:12px"></div>'+
 '<p id="pet-live-result" class="tip" aria-live="polite"></p>'+
 '<details style="margin:12px 0"><summary>Erkennungsbild anzeigen (Fehlersuche)</summary><p style="font-size:12px">Hier siehst du, welchen Ausschnitt der Scanner tatsächlich liest. Bleibt er leer, konnte die rechte Werteliste nicht gefunden werden.</p><canvas id="pet-live-preview" style="display:block;max-width:100%;max-height:450px;object-fit:contain;border:1px solid #50647a" aria-label="Zuletzt erkannter Pet-Wertebereich"></canvas></details>'+
 '<details style="margin-top:12px"><summary>Hinweise und Fehlerbehebung</summary>'+
 '<p>Nutze Chrome oder Edge mit Aion 2 im randlosen Fenstermodus. Der Browser verlangt ausdrücklich die Auswahl eines Fensters; diese Sicherheitsabfrage lässt sich nicht umgehen. Wähle Aion 2 statt des Browser-Tabs. Die Erkennung ist noch ein Test: Wenn eine Spezies oder ein Slot nicht eindeutig ist, wird nichts automatisch überschrieben. Du kannst einen unsicheren Treffer später im Formular prüfen.</p></details>';
panel.querySelector('h2')?.insertAdjacentElement('afterend',section);
const start=$('pet-live-start'),pause=$('pet-live-pause'),single=$('pet-live-scan'),stop=$('pet-live-stop'),message=$('pet-live-status'),progress=$('pet-live-progress'),result=$('pet-live-result');
const video=document.createElement('video');
video.muted=true;video.playsInline=true;video.autoplay=true;
let stream=null,worker=null,watching=false,processing=false,opening=false,generation=0,timer=null,seenText='',lastError='',reviewQueue=new Map();
const mapKey='aion2-pet-icon-order-v1';
let confirmedMap=null;
try{const saved=JSON.parse(localStorage.getItem(mapKey)||'null');if(Array.isArray(saved)&&saved.length===5&&new Set(saved).size===5&&saved.every(x=>species.includes(x)))confirmedMap=saved;}catch{}
const fields=$('pet-icon-map-fields');
fields.innerHTML=species.map((s,i)=>'<label style="font-size:12px">Symbol '+(i+1)+' (oben nach unten)<select data-map-index="'+i+'" style="padding:7px;margin-top:5px">'+species.map(v=>'<option value="'+esc(v)+'"'+(v===(confirmedMap?.[i]||s)?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>').join('');
$('pet-icon-map-save').addEventListener('click',()=>{
 const vals=[...fields.querySelectorAll('select')].map(x=>x.value);
 if(vals.length!==5||new Set(vals).size!==5){status('Bitte jedes Pet nur einem Symbol zuordnen.',true);return;}
 confirmedMap=vals;
 try{localStorage.setItem(mapKey,JSON.stringify(vals))}catch{}
 $('pet-icon-mapping').open=false;
 status('Pet-Reihenfolge bestätigt. Jetzt können erkannte Symbole automatisch zugeordnet werden.');
 drawProgress();
});
function status(s,error=false){message.textContent=s;message.style.color=error?'#ffaeb7':'#d6e0eb';}
function active(){return !!stream&&stream.getVideoTracks().some(t=>t.readyState==='live');}
function controls(){
 const on=active();
 start.disabled=opening||on;pause.disabled=!on;single.disabled=!on||processing;
 stop.disabled=!on;
 pause.textContent=watching?'Automatik pausieren':'Automatik fortsetzen';
}
function readState(){
 try{
  const state=JSON.parse(localStorage.getItem(api.getPetKey())||'{}');
  return state&&typeof state==='object'?state:{};
 }catch{return {};}
}
function drawProgress(){
 const saved=readState();
 const marks=saved.scanned&&typeof saved.scanned==='object'?saved.scanned:{};
 const count=species.filter(name=>Array.isArray(marks[name]?.rolls)&&marks[name].rolls.length===(marks[name].slots||9)).length;
 progress.innerHTML=species.map(name=>{
  const success=Array.isArray(marks[name]?.rolls)&&marks[name].rolls.length===(marks[name].slots||9);
  const pending=reviewQueue.has(name);
  const border=success?'#388c68':pending?'#b99a53':'#485767';
  const bg=success?'#173e30':pending?'#463a22':'#121c2c';
  const words=success?'🟢 '+marks[name].rolls.length+'/'+(marks[name].slots||9)+' erkannt':pending?'🟡 Bitte prüfen':'⚪ Noch offen';
  const rows=success?'<details style="margin-top:5px"><summary style="font-size:11px">Werte anzeigen</summary><div style="font-size:11px;line-height:1.65">'+marks[name].rolls.map((roll,i)=>esc(String(i+1)+'. '+roll+' '+(marks[name].values?.[i]||''))).join('<br>')+'</div></details>':
   pending?'<div style="font-size:11px;line-height:1.6;margin-top:5px">'+reviewQueue.get(name).lines.map(l=>'<div style="color:#81d6ac">✓ Slot '+esc(l.slot||'?')+': '+esc(l.name)+(l.value?' '+esc(l.value):'')+'</div>').join('')+'</div>':'';
  const btn=pending?'<button type="button" data-pet-review="'+esc(name)+'" style="width:100%;margin-top:5px;padding:6px">Prüfen</button>':'';
  return '<div style="border:1px solid '+border+';border-radius:9px;padding:9px;background:'+bg+'"><b>'+esc(name)+'</b><div style="font-size:12px">'+words+'</div>'+rows+btn+'</div>';
 }).join('');
 result.textContent=count+' von 5 Spezies vollständig erkannt. Grün bedeutet „ausgelesen“, nicht „bester Talentwert“. '+(!confirmedMap?'Bitte die Symbol-Reihenfolge einmalig bestätigen.':'Die BiS-Wertungen stehen darunter.');
}
section.addEventListener('click',e=>{
 const btn=e.target.closest('[data-pet-review]');if(!btn)return;
 const name=btn.dataset.petReview;
 const review=reviewQueue.get(name);if(!review)return;
 api.review(name,review.lines,review.raw);
 status(name+': Bitte erkannte Werte und Slotnummern im Formular prüfen und speichern.');
});
window.addEventListener('aion2:pets-updated',drawProgress);
drawProgress();
function schedule(delay=2000){
 if(timer!==null)clearTimeout(timer);
 if(!watching||!active())return;
 timer=setTimeout(()=>{timer=null;void runAuto();},delay);
}
async function disposeWorker(){
 if(!worker)return;
 const old=worker;worker=null;try{await old.terminate()}catch{}
}
function endShare(s){
 generation++;watching=false;
 if(timer!==null){clearTimeout(timer);timer=null;}
 const current=stream;stream=null;
 if(current)current.getTracks().forEach(t=>t.stop());
 video.pause();video.srcObject=null;
 if(!processing)void disposeWorker();
 status(s||'Fensterfreigabe beendet. Die erfassten Daten bleiben gespeichert.');
 controls();
}
async function ensureWorker(){
 if(worker)return worker;
 const Tess=await api.loadOCR();
 worker=await Tess.createWorker('deu+eng',1,{
  logger:m=>{if(m.status==='recognizing text'&&watching)
    status('Spezieskenntnisse werden gelesen: '+Math.round((m.progress||0)*100)+' %');}
 });
 return worker;
}
function frameCanvas(){
 if(!active()||!video.videoWidth||!video.videoHeight||video.readyState<2)
   throw Error('Das Spiel-Fenster liefert noch kein Bild.');
 const scale=Math.min(1,1600/video.videoWidth,1050/video.videoHeight);
 const c=document.createElement('canvas');
 c.width=Math.max(1,Math.round(video.videoWidth*scale));
 c.height=Math.max(1,Math.round(video.videoHeight*scale));
 const ctx=c.getContext('2d',{willReadFrequently:true});
 if(!ctx)throw Error('Der Browser kann keine Bildschirmbilder auslesen.');
 ctx.drawImage(video,0,0,c.width,c.height);
 return c;
}
function avgConfidence(lines){
 return lines.length?lines.reduce((sum,l)=>sum+(Number(l.confidence)||0),0)/lines.length:0;
}
async function runAuto(){
 if(!watching||!active()||processing)return;
 processing=true;controls();const token=generation;
 try{
  const frame=frameCanvas();
  if(!worker)status('OCR wird vorbereitet. Beim ersten Mal werden Sprachdateien heruntergeladen – das kann etwas dauern.');
  const runningWorker=await ensureWorker();
  if(token!==generation||!watching)return;
  const focused=await api.recognizeImage(runningWorker,frame);
  if(!focused){status('Die rechte Spezieskenntnis-Liste ist im freigegebenen Bild nicht zu finden. Aion 2 öffnen, Pet → Spezieskenntnis wählen, randlosen Fenstermodus testen.');return;}
  if(focused.preview){const output=$('pet-live-preview');output.width=focused.preview.width;output.height=focused.preview.height;output.getContext('2d')?.drawImage(focused.preview,0,0);}
  const response=null;
  if(token!==generation||!watching)return;
  const raw=focused.raw;
  const textGenus=api.speciesFromText(raw);
  const mappedGenus=focused?.active&&confirmedMap?confirmedMap[focused.active-1]:null;
  const genus=textGenus&&mappedGenus&&textGenus!==mappedGenus?null:(textGenus||mappedGenus);
  const lines=focused.found;
  const expected=9;
  const hash=(focused.active||'?')+'|'+genus+'|'+lines.map(x=>x.slot+':'+x.name+':'+(x.value||'')).join('|');
  if(hash===seenText){status('Fensterfreigabe aktiv – auf die nächste Pet-Ansicht warten …');return}
  seenText=hash;
  if(!lines.length){status('Noch keine Talente sichtbar. Öffne im Spiel die Spezieskenntnisse und halte die Ansicht kurz ruhig.');return}
  if(!genus){
   reviewQueue.set('unassigned',{lines,raw});
   status(lines.length+' Werte erkannt'+(focused?.active?' (Symbol '+focused.active+')':'')+', aber die Spezies ist nicht sicher zugeordnet. Bitte erst die Symbol-Reihenfolge bestätigen oder manuell prüfen.');
   // Include explicit manual fallback without automatically guessing a genus.
   result.innerHTML='Unzugeordnet: '+lines.length+' Wert(e). <button type="button" data-pet-review="unassigned" style="padding:5px;margin-left:6px">Manuell zuordnen</button>';
   return;
  }
  if(!expected||lines.length!==expected || avgConfidence(lines)<48){
   reviewQueue.set(genus,{lines,raw});
   status(genus+': '+lines.length+'/'+(expected||'?')+' freigeschaltete Talentwerte erkannt. Bitte etwas länger anzeigen oder später prüfen.');
   drawProgress();return;
  }
  // Only one genus and all unlocked high-confidence rows may be saved.
  if(api.storeCompleteSpecies(genus,lines,expected)){
   reviewQueue.delete(genus);
   drawProgress();
   status('✓ '+genus+' vollständig erkannt und gespeichert ('+lines.length+'/'+expected+'). Du kannst jetzt zum nächsten Pet wechseln.');
   seenText=hash;
   if(species.every(name=>{const mark=readState().scanned?.[name];return Array.isArray(mark?.rolls)&&mark.rolls.length===(mark.slots||9)})){
    watching=false;status('✓ Alle fünf Pet-Spezies erfasst! Du kannst die Fensterfreigabe jetzt beenden.');controls();
   }
  }
 }catch(e){
  const why=String(e?.message||e);
  if(why!==lastError){lastError=why;status('Automatisches Lesen fehlgeschlagen: '+why,true);}
 }finally{
  processing=false;controls();if(!active())void disposeWorker();
  if(watching)schedule(2600);
 }
}
start.addEventListener('click',async()=>{
 if(!window.isSecureContext||!navigator.mediaDevices?.getDisplayMedia){
  status('Fensterfreigabe wird hier nicht unterstützt. Nutze Chrome oder Edge über HTTPS oder lade einen Screenshot hoch.',true);return;
 }
 opening=true;controls();
 try{
  const chosen=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:5},audio:false});
  endShare('');
  stream=chosen;generation++;watching=true;seenText='';lastError='';
  chosen.getVideoTracks()[0]?.addEventListener('ended',()=>{
   if(stream===chosen)endShare('Die Fensterfreigabe wurde beendet.');
  },{once:true});
  video.srcObject=chosen;await video.play();
  const surface=chosen.getVideoTracks()[0]?.getSettings?.().displaySurface;
  if(surface==='browser')status('Du hast einen Browser-Tab freigegeben. Für die Pet-Erkennung bitte die Freigabe beenden und das Aion-2-Fenster wählen.',true);
  else status('Durchlauf läuft. Klicke jetzt im Spiel langsam durch Cogni, Fera, Natura, Varian und Spezial.');
  schedule(2200);
 }catch(e){
  endShare(e?.name==='NotAllowedError'||e?.name==='AbortError'?
   'Fensterfreigabe abgebrochen. Du kannst jederzeit erneut starten.':
   'Fensterfreigabe nicht möglich: '+String(e?.message||e));
 }finally{opening=false;controls()}
});
pause.addEventListener('click',()=>{
 if(!active())return;
 watching=!watching;
 if(!watching&&timer!==null){clearTimeout(timer);timer=null;}
 if(watching){seenText='';status('Durchlauf fortgesetzt. Lass die nächste Pet-Ansicht einige Sekunden geöffnet.');schedule(400);}
 else status('Durchlauf pausiert. Die Fensterfreigabe ist noch aktiv.');
 controls();
});
async function oneFrame(){
 const c=frameCanvas();
 let blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
 let ext='png';
 if(blob&&blob.size>16e6){blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.88));ext='jpg'}
 if(!blob||blob.size>16e6)throw Error('Bild zu groß.');
 return new File([blob],'aion2-pet.'+ext,{type:blob.type});
}
single.addEventListener('click',async()=>{
 if(!active())return;
 watching=false;
 if(timer!==null){clearTimeout(timer);timer=null;}
 processing=true;controls();
 try{
  const file=await oneFrame();
  read.disabled=true;
  preview.style.display='none';
  const dt=new DataTransfer();dt.items.add(file);
  upload.value='';upload.files=dt.files;
  upload.dispatchEvent(new Event('change',{bubbles:true}));
  // Wait for the existing image loader to prepare the canvas before OCR is called.
  let attempts=0;
  while((read.disabled||preview.style.display==='none')&&attempts++<120)
   await new Promise(resolve=>setTimeout(resolve,100));
  if(read.disabled)throw Error('Das Spielbild konnte nicht geladen werden.');
  read.click();
  status('Einzelbild erfasst. Die OCR-Auswertung erscheint weiter unten; prüfe dort die Slots.');
 }catch(e){status('Einzelbild fehlgeschlagen: '+String(e?.message||e),true)}
 finally{processing=false;controls();}
});
stop.addEventListener('click',()=>endShare());
window.addEventListener('pagehide',()=>endShare());
status('Bereit. Klicke „Durchlauf starten“ und erlaube die Freigabe des Aion-2-Fensters.');
})();