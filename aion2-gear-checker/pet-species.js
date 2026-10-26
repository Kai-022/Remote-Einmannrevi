/* Aion 2: Manual Pet species insight editor, without OCR, file uploads or game capture.
 * Keeps the existing aion2-pets-v2 per-character storage format. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const specs=[
 ['Cogni','PvE-Schadensverstärkung','Schadensverstärkung / Kritischer Schaden','PvE-Schadensresistenz'],
 ['Fera','PvE-Schadensverstärkung','Waffenschadensverstärkung','PvE-Schadensresistenz'],
 ['Natura','PvE-Schadensverstärkung','Perfektion / Mehrfachtreffer','PvE-Schadensresistenz'],
 ['Varian','PvE-Schadensverstärkung','Rückangriffsschaden','PvE-Schadensresistenz'],
 ['Spezial','Wucht','Schadensverstärkung / Kritischer Schaden','Allgemeine Schadensresistenz']
];
const common={
 1:['Max. Angriffskraft','Zusatzangriff / PvE-Angriff'],
 2:['LP %','PvE-Verteidigung'],
 3:['Kritischer Treffer','Zusatzpräzision'],
 5:['Max. Angriffskraft','Zusatzangriffskraft'],
 6:['Kritischer Treffer','Zusatzpräzision'],
 8:['LP %','PvE-Verteidigung'],
 9:['Kritischer Treffer','Zusatzpräzision']
};
const knownStats=[
 'Zusatzangriffskraft','Kritischer Widerstand (Rückseitig)','Zusatzpräzision',
 'Schadensverstärkung','Max. Angriffskraft','Kritischer Treffer',
 'Schadensresistenz (Rückseitig)','LP +','LP %','PvE-Schadensverstärkung',
 'PvE-Schadensresistenz','Waffenschadensverstärkung','Kritischer Schaden',
 'Kritische Schadensverstärkung','Schadensresistenz','Allgemeine Schadensresistenz',
 'Zusatzangriff','PvE-Angriff','PvE-Verteidigung','Präzision','Perfektion',
 'Mehrfachtreffer','Wucht','Rückangriffsschaden','Vitalität','Angriff',
 'Verteidigung','Blocken','Kampftempo','Bewegungstempo','Situative Resistenz'
];
const list=$('pet-list');
if(!list)return;
let current='',rolls={},details={},expanded=new Set(['Cogni']),feedback='';
function storageKey(){
 return 'aion2-pets-v2:'+String(data?.sourceRef?.sid||'local')+':'+
 String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
}
function load(){
 const key=storageKey();
 if(key===current)return;
 current=key;let state={};
 try{state=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 rolls=state.rolls&&typeof state.rolls==='object'&&!Array.isArray(state.rolls)?state.rolls:{};
 details=state.details&&typeof state.details==='object'&&!Array.isArray(state.details)?state.details:{};
 expanded=new Set(Array.isArray(state.expanded)?state.expanded:['Cogni']);
 feedback='';
}
function save(){
 if(isDemo){feedback='Im Demomodus werden Änderungen nicht dauerhaft gespeichert.';return}
 try{
  const old=JSON.parse(localStorage.getItem(current)||'{}')||{};
  localStorage.setItem(current,JSON.stringify({...old,rolls,details,expanded:[...expanded]}));
  feedback='✓ Im Browser gespeichert';
 }catch{feedback='⚠ Speichern fehlgeschlagen. Prüfe, ob der Browser lokale Daten zulässt.'}
}
function getOptions(spec,slot){
 const pair=slot===4?[spec[1],spec[2]]:slot===7?[spec[3],'Situative Resistenz']:common[slot];
 return {best:String(pair?.[0]||''),
  alts:String(pair?.[1]||'').split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean)};
}
function status(spec,slot){
 const actual=String(rolls[spec[0]+'|'+slot]||'');
 const opts=getOptions(spec,slot);
 return !actual?'unknown':actual===opts.best?'good':opts.alts.includes(actual)?'alt':'bad';
}
function slotCard(spec,slot){
 const name=spec[0],key=name+'|'+slot;
 const opts=getOptions(spec,slot),actual=String(rolls[key]||'');
 const amount=String(details[key]?.value||'');
 const result=status(spec,slot);
 const indicators={unknown:'⚪ Offen',good:'🟢 BiS',alt:'🟡 Alternative',bad:'🔴 Prüfen'};
 const choices=[...new Set([opts.best,...opts.alts,...knownStats])].filter(Boolean);
 const manual=!!actual&&!choices.includes(actual);
 return '<div class="ps-cell '+result+'"><div class="ps-title"><span>Slot '+slot+(slot===4?' · Offensiv':slot===7?' · Defensiv':'')+'</span>'+
 '<span class="ps-state">'+indicators[result]+'</span></div>'+
 '<label for="ps-'+safe(name)+'-'+slot+'">Talent auswählen</label>'+
 '<select id="ps-'+safe(name)+'-'+slot+'" data-species="'+safe(name)+'" data-slot="'+slot+'">'+
 '<option value="">Noch nicht eingetragen</option>'+
 choices.map(v=>'<option value="'+safe(v)+'"'+(v===actual?' selected':'')+'>'+safe(v)+'</option>').join('')+
 '<option value="__other__"'+(manual?' selected':'')+'>✎ Anderen Wert selbst eingeben …</option></select>'+
 (manual?'<label for="ps-custom-'+safe(name)+'-'+slot+'">Eigenen Talentnamen eingeben</label>'+
 '<input id="ps-custom-'+safe(name)+'-'+slot+'" type="text" maxlength="90" data-manual-roll data-species="'+safe(name)+'" data-slot="'+slot+'" placeholder="Talentname im Spiel" value="'+safe(actual==='Anderer Wert'?'':actual)+'">':'')+
 '<label for="ps-num-'+safe(name)+'-'+slot+'">Zahlenwert (optional)</label>'+
 '<input id="ps-num-'+safe(name)+'-'+slot+'" type="text" inputmode="decimal" maxlength="24" data-roll-number data-species="'+safe(name)+'" data-slot="'+slot+'" value="'+safe(amount)+'" placeholder="z. B. 15 oder 1,9 %">'+
 '<div class="ps-tip"><b>Empfohlen:</b> '+safe(opts.best)+'</div>'+
 '<div class="ps-tip"><b>Alternative:</b> '+safe(opts.alts.join(' oder ')||'Nicht hinterlegt')+'</div>'+
 '</div>';
}
function show(){
 load();
 list.innerHTML='<div class="ps-info"><b>Manuelle Pet-Eingabe</b> – Öffne deine Spezieskenntnisse im Spiel und trage je Slot das Talent ein. Auch eigene Namen und Zahlen wie 15 oder 1,9 % sind möglich. Jeder geänderte Wert wird automatisch für diesen Charakter gespeichert.</div>'+
 '<div class="ps-legend"><span>🟢 Empfohlener Wert</span><span>🟡 Alternative</span><span>🔴 Anderer Wert – prüfen</span><span>⚪ Noch offen</span></div>'+
 '<div id="ps-saved" class="ps-saved" role="status">'+safe(feedback)+'</div>'+
 specs.map(spec=>{
  const counts={good:0,alt:0,bad:0,unknown:0};
  for(let n=1;n<=9;n++)counts[status(spec,n)]++;
  const filled=9-counts.unknown;
  return '<details class="ps-group" data-group="'+safe(spec[0])+'"'+(expanded.has(spec[0])?' open':'')+'>'+
   '<summary class="ps-summary"><div><div class="ps-name">◇ '+safe(spec[0])+
   ' <span class="ps-count">'+filled+'/9 eingetragen</span></div><div class="ps-progress">'+
   '🟢 '+counts.good+' · 🟡 '+counts.alt+' · 🔴 '+counts.bad+' · ⚪ '+counts.unknown+
   '</div></div><span>⌄</span></summary>'+
   '<div class="ps-grid">'+Array.from({length:9},(_,i)=>slotCard(spec,i+1)).join('')+'</div></details>';
 }).join('')+
 '<p class="tip">Die Farben zeigen allgemeine PvE-Empfehlungen, nicht die Güte des Zahlenwerts. Unbekannte oder andere Talente werden zur Prüfung rot angezeigt. Keine Angaben werden automatisch aus dem Spiel übernommen.</p>';
}
list.addEventListener('change',e=>{
 const control=e.target.closest('select[data-species][data-slot],input[data-manual-roll],input[data-roll-number]');
 if(!control)return;
 load();
 const spec=specs.find(s=>s[0]===control.dataset.species),slot=Number(control.dataset.slot);
 if(!spec||!Number.isInteger(slot)||slot<1||slot>9)return;
 const key=spec[0]+'|'+slot;
 if(control.matches('select')){
  if(!control.value){delete rolls[key];delete details[key]}
  else {
   rolls[key]=control.value==='__other__'?'Anderer Wert':String(control.value).slice(0,90);
   details[key]={name:rolls[key],value:String(details[key]?.value||'')};
  }
 }else if(control.matches('[data-manual-roll]')){
  rolls[key]=control.value.trim().slice(0,90)||'Anderer Wert';
  details[key]={name:rolls[key],value:String(details[key]?.value||'')};
 }else{
  const val=control.value.trim().slice(0,24);
  if(val&&!/^[0-9.,+\-\s%]+$/.test(val)){
   feedback='Bitte einen Zahlenwert wie 15 oder 1,9 % eingeben.';
   $('ps-saved').textContent=feedback;control.focus();return;
  }
  if(val&&!rolls[key])rolls[key]='Anderer Wert';
  if(val||rolls[key])details[key]={name:rolls[key]||'',value:val};
  else delete details[key];
 }
 save();show();
});
list.addEventListener('toggle',e=>{
 const el=e.target;
 if(!el?.matches?.('details[data-group]'))return;
 if(!specs.some(s=>s[0]===el.dataset.group))return;
 if(el.open)expanded.add(el.dataset.group);else expanded.delete(el.dataset.group);
 save();
},true);
if(typeof window!=='undefined')window.addEventListener('aion2:pets-updated',()=>{current='';show()});
const originalRender=render;
render=function(){originalRender();show()};
show();
})();