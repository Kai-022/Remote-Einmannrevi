/* Pet-Spezieskenntnisse: aufklappbar, echte manuelle Rolls und ehrliche Statusfarben. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const safe=value=>String(value??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
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
const list=$('pet-list');
if(!list)return;
let current='',rolls={},expanded=new Set(['Cogni']);
function storageKey(){return 'aion2-pets-v2:'+String(data?.sourceRef?.sid||'local')+':'+String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC')}
function load(){
 const key=storageKey();
 if(key===current)return;
 current=key;let state={};
 try{state=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 rolls=state.rolls&&typeof state.rolls==='object'&&!Array.isArray(state.rolls)?state.rolls:{};
 expanded=new Set(Array.isArray(state.expanded)?state.expanded:['Cogni']);
}
function save(){
 if(isDemo)return;
 try{localStorage.setItem(current,JSON.stringify({rolls,expanded:[...expanded]}))}catch{}
}
function getOptions(spec,slot){
 const pair=slot===4?[spec[1],spec[2]]:slot===7?[spec[3],'Situative Resistenz']:common[slot];
 const alts=String(pair?.[1]||'').split(/\s*\/\s*/).map(v=>v.trim()).filter(Boolean);
 return {best:String(pair?.[0]||''),alts};
}
function status(spec,slot){
 const values=getOptions(spec,slot),actual=String(rolls[spec[0]+'|'+slot]||'');
 return !actual?'unknown':actual===values.best?'good':values.alts.includes(actual)?'alt':'bad';
}
function slotCard(spec,slot){
 const itemId=spec[0]+'|'+slot,opts=getOptions(spec,slot),actual=String(rolls[itemId]||'');
 const result=status(spec,slot);
 const indicators={unknown:'⚪ Nicht erfasst',good:'🟢 BiS',alt:'🟡 Alternative',bad:'🔴 Neu prüfen'};
 const known=[opts.best,...opts.alts];
 return '<div class="ps-cell '+result+'"><div class="ps-title"><span>Slot '+slot+(slot===4?' · Offensiv':slot===7?' · Defensiv':'')+'</span>'+
 '<span class="ps-state">'+indicators[result]+'</span></div>'+
 '<label for="ps-'+safe(spec[0])+'-'+slot+'">Tatsächlich gewürfelter Wert</label>'+
 '<select id="ps-'+safe(spec[0])+'-'+slot+'" data-species="'+safe(spec[0])+'" data-slot="'+slot+'">'+
 '<option value="">Noch nicht erfasst</option>'+
 known.map(v=>'<option value="'+safe(v)+'"'+(v===actual?' selected':'')+'>'+safe(v)+'</option>').join('')+
 '<option value="__other__"'+(actual&&!known.includes(actual)?' selected':'')+'>Anderer Wert (nicht empfohlen)</option></select>'+
 (actual&&!known.includes(actual)?'<div class="ps-tip">Eingetragen: '+safe(actual)+'</div>':'')+
 '<div class="ps-tip"><b>BiS:</b> '+safe(opts.best)+'</div>'+
 '<div class="ps-tip"><b>Alternative:</b> '+safe(opts.alts.join(' oder ')||'Nicht hinterlegt')+'</div>'+
 '</div>';
}
function show(){
 load();
 list.innerHTML='<div class="ps-info">Die öffentlich verfügbaren NCSOFT-Charakterdaten liefern aktuell <b>keine einzelnen Spezieskenntnis-Rolls</b>. Nutze den Screenshot-Import oberhalb oder korrigiere bei Bedarf einzelne Slots. Nicht erfasste Slots bleiben neutral statt fälschlich rot.</div>'+
 '<div class="ps-legend"><span>🟢 Bester Zielwert</span><span>🟡 Gute Alternative</span><span>🔴 Anderer Wert</span><span>⚪ Unbekannt</span></div>'+
 specs.map(spec=>{
  const counts={good:0,alt:0,bad:0,unknown:0};
  for(let n=1;n<=9;n++)counts[status(spec,n)]++;
  return '<details class="ps-group" data-group="'+safe(spec[0])+'"'+(expanded.has(spec[0])?' open':'')+'>'+
  '<summary class="ps-summary"><div><div class="ps-name">◇ '+safe(spec[0])+'</div><div class="ps-progress">'+
  '🟢 '+counts.good+' BiS · 🟡 '+counts.alt+' Alternative · 🔴 '+counts.bad+' prüfen · ⚪ '+counts.unknown+' offen'+
  '</div></div><span>⌄</span></summary>'+
  '<div class="ps-grid">'+Array.from({length:9},(_,i)=>slotCard(spec,i+1)).join('')+'</div></details>';
 }).join('')+
 '<p class="tip">Hinweis: Die BiS-/Alternativwerte sind die vorhandenen allgemeinen PvE-Empfehlungen – keine live verifizierte, klassenabhängige Spiel-Datenbank. Bei Spielupdates die empfohlenen Werte überprüfen.</p>';
}
list.addEventListener('change',e=>{
 const select=e.target.closest('select[data-species][data-slot]');if(!select)return;
 load();
 const spec=specs.find(x=>x[0]===select.dataset.species),n=Number(select.dataset.slot);
 if(!spec||!Number.isInteger(n)||n<1||n>9)return;
 const id=spec[0]+'|'+n;
 if(select.value==='__other__')rolls[id]='Anderer Wert';
 else if(select.value)rolls[id]=String(select.value).slice(0,80);
 else delete rolls[id];
 save();show();
});
list.addEventListener('toggle',e=>{
 const details=e.target;
 if(!details?.matches?.('details[data-group]'))return;
 const name=details.dataset.group;if(!specs.some(s=>s[0]===name))return;
 if(details.open)expanded.add(name);else expanded.delete(name);
 save();
},true);
if(typeof window!=='undefined')window.addEventListener('aion2:pets-updated',()=>{current='';show()});
const previous=render;
render=function(){previous();show()};
show();
})();
