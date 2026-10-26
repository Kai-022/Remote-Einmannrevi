/* Pet Genus Insight screenshot OCR — experimental client-side import.
 * No screenshot is uploaded by this code. Tesseract language packs load from a CDN.
 * Proposed rolls must be confirmed before they change local data.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=$('pet-list');if(!list)return;
const species=['Cogni','Fera','Natura','Varian','Spezial'];
const lexicon=[
 ['PvE-Schadensverstärkung',[/p\s*v\s*e.{0,6}schaden.{0,10}verst/i,/pve.{0,8}damage.{0,8}(boost|ampl)/i]],
 ['PvE-Schadensresistenz',[/p\s*v\s*e.{0,7}schaden.{0,12}(resist|widerstand)/i,/pve.{0,10}damage.{0,8}resist/i]],
 ['Waffenschadensverstärkung',[/waffen.{0,5}schaden.{0,12}verst/i,/weapon.{0,8}damage.{0,8}(boost|ampl)/i]],
 ['Kritische Schadensverstärkung',[/krit.{0,9}schaden.{0,12}verst/i,/crit.{0,8}damage.{0,8}(boost|ampl)/i]],
 ['Schadensverstärkung',[/schaden.{0,10}verst/i,/damage.{0,8}(boost|ampl)/i]],
 ['Schadensresistenz',[/schaden.{0,12}(resist|widerstand)/i,/damage.{0,8}resist/i]],
 ['Zusatzangriffskraft',[/zusatz.{0,5}angriffs?kraf/i,/additional.{0,8}attack/i,/bonus attack power/i]],
 ['Max. Angriffskraft',[/max.{0,6}angriffs?kraf/i,/maximum attack/i]],
 ['Zusatzangriff',[/zusatz.{0,6}angriff/i,/bonus attack/i]],
 ['Zusatzpräzision',[/zusatz.{0,7}pr[aä]zision/i,/bonus accuracy/i]],
 ['Kritischer Treffer',[/krit.{0,12}treffer/i,/critical hit/i,/critical strike/i]],
 ['Rückangriffsschaden',[/r[uü]ck.{0,8}angriff.{0,10}schaden/i,/back attack.{0,8}damage/i]],
 ['Mehrfachtreffer',[/mehrfach.{0,6}treffer/i,/multi.{0,3}hit/i]],
 ['PvE-Verteidigung',[/p\s*v\s*e.{0,6}verteid/i,/pve.{0,6}defen/i]],
 ['Allgemeine Schadensresistenz',[/allgemein.{0,8}schaden.{0,8}resist/i]],
 ['Angriffserhöhung',[/angriffs?erh[oö]hung/i]],
 ['LP %',[/\bl\s*p\b.{0,10}%/i,/max.{0,5}h\s*p/i,/hp.{0,5}%/i]],
 ['Wucht',[/\bwucht\b/i,/\bsmash\b/i]],
 ['Perfektion',[/\bperfektion\b/i,/\bperfection\b/i]],
 ['Kampftempo',[/kampf.{0,6}tempo/i,/attack speed/i]],
 ['Angriff',[/\bangriff\b/i,/\battack\b/i]],
 ['Präzision',[/pr[aä]zision/i,/accuracy/i]],
 ['Vitalität',[/vitalit[aä]t/i,/vitality/i]],
 ['Blocken',[/blocken/i,/block/i]],
 ['Bewegungstempo',[/bewegungstempo/i,/movement speed/i]],
 ['Verteidigung',[/verteidigung/i,/defen[cs]e/i]],
 ['Lebenspunkte',[/lebenspunkte/i,/hit points/i]]
];
const panel=document.createElement('section');
panel.id='pet-screenshot';panel.className='panel';
panel.innerHTML='<div class="eyebrow">BETA · SPIELBILD ODER SCREENSHOT</div>'+
'<h2>🎮 Pet-Talente automatisch einlesen</h2>'+
'<p>Nutze die direkte Fensterfreigabe als Hauptweg. Alternativ kannst du unten einen Screenshot hochladen. Falls nicht alle neun Werte erkannt werden, markiere im Bild nur den Bereich mit den Talent-Zeilen und versuche es erneut.</p>'+
'<div class="grid"><div class="field"><label for="pet-ocr-species">Spezies</label><select id="pet-ocr-species">'+species.map(s=>'<option value="'+s+'">'+s+'</option>').join('')+'</select></div>'+
'<div class="field"><label for="pet-ocr-upload">Alternativ: Screenshot (PNG, JPG, WebP)</label><input type="file" id="pet-ocr-upload" accept="image/png,image/jpeg,image/webp"></div></div>'+
'<canvas id="pet-ocr-canvas" aria-label="Screenshot, Wertebereich durch Ziehen auswählen" style="display:none;max-width:100%;height:auto;touch-action:none;cursor:crosshair;border:1px solid #64748b;border-radius:8px;margin:12px 0"></canvas>'+
'<div class="actions"><button type="button" id="pet-ocr-reset">Auswahl zurücksetzen</button><button type="button" class="primary" id="pet-ocr-read" disabled>Werte aus Screenshot lesen</button></div>'+
'<div id="pet-ocr-status" class="status" role="status" aria-live="polite"></div>'+
'<div id="pet-ocr-review"></div>'+
'<p class="tip">Die Texterkennung läuft im Browser; beim ersten Mal werden OCR-Bibliothek und Sprachdaten geladen. Bitte vor der Übernahme prüfen. Bei fehlenden oder unsicheren Werten bleiben deine bisherigen Daten erhalten.</p>';
list.before(panel);
const canvas=$('pet-ocr-canvas');
let img=null,src='',selection=null,dragStart=null,results=[];
function status(message,bad=false){const el=$('pet-ocr-status');el.textContent=message;el.classList.toggle('error',!!bad)}
function coords(e){
 const b=canvas.getBoundingClientRect();
 return {x:Math.max(0,Math.min(canvas.width,(e.clientX-b.left)*canvas.width/b.width)),y:Math.max(0,Math.min(canvas.height,(e.clientY-b.top)*canvas.height/b.height))};
}
function normRect(a,b){
 const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);
 return {x,y,w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)};
}
function draw(){
 if(!img)return;
 const scale=Math.min(1,1000/img.naturalWidth,620/img.naturalHeight);
 canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
 canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
 canvas.style.display='block';
 const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
 if(selection){
  const {x,y,w,h}=selection;
  ctx.fillStyle='rgba(13,23,36,.52)';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,x/scale,y/scale,w/scale,h/scale,x,y,w,h);
  ctx.strokeStyle='#ffcb70';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
 }
}
canvas.addEventListener('pointerdown',e=>{if(!img)return;canvas.setPointerCapture(e.pointerId);dragStart=coords(e);selection=null});
canvas.addEventListener('pointermove',e=>{if(!dragStart)return;const rect=normRect(dragStart,coords(e));selection=rect.w>6&&rect.h>6?rect:null;draw()});
canvas.addEventListener('pointerup',e=>{if(!dragStart)return;const rect=normRect(dragStart,coords(e));dragStart=null;selection=rect.w>20&&rect.h>20?rect:null;draw();if(selection)status('Wertebereich ausgewählt. Jetzt auslesen.')});
$('pet-ocr-reset').addEventListener('click',()=>{selection=null;results=[];$('pet-ocr-review').innerHTML='';draw();status('Auswahl zurückgesetzt. Du kannst einen neuen Bereich markieren.')});
$('pet-ocr-upload').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>16e6){status('Bitte PNG, JPG oder WebP unter 16 MB verwenden.',true);return}
 if(src)URL.revokeObjectURL(src);src=URL.createObjectURL(file);
 try{
  const picture=new Image();await new Promise((ok,fail)=>{picture.onload=ok;picture.onerror=fail;picture.src=src});
  img=picture;selection=null;results=[];draw();$('pet-ocr-read').disabled=false;
  $('pet-ocr-review').innerHTML='';status('Screenshot geladen ('+img.naturalWidth+' × '+img.naturalHeight+'). Markiere möglichst nur die Talent-Zeilen.');
 }catch{status('Das Bild konnte nicht geladen werden.',true)}
});
function getCrop(){
 const scale=canvas.width/img.naturalWidth;
 const r=selection||{x:0,y:0,w:canvas.width,h:canvas.height};
 const x=Math.round(r.x/scale),y=Math.round(r.y/scale);
 const w=Math.min(img.naturalWidth-x,Math.round(r.w/scale)),h=Math.min(img.naturalHeight-y,Math.round(r.h/scale));
 if(w<80||h<80)throw Error('Wertebereich zu klein. Bitte erneut markieren.');
 const resize=Math.min(2.5,2600/w,2600/h);
 const out=document.createElement('canvas');out.width=Math.max(1,Math.round(w*resize));out.height=Math.max(1,Math.round(h*resize));
 const ctx=out.getContext('2d');ctx.filter='contrast(1.5)';ctx.drawImage(img,x,y,w,h,0,0,out.width,out.height);
 return out;
}
let loader=null;
function loadOCR(){
 if(window.Tesseract)return Promise.resolve(window.Tesseract);
 if(loader)return loader;
 loader=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  script.onload=()=>window.Tesseract?resolve(window.Tesseract):reject(Error('OCR-Bibliothek nicht verfügbar'));
  script.onerror=()=>reject(Error('Die OCR-Bibliothek konnte nicht geladen werden (Internet/Blocker prüfen).'));
  document.head.append(script);
 }).catch(e=>{loader=null;throw e});
 return loader;
}
function analyze(text){
 const normal=String(text||'').normalize('NFKC').replace(/[|]/g,'I').replace(/\s+/g,' ').trim();
 const normalized=normal.toLocaleLowerCase('de');
 const matches=[];
 for(const [name,patterns] of lexicon)if(patterns.some(p=>p.test(normalized)))matches.push({name,score:Math.max(...patterns.map(p=>p.test(normalized)?p.source.length:0))});
 // Specific matches precede generic ones to avoid calling PvE damage plain damage.
 matches.sort((a,b)=>b.score-a.score);
 return matches[0]?.name||null;
}
function extract(ocr){
 const lines=Array.isArray(ocr.lines)&&ocr.lines.length?ocr.lines.map(l=>({text:l.text||'',y:l.bbox?.y0??0,confidence:l.confidence??ocr.confidence??0})):
 String(ocr.text||'').split(/\n/).map((text,i)=>({text,y:i*30,confidence:ocr.confidence??0}));
 let mapped=lines.map(l=>({...l,name:analyze(l.text)})).filter(l=>l.name);
 mapped.sort((a,b)=>a.y-b.y);
 // OCR sometimes splits the same row into two lines. Combine near-duplicate lines.
 mapped=mapped.filter((l,i,a)=>i===0||l.name!==a[i-1].name||Math.abs(l.y-a[i-1].y)>18);
 return mapped.slice(0,9);
}
function drawReview(lines,raw){
 results=lines;
 const review=$('pet-ocr-review');
 if(!lines.length){
  review.innerHTML='<div class="info">Keine sicher zuordenbaren Talente erkannt. Versuche im angezeigten Bild nur den Wertebereich zu markieren und lies noch einmal aus.</div><details><summary>Erkannter Rohtext</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px">'+esc(raw.slice(0,3000))+'</pre></details>';
  return;
 }
 const complete=lines.length===9;
 const rows=lines.map((l,i)=>{
  const options='<option value="">Slot auswählen</option>'+Array.from({length:9},(_,j)=>'<option value="'+(j+1)+'"'+(complete&&i===j?' selected':'')+'>Slot '+(j+1)+'</option>').join('');
  return '<tr data-ocr-row><td><select data-ocr-slot aria-label="Slot für erkannte Zeile '+(i+1)+'">'+options+'</select></td>'+
   '<td><input data-ocr-roll value="'+esc(l.name)+'" aria-label="Erkannter Wert '+(i+1)+'"></td>'+
   '<td>'+Math.round(l.confidence||0)+' %</td></tr>';
 }).join('');
 review.innerHTML='<h3 style="margin-top:14px">Erkannte Talente – bitte prüfen</h3>'+
 (complete?'<p class="tip">Neun Talentzeilen erkannt. Die Slotnummern sind anhand der Reihenfolge vorgeschlagen und können korrigiert werden.</p>':
 '<p class="tip" style="color:#ffce8b">Nur '+lines.length+' von 9 Talentzeilen erkannt. Damit keine Werte in die falschen Slots kommen, wähle die Slotnummern für die erkannten Zeilen selbst aus. Leere Slots bleiben unverändert.</p>')+
 '<div style="overflow:auto"><table style="width:100%"><thead><tr><th>Slot auswählen</th><th>Erkannter Wert (korrigierbar)</th><th>OCR</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<div class="actions"><button type="button" class="primary" id="pet-ocr-apply">Geprüfte Werte übernehmen</button></div>'+
 '<details><summary>Erkannter Rohtext zur Kontrolle</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px">'+esc(raw.slice(0,3000))+'</pre></details>';
}
$('pet-ocr-read').addEventListener('click',async()=>{
 if(!img)return;
 const b=$('pet-ocr-read');b.disabled=true;results=[];$('pet-ocr-review').innerHTML='';
 let worker;
 try{
  const crop=getCrop();
  status('OCR-Bibliothek und Sprachpakete werden geladen …');
  const tesseract=await loadOCR();
  worker=await tesseract.createWorker('deu+eng',1,{logger:m=>{if(m.status==='recognizing text')status('Texterkennung: '+Math.round((m.progress||0)*100)+' %')}});
  const ret=await worker.recognize(crop);
  const found=extract(ret.data);
  // Recognize genus label if it appears in the selected area.
  const normalized=String(ret.data.text||'').toLowerCase();
  const fromText=species.find(s=>new RegExp('\\b'+s.toLowerCase()+'\\b','i').test(normalized));
  if(fromText)$('pet-ocr-species').value=fromText;
  drawReview(found,ret.data.text||'');
  status(found.length+' von maximal 9 Talentzeilen erkannt. Bitte kontrollieren, dann speichern.',found.length===0);
 }catch(e){status('Auslesen fehlgeschlagen: '+String(e.message||e),true)}
 finally{if(worker)try{await worker.terminate()}catch{};b.disabled=false}
});
$('pet-ocr-review').addEventListener('click',e=>{
 if(e.target.id!=='pet-ocr-apply')return;
 const name=$('pet-ocr-species').value;
 if(!species.includes(name)||!results.length)return;
 const entries=[...$('pet-ocr-review').querySelectorAll('tr[data-ocr-row]')]
  .map(row=>({slot:Number(row.querySelector('[data-ocr-slot]').value),roll:row.querySelector('[data-ocr-roll]').value.trim().slice(0,90)}))
  .filter(x=>x.slot>=1&&x.slot<=9&&x.roll);
 if(new Set(entries.map(x=>x.slot)).size!==entries.length){
  status('Eine Slotnummer ist mehrfach vergeben. Bitte jeden Slot höchstens einmal auswählen.',true);return;
 }
 if(!entries.length){status('Keine ausgelesenen Werte vorhanden.',true);return}
 if(!confirm(entries.length+' Talente für '+name+' speichern? Vorhandene Werte in diesen Slots werden ersetzt.'))return;
 const key='aion2-pets-v2:'+String(data?.sourceRef?.sid||'local')+':'+String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
 try{
  const state=JSON.parse(localStorage.getItem(key)||'{}')||{};
  const rolls=state.rolls&&typeof state.rolls==='object'?state.rolls:{};
  for(const row of entries)rolls[name+'|'+row.slot]=row.roll;
  const expanded=new Set(Array.isArray(state.expanded)?state.expanded:[]);
  expanded.add(name);
  localStorage.setItem(key,JSON.stringify({...state,rolls,expanded:[...expanded]}));
  window.dispatchEvent(new Event('aion2:pets-updated'));
  status(entries.length+' Talente für '+name+' gespeichert und neu bewertet.');
 }catch(e){status('Speichern nicht möglich: '+e.message,true)}
});

/* Shared OCR helpers for the optional multi-species walkthrough.
 * A full, uniquely named nine-slot screen is needed for automatic saving.
 * Partial or ambiguous reads must be reviewed explicitly. */
const getPetKey=()=> 'aion2-pets-v2:'+
 String(data?.sourceRef?.sid||'local')+':'+
 String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
function speciesFromText(text){
 const normalized=String(text||'').normalize('NFKC');
 const matches=species.filter(s=>new RegExp('\\b'+s+'\\b','i').test(normalized));
 return matches.length===1?matches[0]:null;
}
function storeCompleteSpecies(name,found){
 if(isDemo||!species.includes(name)||!Array.isArray(found)||found.length!==9||
    found.some(x=>!x||!lexicon.some(([v])=>v===x.name)))return false;
 const key=getPetKey();
 const state=JSON.parse(localStorage.getItem(key)||'{}')||{};
 const rolls=state.rolls&&typeof state.rolls==='object'&&!Array.isArray(state.rolls)?state.rolls:{};
 const normalized=found.map((x,i)=>({slot:i+1,name:x.name}));
 for(const x of normalized)rolls[name+'|'+x.slot]=x.name;
 const expanded=new Set(Array.isArray(state.expanded)?state.expanded:[]);
 expanded.add(name);
 const scanned=state.scanned&&typeof state.scanned==='object'?state.scanned:{};
 scanned[name]={at:new Date().toISOString(),rolls:normalized.map(x=>x.name),method:'window-ocr'};
 localStorage.setItem(key,JSON.stringify({...state,rolls,expanded:[...expanded],scanned}));
 window.dispatchEvent(new Event('aion2:pets-updated'));
 return true;
}
window.aionPetOCR={
 species,loadOCR,extract,speciesFromText,storeCompleteSpecies,getPetKey,
 review(name,found,raw){
  if(species.includes(name))$('pet-ocr-species').value=name;
  drawReview(found||[],raw||'');
  $('pet-ocr-review').scrollIntoView({behavior:'smooth',block:'start'});
 }
};
})();
