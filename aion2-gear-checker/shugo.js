/* Shugo.GG EU profile importer: browser-only, user-initiated; no hidden API */
(()=>{
'use strict';
const qs=s=>document.querySelector(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const holder=document.createElement('section');holder.className='panel';holder.id='shugo-import';
holder.innerHTML=
'<div class="eyebrow">EU · SHUGO.GG · CHARAKTERPROFIL</div>'+
'<h2>✧ Gear über Shugo.GG übernehmen</h2>'+
'<p>Nutze den öffentlichen Link deines Shugo.GG-Charakterprofils. Keine Cloudflare-Verbindung, kein Spiel-Login und keine Installation.</p>'+
'<div class="field"><label for="shugo-link">Shugo.GG-Charakterlink (EU)</label>'+
'<input id="shugo-link" type="url" placeholder="https://shugo.gg/character/global/eu-siel/DeinName" autocomplete="url"></div>'+
'<div class="actions"><button type="button" class="primary" id="shugo-fetch">✧ Gear über Link laden</button>'+
'<button type="button" id="shugo-open">Shugo-Profil öffnen ↗</button>'+
'<a class="button" href="https://shugo.gg/de/character" target="_blank" rel="noopener noreferrer">Charakter auf Shugo suchen ↗</a></div>'+
'<div id="shugo-status" class="status" role="status" aria-live="polite"></div>'+
'<details id="shugo-copy" style="margin-top:13px" open>'+
'<summary style="color:var(--gold);cursor:pointer;font-weight:700">Alternativ: Ausrüstung vom Shugo-Profil kopieren</summary>'+
'<p class="tiny muted" style="margin:12px 0">Öffne dein Profil bei Shugo.GG, wähle <b>Ausrüstung</b>, markiere den sichtbaren Seiteninhalt mit <b>Strg + A</b> und kopiere ihn mit <b>Strg + C</b>. Füge ihn unten mit <b>Strg + V</b> ein und klicke auf „Kopiertes Gear übernehmen“.</p>'+
'<div class="field"><label for="shugo-paste">Kopierter Text aus dem Charakterprofil</label>'+
'<textarea id="shugo-paste" rows="5" placeholder="Main Hand   Splendent Wise Dragon Lord Mace +15 ◆5   Unique&#10;Off-hand   Nuakum Guard +15   Unique&#10;..."></textarea></div>'+
'<div class="actions"><button type="button" class="primary" id="shugo-import-paste">✓ Kopiertes Gear übernehmen</button>'+
'<button type="button" id="shugo-clear-paste">Text löschen</button></div></details>'+
'<div class="info" style="margin-top:16px">Shugo.GG bietet keine öffentliche API an. Darum funktioniert der automatische Abruf über den Link nur, wenn die Webseite Browserzugriffe erlaubt. Der Textimport übernimmt die im Profil sichtbaren Gegenstände und Verbesserungsstufen – keine nicht angezeigten Seelenbindungswerte oder Pet-Daten.</div>';
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
 // Copied website layout may have slot and item on separate lines.
 for(let i=0;i<lines.length;i++){
   const spec=slotName(lines[i]);
   if(!spec)continue;
   // Layout A: the slot label precedes item name
   for(let k=i+1;k<Math.min(i+4,lines.length);k++){
     if(slotName(lines[k])||/^(?:Equipment|Ausr[uü]stung|Waffen|R[uü]stung|Item|Slot)$/i.test(lines[k]))break;
     const hit=lines[k].match(/^(?:\+\s*\d{1,2}\s+)?[\p{L}\p{N}].{3,140}$/u);
     if(hit && !/^(?:Unique|Epic|Special|Einzigartig|Episch|Image:|Bild:)/i.test(lines[k])){
       rows.push({slot:lines[i],item:lines[k]});
       break;
     }
   }
   // Layout B: german client cards often show "+15 Item name" followed by "Haupthand"
   for(let k=i-1;k>=Math.max(0,i-3);k--){
     if(slotName(lines[k]))break;
     if(/^\+\s*\d{1,2}\s+[\p{L}\p{N}].{3,140}$/u.test(lines[k])){
       rows.push({slot:lines[i],item:lines[k]});break;
     }
   }
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
qs('#shugo-fetch').addEventListener('click',async()=>{
 if(fetching)return;
 let ref;try{ref=currentRef();}catch(e){message(e.message,true);return;}
 fetching=true;const btn=qs('#shugo-fetch');btn.disabled=true;
 message('Profil-Link erkannt. Versuche, die öffentlich sichtbare Ausrüstung abzurufen …');
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000);
 try{
  const response=await fetch(ref.url,{headers:{Accept:'text/html'},mode:'cors',credentials:'omit',signal:ctrl.signal});
  if(!response.ok)throw Error('HTTP '+response.status);
  const html=await response.text();
  const extracted=extractHtml(html).length?extractHtml(html):extractText(new DOMParser().parseFromString(html,'text/html').body?.innerText||'');
  if(!extracted.length)throw Error('Im HTML keine Ausrüstungs-Slots erkannt');
  importGear(extracted,ref);
 }catch(e){
   details.open=true;
   message('Der Shugo-Link wurde erkannt, aber das automatische Lesen wird blockiert oder liefert keine auswertbaren Gear-Daten ('+String(e.message).slice(0,90)+'). Öffne das Profil, kopiere dort die Ausrüstungsansicht und füge sie unten ein.',true);
 }finally{clearTimeout(timer);btn.disabled=false;fetching=false;}
});
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
window.__shugoParserTest={parseLink,extractHtml,extractText,slotName}; // for local diagnostics, does not expose user data
})();
