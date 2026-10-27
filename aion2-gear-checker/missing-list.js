/* AION 2 Armory: checklist of outstanding character progress; no screenshot processing. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const dash=$('dash');if(!dash)return;
const section=document.createElement('section');
section.id='tab-missing';section.className='armory-folded';
section.innerHTML='<section class="panel need-panel"><div class="eyebrow">DEIN CHARAKTER · CHECKLISTE</div><h2>Was brauche ich noch?</h2><p>Was fehlt, was ist schon eingetragen und was lässt sich noch verbessern?</p><div class="need-counters" id="need-counts"></div><label class="need-toggle"><input id="need-show-all" type="checkbox"> Auch erledigte Einträge anzeigen</label><div id="need-groups"></div><p class="tiny muted">„Fehlt“ bedeutet: noch nicht eingetragen oder nicht als gesammelt markiert. Pantheon-Besitz wird nicht automatisch ausgelesen; Pet-Empfehlungen sind Richtwerte.</p></section>';
const gearTab=$('tab-gear');if(gearTab)gearTab.before(section);else dash.append(section);
let pantheon=[],panLoading=true,panError='',includeDone=false;
const getSaved=key=>{try{const val=JSON.parse(localStorage.getItem(key)||'{}');return val&&typeof val==='object'&&!Array.isArray(val)?val:{}}catch{return {}}};
const petKey=()=>window.aionPetSpecies?.storageKey?.()||'';
const panKey=()=> 'aion2-pantheon-v1:'+String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'EU-Charakter').normalize('NFKC');
const owned=(state,id)=>(Array.isArray(state.owned)&&state.owned.includes(id))||(Array.isArray(state.placed)&&state.placed.includes(id));
function line(title,detail,state,action,values={}){
 return '<div class="need-line '+state+'"><div class="need-description"><b>'+esc(title)+'</b><small>'+esc(detail)+'</small></div><button type="button" data-need-action="'+action+'" '+
 Object.entries(values).map(([k,v])=>'data-'+esc(k)+'="'+esc(v)+'"').join(' ')+'>'+({pet:'Bearbeiten',gear:'Bearbeiten',own:'✓ Habe ich',unown:'↶ Rückgängig'})[action]+'</button></div>';
}
function group(id,title,counter,items,open){
 return '<details class="need-section" data-need-section="'+id+'"'+(open?' open':'')+'><summary><b>'+title+'</b><small>'+esc(counter)+' ▾</small></summary><div class="need-items">'+
 (items.length?items.join(''):'<p class="need-done">✓ Nichts mehr offen.</p>')+'</div></details>';
}
function renderMissing(){
 const root=$('need-groups');if(!root)return;
 const open={};root.querySelectorAll('details[data-need-section]').forEach(x=>{open[x.dataset.needSection]=x.open});
 const petState=getSaved(petKey()),rolls=petState.rolls||{},petLines=[];let petTotal=0,petBest=0,petFilled=0;
 const api=window.aionPetSpecies;
 for(const species of api?.species||[])for(let slot=1;slot<=9;slot++){
  const wanted=api.getOptions(species,slot);if(!wanted)continue;petTotal++;
  const actual=String(rolls[species+'|'+slot]||'');
  if(actual)petFilled++;
  const best=actual===wanted.best;if(best)petBest++;
  if(best&&!includeDone)continue;
  const alternative=wanted.alts.includes(actual);
  const situation=best?'✓ Bester Wert':!actual?'○ Noch nicht eingetragen':alternative?'! Alternative':'! Verbesserung möglich';
  petLines.push(line(species+' – Slot '+slot,situation+' · '+(actual?'Aktuell: '+actual+' · ':'')+'Ziel: '+wanted.best,
     best?'done':actual?'improve':'missing','pet',{species,slot}));
 }
 const slots=typeof names!=='undefined'?names:[];
 const gear=data?.gear||{},gearLines=[];let gearGood=0,gearUnfilled=0,gearCheck=0;
 for(const slot of slots){
  const item=gear[slot];
  if(!item){gearUnfilled++;gearLines.push(line(slot,'Nicht eingetragen','missing','gear',{slot}));continue;}
  const quality=typeof gearItemStatus==='function'?gearItemStatus(slot,item):'unknown';
  if(quality==='good')gearGood++;else gearCheck++;
  if(quality==='good'&&!includeDone)continue;
  const state=quality==='good'?'done':quality==='unknown'?'missing':'improve';
  const label=quality==='good'?'✓ Gute Werte':quality==='bad'?'! Neu prüfen / würfeln':quality==='mid'?'! Alternative prüfen':'○ Zusatzwerte fehlen';
  gearLines.push(line(slot+' – '+(item.name||slot),label,state,'gear',{slot}));
 }
 const sourceRef=String(data?.sourceRef?.sid||'');
 const faction=sourceRef[0]==='1'?'elyos':sourceRef[0]==='2'?'asmodier':'';
 const items=pantheon.filter(x=>!faction||x.faction==='alle'||x.faction===faction);
 const saved=getSaved(panKey());const countDone=items.filter(x=>owned(saved,x.id)).length;
 let panLines=[];
 if(panLoading)panLines=['<p class="need-loading">Pantheon-Katalog wird geladen …</p>'];
 else if(panError)panLines=['<p class="need-loading">'+esc(panError)+'</p>'];
 else panLines=items.filter(x=>includeDone||!owned(saved,x.id)).map(x=>{
  const yes=owned(saved,x.id),kind={artwork:'Gemälde',statue:'Statue',colossus:'Koloss'}[x.kind]||'Sammlung';
  return line(x.nameDe||x.name,kind+' · '+(yes?'✓ Gesammelt':'○ Noch nicht markiert')+' · Fundort: '+(x.where||'Unbekannt'),
    yes?'done':'missing',yes?'unown':'own',{id:x.id});
 });
 $('need-counts').innerHTML='<div><strong>'+petBest+'/'+petTotal+'</strong><small>Pet-Slots optimal</small></div>'+
 '<div><strong>'+gearGood+'/'+slots.length+'</strong><small>Gear-Slots gut</small></div>'+
 '<div><strong>'+(panLoading?'…':countDone+'/'+items.length)+'</strong><small>Pantheon gesammelt</small></div>';
 root.innerHTML=group('pets','◇ Pet-Spezieskenntnisse',(petTotal-petFilled)+' nicht eingetragen · '+(petFilled-petBest)+' verbesserbar',petLines,open.pets??true)+
 group('gear','⚔ Ausrüstung',gearUnfilled+' fehlen · '+gearCheck+' prüfen',gearLines,open.gear??true)+
 group('pan','▣ Pantheon',panLoading?'Lädt …':(items.length-countDone)+' noch nicht markiert',panLines,open.pan??false);
}
section.addEventListener('click',e=>{
 const b=e.target.closest('button[data-need-action]');if(!b)return;
 const type=b.dataset.needAction;
 if(type==='pet'){
  document.querySelector('[data-armory="pets"]')?.click();
  const group=Array.from(document.querySelectorAll('#pet-list details[data-group]')).find(x=>x.dataset.group===b.dataset.species);
  if(group)group.open=true;
  const input=$('ps-'+b.dataset.species+'-'+b.dataset.slot);
  if(input){input.scrollIntoView({behavior:'smooth',block:'center'});input.focus();}
 }else if(type==='gear'){
  document.querySelector('[data-armory="gear"]')?.click();
  const input=$('slot');if(input){input.value=b.dataset.slot;input.dispatchEvent(new Event('change',{bubbles:true}));input.scrollIntoView({behavior:'smooth',block:'center'});input.focus();}
 }else if(type==='own'||type==='unown'){
  if(!pantheon.some(x=>x.id===b.dataset.id))return;
  const key=panKey(),v=getSaved(key),set=new Set(Array.isArray(v.owned)?v.owned:[]),placed=new Set(Array.isArray(v.placed)?v.placed:[]);
  if(type==='own')set.add(b.dataset.id);else{set.delete(b.dataset.id);placed.delete(b.dataset.id);}
  try{localStorage.setItem(key,JSON.stringify({...v,owned:[...set],placed:[...placed]}));window.dispatchEvent(new Event('aion2:pantheon-updated'));renderMissing();}
  catch{alert('Speichern im Browser war nicht möglich.');}
 }
});
$('need-show-all').addEventListener('change',e=>{includeDone=e.target.checked;renderMissing()});
window.armoryRenderMissing=renderMissing;
fetch('./pantheon-catalog.json?v=2',{cache:'no-cache'})
.then(async res=>{if(!res.ok)throw Error('HTTP '+res.status);const result=await res.json();if(!Array.isArray(result.items))throw Error('Ungültiger Katalog');pantheon=result.items.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string');})
.catch(()=>{panError='Pantheon-Katalog nicht verfügbar';})
.finally(()=>{panLoading=false;renderMissing()});
})();