/* Shugo.GG EU profile importer: browser-only, user-initiated; no hidden API */
(()=>{
'use strict';
const qs=s=>document.querySelector(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const holder=document.createElement('section');holder.className='panel';holder.id='shugo-import';
holder.innerHTML=
'<div class="eyebrow">SHUGO.GG · EU · KLERIKER PVE</div>'+
'<h2>Charakter importieren</h2>'+
'<p>Füge einfach deinen Shugo.GG-Charakterlink ein. Die Auswertung startet automatisch.</p>'+
'<div class="grid" style="align-items:end">'+
'<div class="field"><label for="shugo-link">Dein Shugo.GG-Charakterlink</label>'+
'<input id="shugo-link" type="url" placeholder="https://shugo.gg/character/global/eu-siel/DeinName" autocomplete="url"></div>'+
'<button type="button" class="primary" id="shugo-fetch">✧ Ausrüstung importieren</button></div>'+
'<div id="shugo-status" class="status" role="status" aria-live="polite"></div>'+
'<div class="tiny muted" style="margin-top:11px">Ohne Cloudflare oder Installation. Zum Lesen der öffentlichen Profilseite nutzt der Checker den <a href="https://jina.ai/reader/" target="_blank" rel="noopener noreferrer">Jina Reader</a>. Dein öffentlicher Shugo-Link wird dabei an diesen Dienst gesendet. Nicht mit Shugo.GG verbunden.</div>'+
'<details id="shugo-copy" style="margin-top:15px">'+
'<summary style="color:var(--gold);cursor:pointer;font-weight:700">Falls der automatische Import nicht klappt: Profilinhalt einfügen</summary>'+
'<p class="tiny muted" style="margin:11px 0">Öffne dein Shugo-Profil, kopiere die Ausrüstungsansicht mit Strg+A, Strg+C und füge sie hier mit Strg+V ein.</p>'+
'<div class="field"><label for="shugo-paste">Kopierter Text aus dem Charakterprofil</label>'+
'<textarea id="shugo-paste" rows="5" placeholder="Main Hand | Mace +15 | Unique"></textarea></div>'+
'<div class="actions"><button type="button" class="primary" id="shugo-import-paste">Kopiertes Gear übernehmen</button>'+
'<button type="button" id="shugo-open">Profil auf Shugo öffnen ↗</button>'+
'<button type="button" id="shugo-clear-paste">Text löschen</button></div></details>';
const previous=document.getElementById('import-panel');
if(previous){
 const legacy=document.createElement('details');legacy.id='legacy-import-options';legacy.style.margin='12px 0 24px';
 const sum=document.createElement('summary');sum.textContent='Weitere Importmöglichkeiten (NCSOFT-Link, JSON, Lesezeichen)';sum.style.cursor='pointer';sum.style.color='var(--muted)';
 legacy.appendChild(sum);previous.parentNode.insertBefore(legacy,previous);legacy.appendChild(previous);
 legacy.parentNode.insertBefore(holder,legacy);
}else{document.querySelector('.hero')?.after(holder);}
const link=qs('#shugo-link'),paste=qs('#shugo-paste'),details=qs('#shugo-copy');
const state=qs('#shugo-status');
const message=(m,error=false)=>{state.textContent=m;state.classList.toggle('error',error);};
let pendingHTML='';
const SLOT_ALIASES=[
 ['Waffe',/^(?:main\s*hand|mainhand|haupthand|hauptwaffe|waffe)$/i],
 ['Nebenhand',/^(?:off.?hand|sub.?hand|nebenhand|sch[uü]tzer|schild)$/i],
 ['Helm',/^(?:helmet|helm|head|kopf)$/i],
 ['Schultern',/^(?:shoulders|schulter|schultern)$/i],
 ['Brust',/^(?:torso|chest|brust|oberk[oö]rper)$/i],
 ['Hose',/^(?:legs?|pants|hose|beine)$/i],
 ['Handschuhe',/^(?:gloves?|handschuhe|handschuh)$/i],
 ['Schuhe',/^(?:boots?|schuhe|stiefel|feet)$/i],
 ['Umhang',/^(?:cape|cloak|umhang|mantel)$/i],
 ['Halskette',/^(?:necklace|halskette)$/i],
 ['Ohrring',/^(?:earrings?|ohrring(?:e)?)$/i],
 ['Ring',/^(?:rings?|ring(?:e)?)$/i],
 ['Armband',/^(?:bracelets?|armband|armb[aä]nder)$/i],
 ['Gürtel',/^(?:belt|g[uü]rtel)$/i],
 ['Amulett',/^(?:amulet|amulett)$/i],
 ['Rune',/^(?:runes?[12]?|rune\s*[12])$/i],
 ['Arkana',/^(?:arcana[1-5]?|arkana[1-5]?|arcana\s*[1-5]|arkana\s*[1-5])$/i]
];
function slotName(raw) {
 const token=String(raw||'').replace(/\s+/g,' ').replace(/[:：]\s*$/,'').trim();
 for(const [base,re] of SLOT_ALIASES)if(re.test(token)){
    const suffix=/([1-5])$/.exec(token);
    return {base,index:suffix?Number(suffix[1]):0};
 }
 return null;
}
function parseLink(s) {
 let u;try{u=new URL(String(s||'').trim());}catch{throw Error('Bitte einen vollständigen Shugo.GG-Charakterlink einfügen.');}
 if(u.protocol!=='https:'||!['shugo.gg','www.shugo.gg'].includes(u.hostname))throw Error('Bitte einen Link von shugo.gg verwenden.');
 const parts=u.pathname.split('/').filter(Boolean);
 if(['de','en','fr','es','pt','ja','ko','zh'].includes((parts[0]||'').toLowerCase()))parts.shift();
 if(parts.length!==4||parts[0]!=='character'||parts[1]!=='global'||!/^eu-[a-z0-9-]{2,80}$/i.test(parts[2]))
   throw Error('Das muss ein EU-Charakterprofil sein, zum Beispiel shugo.gg/character/global/eu-siel/Name.');
 let name;try{name=decodeURIComponent(parts[3]);}catch{throw Error('Charaktername im Link konnte nicht gelesen werden.');}
 if(!name||name.length>100)throw Error('Charaktername im Link ungültig.');
 return {url:u.origin+'/character/global/'+encodeURIComponent(parts[2].toLowerCase())+'/'+encodeURIComponent(name),name,server:parts[2].slice(3)};
}
function convertItem(slot,description,grade='') {
 let name=String(description||'').replace(/(?:Image:|Bild:)\s*/gi,'').replace(/◆\s*\d+/g,'').trim();
 const ench=/\+\s*(\d{1,2})\b/.exec(name);
 const breakthrough=/◆\s*(\d+)/.exec(String(description));
 const plus=ench?Number(ench[1]):0;
 name=name.replace(/\s*\+\s*\d{1,2}\b/g,'').replace(/^[+]\s*\d+\s*/,'').trim();
 name=name.replace(/\s+(?:Unique|Epic|Legendary|Rare|Common|Special|Einzigartig|Episch|Legend[aä]r|Selten)$/i,'').trim();
 if(!name || /^(slot|item|gegenstand|grade|qualit[aä]t)$/i.test(name))return null;
 const base=slot.base;
 let target=base;
 if(['Ohrring','Ring','Armband','Rune'].includes(base))target=base+' '+(slot.index||1);
 if(base==='Arkana')target='Arkana '+(slot.index||1);
 return {target,info:{name,plus,rolls:[],importDetail:{grade,breakthrough:breakthrough?Number(breakthrough[1]):null,origin:'Shugo.GG'}}};
}
function normalizeRows(rows) {
 const out=[], seen={};
 for(const x of rows){
  const spec=slotName(x.slot);if(!spec)continue;
  const item=convertItem(spec,x.item,x.grade);
  if(!item)continue;
  let {target}=item;
  if(out.some(i=>i.target===target)&&['Ring','Ohrring','Armband','Rune'].includes(spec.base)&&!spec.index){
   target=spec.base+' 2';item.target=target;
  }
  if(out.some(i=>i.target===target))continue;
  out.push(item);
 }
 return out;
}
function extractHtml(html) {
 if(!html||typeof html!=='string')return [];
 const doc=new DOMParser().parseFromString(html,'text/html');
 const rows=[];
 for(const table of doc.querySelectorAll('table')){
  for(const tr of table.querySelectorAll('tr')){
   const cells=Array.from(tr.querySelectorAll('th,td')).map(td=>(td.innerText||td.textContent||'').replace(/\s+/g,' ').trim());
   if(cells.length<2||!slotName(cells[0]))continue;
   rows.push({slot:cells[0],item:cells[1],grade:cells[2]||''});
  }
 }
 return normalizeRows(rows);
}
function extractText(raw) {
 let txt=String(raw||'').replace(/\r/g,'').replace(/\u00a0/g,' ').replace(/\u200b/g,'').slice(0,300000);
 const rows=[], lines=txt.split('\n').map(x=>x.trim()).filter(Boolean);
 // Common server-rendered text/table format: "Main Hand | Item Name +15 | Unique"
 for(const line of lines){
   const columns=line.split(/\s*\|\s*|\t+|\s{3,}/).map(x=>x.trim()).filter(Boolean);
   if(columns.length>=2 && slotName(columns[0])){
     rows.push({slot:columns[0],item:columns[1],grade:columns[2]||''});
   }
 }
 // Copied website layouts may have item before ("+15 Mace" then "Haupthand")
 // or item after ("Main Hand" then "Mace +15"). Prefer preceding equipped item
 // when its +level is visible, to avoid attributing the *next* item to this slot.
 for(let i=0;i<lines.length;i++){
   const spec=slotName(lines[i]);
   if(!spec)continue;
   let chosen=null;
   for(let k=i-1;k>=Math.max(0,i-3);k--){
     if(slotName(lines[k]))break;
     if(/^\+\s*\d{1,2}\s+[\p{L}\p{N}].{3,140}$/u.test(lines[k])){
       chosen=lines[k];break;
     }
   }
   if(!chosen){
     for(let k=i+1;k<Math.min(i+4,lines.length);k++){
       if(slotName(lines[k])||/^(?:Equipment|Ausr[uü]stung|Waffen|R[uü]stung|Item|Slot)$/i.test(lines[k]))break;
       const candidate=lines[k];
       if(/^(?:\+\s*\d{1,2}\s+)?[\p{L}\p{N}].{3,140}$/u.test(candidate)&&
         !/^(?:Unique|Epic|Special|Einzigartig|Episch|Image:|Bild:|Stats|Status|Effect)/i.test(candidate)){
         chosen=candidate;break;
       }
     }
   }
   if(chosen)rows.push({slot:lines[i],item:chosen});
 }
 return normalizeRows(rows);
}

function extractMarkdown(source){
 const content=String(source||'').replace(/\r/g,'');
 const position=/(?:^|\n)\s*#{0,3}\s*(?:Equipment|Ausr[uü]stung)\s*(?:\n|$)/im.exec(content);
 if(!position)return[];
 let text=content.slice(position.index+position[0].length);
 const end=/(?:^|\n)\s*(?:#{1,3}\s*)?(?:Other members|Andere Mitglieder|Top Combat Power|Similar characters|[ÄA]hnliche Charaktere|Skills|Stigmas|Stigmen)\s*(?:\n|$)/im.exec(text);
 if(end)text=text.slice(0,end.index);
 const clean=v=>String(v||'').replace(/【\d+†([^】]+)】/g,'$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_\x60]/g,'').replace(/\s+/g,' ').trim();
 const rows=[];
 for(const line of text.split('\n')){
    const parts=line.split(/\s*\|\s*/).map(clean).filter(Boolean);
    if(parts.length>=2&&slotName(parts[0])&&parts[1]&&!/^[-:]+$/.test(parts[1]))
      rows.push({slot:parts[0],item:parts[1],grade:parts[2]||''});
 }
 return normalizeRows(rows);
}
function importGear(items,ref) {
 const count=items.length;
 if(!count){message('Keine Ausrüstung erkannt. Kopiere auf Shugo.GG möglichst den Bereich „Ausrüstung“ mit den Itemnamen und Slots.',true);return false;}
 if(Object.keys(data?.gear||{}).length && !confirm('Die '+count+' von Shugo.GG erkannten Items ersetzen deine bisherigen Gear-Einträge. Fortfahren?'))return false;
 const gear={};for(const r of items)gear[r.target]=r.info;
 const name=ref?.name||'Shugo-Profil';
 isDemo=false;
 data={name,mode:qs('#mode')?.value||'hybrid',gear,source:'Shugo.GG (sichtbare Profildaten)',sourceUrl:ref?.url||null,importedAt:new Date().toISOString()};
 qs('#dash').classList.remove('hidden');qs('#charname').value=name;qs('#type').textContent='SHUGO.GG · PROFILDATEN';
 render();store();
 message(count+' Gear-Slots übernommen. Verbesserungsstufen sind eingetragen; Seelenbindungswerte kann Shugo.GG aus der Profilübersicht nicht vollständig liefern. Ergänze sie bei Bedarf manuell.');
 qs('#dash').scrollIntoView({behavior:'smooth',block:'start'});
 return true;
}
function currentRef(){return parseLink(link.value);}

qs('#shugo-open').addEventListener('click',()=>{
 try{const ref=currentRef();window.open(ref.url,'_blank','noopener,noreferrer');}
 catch(e){message(e.message,true);}
});
let fetching=false;
qs('#shugo-fetch').addEventListener('click',runImport);
let typingTimer;
link.addEventListener('input',()=>{
 clearTimeout(typingTimer);
 typingTimer=setTimeout(()=>{
  try {currentRef();runImport();} catch {}
 },650);
});
async function runImport(){
 if(fetching)return;
 let ref;try{ref=currentRef();}catch(e){message(e.message,true);return;}
 fetching=true;const btn=qs('#shugo-fetch');btn.disabled=true;
 message('Lade dein öffentliches Shugo-Profil und suche die Ausrüstung …');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),30000);
 try{
  // The public Reader endpoint reads public web pages and exposes a browser-accessible text response.
  // This is a third-party service; the user-facing UI discloses it explicitly.
  const url='https://r.jina.ai/'+ref.url;
  const response=await fetch(url,{method:'GET',mode:'cors',credentials:'omit',headers:{Accept:'text/plain'},signal:ctrl.signal});
  if(!response.ok)throw Error('Lesedienst: HTTP '+response.status);
  const txt=await response.text();
  if(txt.length>750000)throw Error('Profilantwort ist zu groß');
  if(/(?:^|\n)\s*(?:Error:|Access denied|Blocked by robots\.txt|Forbidden)/i.test(txt.slice(0,600)))throw Error('Profildaten wurden nicht freigegeben');
  const fromMD=extractMarkdown(txt);
  const rows=fromMD.length?fromMD:extractText(txt);
  if(rows.length<2)throw Error('Keine Gear-Liste im Profil gefunden');
  importGear(rows,ref);
 }catch(e){
   const reason=e?.name==='AbortError'?'Zeitüberschreitung':String(e?.message||e);
   message('Der automatische Abruf hat nicht funktioniert ('+reason+'). Du kannst unten bei Bedarf den sichtbaren Profiltext einfügen.',true);
 }finally{clearTimeout(timer);btn.disabled=false;fetching=false;}
}
paste.addEventListener('paste',event=>{
 const html=event.clipboardData?.getData('text/html');
 if(html&&html.length<2_000_000)pendingHTML=html;
});
qs('#shugo-import-paste').addEventListener('click',()=>{
 if(!paste.value.trim()&&!pendingHTML){message('Bitte zuerst den kopierten Profilinhalt einfügen.',true);return;}
 let ref=null;
 try{if(link.value.trim())ref=currentRef();}catch(e){message(e.message,true);return;}
 const fromHTML=extractHtml(pendingHTML);
 const rows=fromHTML.length?fromHTML:extractText(paste.value);
 if(importGear(rows,ref)){paste.value='';pendingHTML='';}
});
qs('#shugo-clear-paste').addEventListener('click',()=>{paste.value='';pendingHTML='';message('Kopierter Text gelöscht.');});


})();
