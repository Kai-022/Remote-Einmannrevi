/* Pantheon focus guide for PvE Cleric. All ranking values are advisory only.
   Deity effect mapping: aion2.gg/guides/stats-explained (October 2026).
   Cleric build guidance: lum.gg/aion-2/builds/cleric-pve. */
(()=>{
'use strict';
const root=document.getElementById('pan-priority-guide');
if(!root)return;
const $=id=>document.getElementById(id);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gods={
 Destruction:'Zerstörung (Zikel)',Time:'Zeit (Siel)',Wisdom:'Weisheit (Lumiel)',
 Illusion:'Illusion (Kaisinel)',Death:'Tod (Triniel)',Freedom:'Freiheit (Vaizel)',
 Space:'Raum (Israphel)',Justice:'Gerechtigkeit (Nezekan)',
 Destiny:'Schicksal (Marchutan)',Life:'Leben (Yustiel)'
};
const effects={
 Destruction:'Angriff + Perfektionsresistenz',
 Time:'Kampftempo + Widerstand gegen Doppelangriffe',
 Wisdom:'Doppelchance + geringere MP-Kosten',
 Illusion:'Kürzere Abklingzeiten + Ausdauerdurchdringung',
 Justice:'Verteidigung + Perfektionschance',
 Life:'Lebenspunkte + Regenerationschance',
 Death:'Kritischer Treffer + Regenerationsdurchdringung',
 Freedom:'Präzision + Ausweichen',
 Destiny:'Mana + Ausdauerchance',
 Space:'Bewegungstempo + Blockchance'
};
const order={
 hybrid:['Time','Wisdom','Illusion','Destruction','Justice','Life','Death','Freedom','Destiny','Space'],
 heal:['Time','Illusion','Justice','Life','Wisdom','Destruction','Death','Freedom','Destiny','Space'],
 dps:['Destruction','Time','Wisdom','Illusion','Death','Justice','Freedom','Life','Destiny','Space']
};
let catalog=[],fetchState='loading',activeKey='',role='hybrid';
function key(){
 return String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'EU-Charakter').normalize('NFKC');
}
function stored(k){
 try{const value=JSON.parse(localStorage.getItem(k)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return {}}
}
function selectedRole(){
 const identity=key();
 if(identity===activeKey)return;
 activeKey=identity;
 role=order[data?.mode]?data.mode:'hybrid';
 try{const v=localStorage.getItem('aion2-pantheon-role-v1:'+identity);if(order[v])role=v}catch{}
}
function officialStats(){
 const out={};
 for(const stat of data?.characterExtras?.stats||[]){
  const match=String(stat?.name||'').match(/^(Destruction|Time|Wisdom|Illusion|Death|Freedom|Space|Justice|Destiny|Life)\s*\[/);
  if(match&&Number.isFinite(Number(stat.value)))out[match[1]]=Number(stat.value);
 }
 return out;
}
function buildScore(item){
 const priorities=order[role];
 return Object.entries(item.stats||{}).reduce((sum,[stat,points])=>{
  const i=priorities.indexOf(stat);
  const value=Number(points);
  return sum+(i<0||!Number.isFinite(value)?0:value*(i<3?7-i:i<5?4-i*.4:1));
 },0);
}
function tile(name,i,stats){
 const value=stats[name];
 return '<div class="pan-priority-line '+(i<3?'top':'')+'">'+
 '<span class="pan-priority-rank">'+(i+1)+'.</span>'+
 '<div class="pan-priority-main"><strong>'+safe(gods[name])+'</strong>'+
 '<small>'+safe(effects[name])+'</small></div>'+
 '<span class="pan-current-points">'+(value===undefined?'Wert nicht geladen':value+' Punkte')+'</span></div>';
}
function nextPieces(){
 const results=$('pan-priority-next');
 if(fetchState==='loading'){results.innerHTML='<p class="pan-lead">Sammelstücke werden geladen …</p>';return}
 if(fetchState==='failed'){results.innerHTML='<p class="pan-lead">Der Pantheon-Katalog ist derzeit nicht erreichbar.</p>';return}
 const bridge=window.aionPantheonWTB;
 const identity=key(),saved=stored('aion2-pantheon-v1:'+identity);
 const owned=new Set(Array.isArray(saved.owned)?saved.owned:[]);
 const placed=new Set(Array.isArray(saved.placed)?saved.placed:[]);
 const race=String(data?.sourceRef?.sid||'')[0]==='1'?'elyos':String(data?.sourceRef?.sid||'')[0]==='2'?'asmodier':'';
 const limits={artwork:12,statue:4,colossus:1},used={artwork:0,statue:0,colossus:0};
 for(const x of catalog)if(placed.has(x.id))used[x.kind]=(used[x.kind]||0)+1;
 const choices=catalog.filter(x=>x.stats&&Object.keys(x.stats).length&&!owned.has(x.id)&&!placed.has(x.id)&&
  (!race||x.faction==='alle'||x.faction===race));
 const sourceFor=x=>bridge?.acquireInfo(x)||{mode:'unknown',label:'Fundort prüfen',where:x.where||'Unbekannt'};
 const shop=choices.filter(x=>['shop','market','both'].includes(sourceFor(x).mode))
  .sort((a,b)=>buildScore(b)-buildScore(a)).slice(0,3);
 const farm=choices.filter(x=>!['shop','market','both'].includes(sourceFor(x).mode))
  .sort((a,b)=>buildScore(b)-buildScore(a)).slice(0,3);
 const heading=(label,items)=>'<h5 class="pan-buy-group">'+label+'</h5>'+
 (items.length?items.map((x,i)=>{
  const stats=Object.entries(x.stats||{}).sort((a,b)=>order[role].indexOf(a[0])-order[role].indexOf(b[0]))
   .map(([k,n])=>(gods[k]||k)+' +'+n).join(' · ');
  const source=sourceFor(x),tracked=(bridge?.planned()||[]).some(p=>p.id===x.id);
  const full=used[x.kind]>=limits[x.kind];
  return '<div class="pan-next-card"><div><strong>'+(i+1)+'. '+safe(x.nameDe||x.name)+'</strong>'+
   '<small>'+safe(source.label)+' · '+safe(source.where)+'</small>'+
   '<small>'+safe(stats)+'</small>'+
   (full?'<small>Aufstellplatz voll – vorhandenes Stück ggf. ersetzen</small>':'')+
   '<small class="pan-cost-note">Aktueller Preis/Handelbarkeit nicht live geprüft.</small></div>'+
   '<button type="button" data-pan-wtb-add="'+safe(x.id)+'" '+(tracked?'disabled':'')+'>'+
    (tracked?'✓ Auf WTB':'＋ Auf WTB')+'</button></div>';
 }).join(''):'<p class="pan-lead">Aktuell keine entsprechenden offenen Sammelstücke.</p>');
 results.innerHTML='<p class="pan-guide-tip">Vorschläge nach Bonus-Priorität deines Builds, nicht nach Preis oder Farmzeit. Nur tatsächlich gesammelte Stücke werden übersprungen.</p>'+
  heading('🛒 Im Shop / Handel prüfen',shop)+heading('⚔ Durch Spielen bekommen',farm)+
  '<div class="pan-buy-footer"><button type="button" data-pan-open-wtb>🛒 Meine WTB-Liste öffnen</button></div>';
}
function render(){
 selectedRole();
 for(const b of root.querySelectorAll('[data-pan-role]')){
  b.setAttribute('aria-pressed',String(b.dataset.panRole===role));
 }
 const priorities=order[role],stats=officialStats();
 $('pan-priority-list').innerHTML=priorities.slice(0,5).map((x,i)=>tile(x,i,stats)).join('');
 $('pan-priority-all').innerHTML=priorities.map((x,i)=>tile(x,i,stats)).join('');
 nextPieces();
}
root.addEventListener('click',event=>{
 const roleButton=event.target.closest('[data-pan-role]');
 if(roleButton&&order[roleButton.dataset.panRole]){
  selectedRole();role=roleButton.dataset.panRole;
  try{localStorage.setItem('aion2-pantheon-role-v1:'+key(),role)}catch{}
  render();return;
 }
 const add=event.target.closest('[data-pan-wtb-add]');
 if(add){
  const item=catalog.find(x=>x.id===add.dataset.panWtbAdd);
  if(item){
   if(window.aionPantheonWTB?.add({id:item.id,name:item.nameDe||item.name,kind:item.kind,stats:item.stats,where:item.where}))
    render();
   else alert('Der Eintrag konnte nicht auf der WTB-Liste gespeichert werden.');
  }
  return;
 }
 if(event.target.closest('[data-pan-open-wtb]')){
  if(window.aionWTB?.open)window.aionWTB.open(true);
  else alert('Die WTB-Liste ist noch nicht verfügbar.');
  return;
 }
 const choice=event.target.closest('[data-pan-guide-id]');
 if(!choice)return;
 const piece=catalog.find(x=>x.id===choice.dataset.panGuideId);
 if(!piece)return;
 const search=$('pan-search'),kind=$('pan-kind'),status=$('pan-status');
 if(kind){kind.value=piece.kind;kind.dispatchEvent(new Event('change',{bubbles:true}));}
 if(status){status.value='all';status.dispatchEvent(new Event('change',{bubbles:true}));}
 if(search){search.value=piece.nameDe||piece.name;search.dispatchEvent(new Event('input',{bubbles:true}));}
 $('pan-cards')?.scrollIntoView({behavior:'smooth',block:'start'});
});
$('pantheon-tab-button')?.addEventListener('click',render);
document.querySelector('[data-armory="pantheon"]')?.addEventListener('click',render);
window.addEventListener('aion2:pantheon-updated',render);
window.addEventListener('aion2:wtb-updated',render);
$('tab-pantheon')?.addEventListener('click',event=>{
 if(event.target.closest('[data-pan-action]'))queueMicrotask(render);
});
fetch('./pantheon-catalog.json?v=2',{cache:'no-cache'})
.then(async response=>{if(!response.ok)throw Error('HTTP '+response.status);
 const json=await response.json();if(!Array.isArray(json.items))throw Error('Unbekanntes Format');
 catalog=json.items.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string');
 fetchState='ready';
})
.catch(()=>{fetchState='failed'})
.finally(render);
render();
})();