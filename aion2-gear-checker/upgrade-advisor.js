/* AION 2 Upgrade Advisor: explainable per-character upgrade roadmap. */
(()=>{
'use strict';
const core=window.AionAdvisorCore;
if(!core)return;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v).toLocaleString('de-DE',{maximumFractionDigits:0});
const allowedUrl=url=>{
 try{const u=new URL(url);return u.protocol==='https:'&&['aion2.gg','wikily.gg'].includes(u.hostname)?u.href:''}
 catch{return ''}
};
const sheet=document.createElement('style');
sheet.textContent="\n#tab-advisor .adv-intro{font-size:13px;color:#b9c7d6;line-height:1.6}\n#tab-advisor .adv-notice{background:#2c2a24;border:1px solid #776342;border-radius:10px;padding:12px 14px;color:#e9d6b4;font-size:13px;margin:13px 0}\n#tab-advisor .adv-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}\n#tab-advisor .adv-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0}\n#tab-advisor .adv-stats>div{border:1px solid #455671;background:#152239;border-radius:10px;padding:12px}\n#tab-advisor .adv-stats strong{display:block;font-size:23px;color:#f1d69d}\n#tab-advisor .adv-stats small{font-size:11px;color:#b8c6d6}\n#tab-advisor .adv-next{border:1px solid #a6854d;background:linear-gradient(110deg,#3a3327,#1c2835);padding:17px;border-radius:12px;margin:15px 0}\n#tab-advisor .adv-next h3{margin:5px 0 8px;font-size:19px}\n#tab-advisor .adv-next p{margin:4px 0 13px;color:#e0d7c7}\n#tab-advisor .adv-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:17px 0}\n#tab-advisor .adv-controls input,#tab-advisor .adv-controls select{min-height:40px;width:100%}\n#tab-advisor .adv-filter{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}\n#tab-advisor .adv-filter button{padding:8px 12px;font-size:12px;border-radius:30px}\n#tab-advisor .adv-filter button[aria-pressed=true]{background:#57462e;border-color:#e5c38c;color:#fff3d5}\n#tab-advisor .adv-list{display:grid;gap:12px;margin:13px 0}\n#tab-advisor .adv-card{background:#162235;border:1px solid #42536b;border-radius:11px;padding:15px}\n#tab-advisor .adv-card.done{opacity:.7;border-color:#42785e}\n#tab-advisor .adv-card-head{display:flex;gap:13px;justify-content:space-between;align-items:flex-start}\n#tab-advisor .adv-card h3{margin:5px 0;font-size:16px;line-height:1.35}\n#tab-advisor .adv-card p{margin:8px 0;color:#c9d6e3;font-size:13px}\n#tab-advisor .adv-pills{display:flex;flex-wrap:wrap;gap:6px}\n#tab-advisor .adv-pill{font-size:11px;background:#2b3b51;border:1px solid #55687d;border-radius:6px;padding:3px 7px;color:#e2ebf5}\n#tab-advisor .adv-pill.good{border-color:#548b70;color:#c6f6d9}\n#tab-advisor .adv-pill.warn{border-color:#9d7654;color:#f1d6ae}\n#tab-advisor .adv-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:11px 0}\n#tab-advisor .adv-actions button,#tab-advisor .adv-actions a{padding:9px 11px;font-size:12px;border-radius:8px}\n#tab-advisor .adv-actions a{color:#f1d6a5;border:1px solid #766346;background:#312b24;text-decoration:none;font-weight:700}\n#tab-advisor .adv-details{border-top:1px solid #405169;padding-top:10px;margin-top:10px}\n#tab-advisor .adv-details summary{cursor:pointer;color:#edcb8e;font-weight:700;font-size:13px}\n#tab-advisor .adv-details ol{padding-left:20px;color:#c9d6e4;font-size:13px;line-height:1.6}\n#tab-advisor .adv-cost{border:1px solid #41556d;background:#1b2a3e;border-radius:9px;padding:11px;margin-top:11px}\n#tab-advisor .adv-cost p{margin:3px 0}\n#tab-advisor .adv-cost input{max-width:220px;padding:8px;font-size:13px}\n#tab-advisor .adv-empty{padding:20px;text-align:center;color:#b9c7d4}\n#tab-advisor .adv-mini{color:#afbdce;font-size:12px}\n#tab-advisor .adv-step-label{color:#f3d398;font-size:11px;font-weight:800;letter-spacing:.08em}\n#tab-advisor .adv-footer{font-size:12px;color:#b9c5d2;margin-top:14px}\n@media(max-width:660px){#tab-advisor .adv-stats{grid-template-columns:repeat(2,minmax(0,1fr))}#tab-advisor .adv-card-head{flex-direction:column}#tab-advisor .adv-controls{grid-template-columns:repeat(2,minmax(0,1fr))}#tab-advisor .adv-controls .adv-wide{grid-column:span 2}}\n";
document.head.append(sheet);
const nav=$('dash')?.querySelector('.tabs');
if(!nav)return;
const tab=document.createElement('button');
tab.id='aion-advisor-button';tab.type='button';tab.textContent='✦ Upgrade-Plan';
const first=nav.querySelector('[data-tab="gear"]')||nav.firstElementChild;
if(first)first.before(tab);else nav.append(tab);
const page=document.createElement('section');page.id='tab-advisor';page.className='hidden';
page.innerHTML='<section class="panel">'+
 '<div class="adv-top"><div><div class="eyebrow">AION 2 · DEIN NÄCHSTER SCHRITT</div>'+
 '<h2>✦ Persönlicher Gear-Advisor</h2></div>'+
 '<button id="adv-refresh" type="button">↻ Charakter neu einlesen</button></div>'+
 '<p class="adv-intro" id="adv-identity">Analysiert ausgelesene Ausrüstung, Zusatzwerte, Daevanion und deinen manuell gespeicherten Pantheon-Fortschritt.</p>'+
 '<div class="adv-notice">Die Reihenfolge ist eine <b>regelbasierte Empfehlung, keine garantierte BiS- oder DPS-Simulation</b>. Aktuelle Marktpreise, dein Inventar und Pantheon-Besitz sind nicht öffentlich abrufbar. Reroll-Kosten gelten jeweils für <b>einen Versuch</b>.</div>'+
 '<div class="adv-stats" id="adv-stats"></div>'+
 '<div class="adv-next" id="adv-next" aria-live="polite"></div>'+
 '<div class="adv-controls">'+
 '<div class="field"><label for="adv-role">Mein Spielstil</label><select id="adv-role"><option value="dps">Solo / PvE-DPS</option><option value="heal">Gruppe / Heilung</option></select></div>'+
 '<div class="field"><label for="adv-sort">Reihenfolge</label><select id="adv-sort"><option value="priority">Empfohlene Priorität</option><option value="cost">Bekannte Kina-Kosten zuerst</option></select></div>'+
 '<div class="field"><label for="adv-reset-price">Wert eines Reset-Kodex (Kina)</label><input type="number" id="adv-reset-price" min="0" step="1" placeholder="Unbekannt"></div>'+
 '<div class="field"><label for="adv-budget">Mein verfügbares Budget (Kina)</label><input type="number" id="adv-budget" min="0" step="1" placeholder="Optional"></div>'+
 '</div>'+
 '<p class="adv-mini">Die Materialbewertung gibst du selbst ein. Ohne sie zeigen wir nur die festen Kina-Gebühren und die benötigten Reset-Kodexe. Ein günstiger Einzelversuch ist noch keine günstige garantierte Verbesserung.</p>'+
 '<div class="adv-filter" id="adv-filters" aria-label="Upgrade-Kategorien">'+
 '<button type="button" data-adv-filter="all" aria-pressed="true">Alle</button>'+
 '<button type="button" data-adv-filter="gear" aria-pressed="false">Gear / Reroll</button>'+
 '<button type="button" data-adv-filter="farm" aria-pressed="false">Farmen</button>'+
 '<button type="button" data-adv-filter="pantheon" aria-pressed="false">Pantheon</button>'+
 '<button type="button" data-adv-filter="skills" aria-pressed="false">Daevanion</button>'+
 '<button type="button" data-adv-filter="check" aria-pressed="false">Daten prüfen</button>'+
 '</div>'+
 '<div class="field" style="max-width:290px;margin:12px 0"><label for="adv-hide-done">Anzeige</label>'+
 '<select id="adv-hide-done"><option value="open">Nur offene Schritte</option><option value="all">Auch erledigte anzeigen</option></select></div>'+
 '<div class="adv-list" id="adv-list"></div>'+
 '<p class="adv-footer">Quellen: öffentliches NCSOFT-Charakterprofil, EU-Clienttabellen und von dir erfasste Sammlung. Externe Datenbanken werden zur Recherche geöffnet, nicht im Hintergrund kopiert. <a href="https://aion2.gg/database/tables/soul-binding-costs" target="_blank" rel="noopener noreferrer">Kina- und Reset-Kodex-Kosten</a> · <a href="https://aion2.gg/tools/soul-imprint" target="_blank" rel="noopener noreferrer">Slot-Pools</a> · <a href="https://aion2.gg/database/drop-rates?type=Equip" target="_blank" rel="noopener noreferrer">EU-Drops</a>.</p>'+
 '</section>';
$('dash').append(page);
const preview=document.createElement('section');preview.id='advisor-preview';preview.className='panel';
preview.innerHTML='<div class="eyebrow">NEU · CHARAKTER-ANALYSE</div><h2>✦ Was sollte ich als Nächstes verbessern?</h2>'+
 '<p>Rerolls, Verstärkungen, Farmziele und Pantheon in einem nachvollziehbaren Verbesserungsplan. Kosten und Fundorte mit Quellenlinks.</p>'+
 '<div class="actions"><button id="adv-preview-open" type="button" class="primary">Upgrade-Plan öffnen</button>'+
 '<button id="adv-preview-demo" type="button">Mit Demo ansehen</button></div>';
const after=$('pantheon-preview')||$('nc-official-import')||document.querySelector('.hero');
if(after)after.after(preview);
let currentKey='',saved={done:[],replacementPrices:{},resetPrice:'',budget:'',role:'',sort:'priority',filter:'all',hideDone:'open'};
let pantheonCatalog=[],pantheonLoading=true;
const stateDefault=()=>({done:[],replacementPrices:{},resetPrice:'',budget:'',role:'',sort:'priority',filter:'all',hideDone:'open'});
const identity=()=>String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
const storageKey=()=> 'aion2-advisor-v1:'+identity();
function ensureCharacter(){
 const key=storageKey();
 if(key===currentKey)return;
 currentKey=key;
 let x=null;
 try{x=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 saved={...stateDefault(),...(x&&typeof x==='object'?x:{})};
 if(!Array.isArray(saved.done))saved.done=[];
 if(!saved.replacementPrices||typeof saved.replacementPrices!=='object')saved.replacementPrices={};
 if(!['heal','dps'].includes(saved.role))saved.role=data?.mode==='heal'?'heal':'dps';
 if(!['cost','priority'].includes(saved.sort))saved.sort='priority';
 if(!['all','gear','farm','pantheon','skills','check'].includes(saved.filter))saved.filter='all';
 if(!['open','all'].includes(saved.hideDone))saved.hideDone='open';
 $('adv-role').value=saved.role;$('adv-sort').value=saved.sort;
 $('adv-reset-price').value=saved.resetPrice??'';
 $('adv-budget').value=saved.budget??'';
 $('adv-hide-done').value=saved.hideDone;
 setFilter(saved.filter);
}
function persist(){
 try{localStorage.setItem(currentKey,JSON.stringify(saved));return true}catch{return false}
}
function setFilter(filter){
 saved.filter=filter;
 $('adv-filters').querySelectorAll('[data-adv-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.advFilter===filter)));
}
function pantheonState(){
 const key='aion2-pantheon-v1:'+identity();
 let p=null,hasProgress=false;
 try{const raw=localStorage.getItem(key);hasProgress=raw!==null;if(raw)p=JSON.parse(raw)}catch{}
 return {items:pantheonCatalog,hasProgress,owned:Array.isArray(p?.owned)?p.owned:[],
  placed:Array.isArray(p?.placed)?p.placed:[]};
}
function analyzed(){
 ensureCharacter();
 return core.analyze(data,{
  role:saved.role,
  resetPrice:saved.resetPrice,
  replacementPrices:saved.replacementPrices,
  pantheon:pantheonState()
 });
}
function done(id){return saved.done.includes(id)}
function renderCost(a){
 if(!a.cost)return '';
 const c=a.cost,price=saved.replacementPrices[a.slot];
 let message='<b>1 Reroll-Versuch:</b> '+num(c.kina)+' Kina + '+num(c.reset)+' Reset-Kodex'+(c.reset===1?'':'e')+'.';
 if(c.total!==null)message+=' <b>Bewertete Gesamtkosten:</b> '+num(c.total)+' Kina.';
 else message+=' <span class="adv-mini">Materialwert noch unbekannt.</span>';
 if(price!==undefined&&String(price).trim()!==''&&Number(price)>0&&c.total!==null){
  message+='<p><b>Preisvergleich:</b> 1 Versuch ist '+(c.total<Number(price)?'günstiger':'nicht günstiger')+
   ' als der eingetragene Ersatzpreis von '+num(price)+' Kina. <b>Kein garantierter Zielwert!</b></p>';
 }
 return '<div class="adv-cost"><p>'+message+'</p>'+
 '<div class="field" style="margin-top:9px"><label for="adv-price-'+esc(a.slot.replace(/[^a-z0-9]/gi,'-'))+'">Preis eines Ersatzitems (Kina, manuell)</label>'+
 '<input id="adv-price-'+esc(a.slot.replace(/[^a-z0-9]/gi,'-'))+'" type="number" min="0" step="1" data-adv-price="'+esc(a.slot)+'" placeholder="Unbekannt" value="'+
 esc(price??'')+'"></div></div>';
}
function categoryLabel(a){
 return {gear:'Gear / Reroll',farm:'Farmziel',pantheon:'Pantheon',skills:'Daevanion',check:'Daten prüfen'}[a.category]||'Upgrade';
}
function costLabel(a){
 if(!a.cost)return 'Kosten offen';
 if(a.cost.total===null)return num(a.cost.kina)+' Kina + Material';
 return num(a.cost.total)+' Kina / Versuch';
}
function renderAction(a,index){
 const isDone=done(a.id);
 const budget=Number(saved.budget),hasBudget=String(saved.budget).trim()!==''&&Number.isFinite(budget)&&budget>=0;
 const over=hasBudget&&a.cost?.total!==null&&a.cost?.total!==undefined&&a.cost.total>budget;
 const source=a.sourceHint?'<p class="adv-mini"><b>Fundort-Hinweis:</b> '+esc(a.sourceHint.name)+' – '+esc(a.sourceHint.note)+'</p>':'';
 const links=(a.links||[]).map(x=>{
  const url=allowedUrl(x.url);
  return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+' ↗</a>':'';
 }).join('');
 const jump=a.jump?'<button type="button" data-adv-jump="'+esc(a.jump)+'">Im Gear Checker öffnen</button>':'';
 const copy=a.itemName?'<button type="button" data-adv-copy="'+esc(a.itemName)+'">Itemnamen kopieren</button>':'';
 const steps=(a.steps||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 return '<article class="adv-card '+(isDone?'done':'')+'" id="adv-task-'+index+'">'+
 '<div class="adv-card-head"><div><div class="adv-step-label">SCHRITT '+(index+1)+' · '+esc(categoryLabel(a))+'</div>'+
 '<h3>'+esc(a.title)+'</h3></div><div class="adv-pills">'+
 '<span class="adv-pill '+(a.confidence==='missing'?'warn':'')+'">'+esc(a.evidence||'Empfehlung')+'</span>'+
 '<span class="adv-pill">'+esc(costLabel(a))+'</span>'+
 (over?'<span class="adv-pill warn">Über deinem Budget</span>':'')+
 (isDone?'<span class="adv-pill good">✓ Erledigt markiert</span>':'')+
 '</div></div>'+
 '<p>'+esc(a.summary)+'</p>'+
 (a.warning?'<p class="adv-mini">⚠ '+esc(a.warning)+'</p>':'')+
 source+
 '<div class="adv-actions">'+
 '<button type="button" data-adv-done="'+esc(a.id)+'" aria-pressed="'+isDone+'">'+(isDone?'↩ Wieder öffnen':'✓ Als erledigt markieren')+'</button>'+
 jump+copy+links+'</div>'+
 renderCost(a)+
 '<details class="adv-details"><summary>Warum dieser Schritt? · Anleitung ansehen</summary>'+
 '<p>'+esc(a.why)+'</p><ol>'+steps+'</ol>'+
 (a.targets?.length?'<p class="adv-mini"><b>Mögliche Zielwerte im Slotpool:</b> '+esc(a.targets.join(' · '))+'</p>':'')+
 '<p class="adv-mini"><b>Datenbasis:</b> '+esc(a.evidence||'Heuristik')+'. Änderungen im Spiel werden erst nach erneutem Import berücksichtigt.</p>'+
 '</details></article>';
}
function renderAdvisor(){
 ensureCharacter();
 const report=analyzed();
 const all=report.actions;
 const open=all.filter(x=>!done(x.id));
 const costKnown=open.filter(x=>x.cost?.total!==null&&x.cost?.total!==undefined).length;
 const imported=report.imported;
 const time=report.importedAt?new Date(report.importedAt):null;
 const stale=time&&!Number.isNaN(time.getTime())&&Date.now()-time.getTime()>86400000;
 const profileClass=report.className||'Klasse unbekannt';
 const roleName=saved.role==='heal'?'Gruppenheilung':'PvE-DPS';
 $('adv-identity').textContent=report.characterName+' · '+profileClass+
  (report.level?' · Stufe '+report.level:'')+' · '+roleName+' · '+report.slotCount+' auswertbare Gear-Slots. '+
  (imported?'NCSOFT-Profil vom '+(time&&!Number.isNaN(time.getTime())?time.toLocaleString('de-DE'):'unbekannten Datum')+'.':
   'Manuelle oder Demo-Werte – keine automatische Bestätigung.');
 const badges=[
 ['Offene Schritte',open.length,'Regelbasierte Vorschläge'],
 ['Gear-Slots',report.slotCount,imported?'Aus öffentlichem Profil':'Manuell / Demo'],
 ['Bekannte Vollkosten',costKnown,'Nur 1 Reroll-Versuch'],
 ['Erledigt markiert',all.length-open.length,'Nur lokal gespeichert']
 ];
 $('adv-stats').innerHTML=badges.map(([title,note,sub])=>
  '<div><small>'+esc(title)+'</small><strong>'+esc(note)+'</strong><small>'+esc(sub)+'</small></div>').join('');
 const first=open[0];
 $('adv-next').innerHTML=first?
  '<div class="adv-step-label">DEIN NÄCHSTER EMPFOHLENER SCHRITT</div>'+
  '<h3>'+esc(first.title)+'</h3><p>'+esc(first.summary)+'</p>'+
  '<span class="adv-pill">'+esc(costLabel(first))+'</span> '+
  '<button type="button" id="adv-go-next" class="primary">Details ansehen</button>':
  '<div class="adv-step-label">STATUS</div><h3>'+(report.slotCount?'Keine offenen Vorschläge':'Noch keine Ausrüstung erfasst')+'</h3>'+
  '<p>'+(report.slotCount?'Deine Liste enthält aktuell keine weiteren regelbasierten Aufgaben. Das bedeutet nicht, dass dein Charakter BiS ist.':
   'Importiere deinen EU-Charakter oder starte die Demo, um Empfehlungen zu sehen.')+'</p>';
 if(stale)$('adv-next').innerHTML+='<p class="adv-mini">⚠ Der letzte Import ist älter als 24 Stunden. Neu einlesen, um den aktuellen Stand zu prüfen.</p>';
 if(!/cleric|kleriker/i.test(profileClass))$('adv-next').innerHTML+='<p class="adv-mini">Für diese Klasse werden derzeit allgemeine Slot-Prioritäten statt eines geprüften Klassen-BiS verwendet.</p>';
 const filtered=all.filter(x=>(saved.filter==='all'||x.category===saved.filter)&&
  (saved.hideDone==='all'||!done(x.id)));
 filtered.sort((a,b)=>{
  if(saved.sort==='cost'){
   const ac=a.cost?.total,bc=b.cost?.total;
   const va=ac===null||ac===undefined?Infinity:ac;
   const vb=bc===null||bc===undefined?Infinity:bc;
   return va-vb||b.priority-a.priority;
  }
  return b.priority-a.priority;
 });
 $('adv-list').innerHTML=filtered.length?filtered.map(renderAction).join(''):
  '<div class="adv-empty">Keine Schritte für diesen Filter. Wechsel zu „Alle“ oder zeige erledigte Aufgaben an.</div>';
 const next=$('adv-go-next');
 if(next)next.addEventListener('click',()=>{
  const found=filtered.findIndex(x=>x.id===first.id);
  if(found<0){setFilter('all');$('adv-hide-done').value='open';saved.hideDone='open';renderAdvisor();return}
  $('adv-task-'+found)?.scrollIntoView({behavior:'smooth',block:'center'});
  $('adv-task-'+found)?.querySelector('details')?.setAttribute('open','');
 });
}
function openAdvisor(){
 $('dash').classList.remove('hidden');
 nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===tab));
 for(const id of ['gear','upgrades','pets','daevanion','pantheon'])$('tab-'+id)?.classList.add('hidden');
 page.classList.remove('hidden');
 renderAdvisor();
 page.scrollIntoView({behavior:'smooth',block:'start'});
}
tab.addEventListener('click',openAdvisor);
nav.querySelectorAll('button').forEach(b=>{
 if(b!==tab)b.addEventListener('click',()=>{page.classList.add('hidden');tab.classList.remove('active')});
});
$('adv-preview-open').addEventListener('click',()=>{
 if(!Object.keys(data?.gear||{}).length){
  $('nc-official-import')?.scrollIntoView({behavior:'smooth',block:'start'});
  return;
 }
 openAdvisor();
});
$('adv-preview-demo').addEventListener('click',()=>{
 $('demo')?.click();
 openAdvisor();
});
$('adv-refresh').addEventListener('click',()=>{
 if(!data?.sourceRef?.sid||!data?.name){
  $('nc-official-import')?.scrollIntoView({behavior:'smooth',block:'start'});
  $('adv-refresh').textContent='Bitte zuerst EU-Charakter importieren';
  return;
 }
 $('nc-server-select').value=String(data.sourceRef.sid);
 $('nc-character-name').value=String(data.name);
 $('nc-import-name').click();
});
$('adv-filters').addEventListener('click',e=>{
 const b=e.target.closest('[data-adv-filter]');if(!b)return;
 setFilter(b.dataset.advFilter);persist();renderAdvisor();
});
$('adv-list').addEventListener('click',async e=>{
 const mark=e.target.closest('[data-adv-done]');
 if(mark){
  const id=mark.dataset.advDone;
  saved.done=done(id)?saved.done.filter(x=>x!==id):[...saved.done.slice(-499),id];
  persist();renderAdvisor();return;
 }
 const jump=e.target.closest('[data-adv-jump]');
 if(jump){
  const target=jump.dataset.advJump==='pantheon'?'pantheon-tab-button':'aion-board-button';
  $(target)?.click();return;
 }
 const copy=e.target.closest('[data-adv-copy]');
 if(copy){
  try{await navigator.clipboard.writeText(copy.dataset.advCopy);copy.textContent='✓ Name kopiert';}
  catch{copy.textContent='Kopieren nicht verfügbar';}
 }
});
$('adv-list').addEventListener('change',e=>{
 const input=e.target.closest('[data-adv-price]');if(!input)return;
 const value=input.value;
 if(value===''||!Number.isFinite(Number(value))||Number(value)<0)delete saved.replacementPrices[input.dataset.advPrice];
 else saved.replacementPrices[input.dataset.advPrice]=Number(value);
 persist();renderAdvisor();
});
for(const [id,key] of [['adv-role','role'],['adv-sort','sort'],['adv-reset-price','resetPrice'],
 ['adv-budget','budget'],['adv-hide-done','hideDone']]){
 $(id).addEventListener(id==='adv-reset-price'||id==='adv-budget'?'change':'change',e=>{
  saved[key]=e.target.value;persist();renderAdvisor();
 });
}
const oldRender=render;
render=function(){oldRender();renderAdvisor()};
(async()=>{
 try{
  const r=await fetch('./pantheon-catalog.json?v=2',{cache:'no-cache'});
  if(r.ok){const json=await r.json();if(Array.isArray(json.items))pantheonCatalog=json.items;}
 }catch{/* Pantheon unavailable: Gear recommendations remain functional. */}
 finally{pantheonLoading=false;renderAdvisor()}
})();
renderAdvisor();
})();
