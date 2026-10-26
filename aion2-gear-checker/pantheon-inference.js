/* Experimental, non-authoritative Pantheon decomposition from deity stat totals. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stats=['Destruction','Time','Justice','Death','Freedom','Space','Wisdom','Illusion','Destiny','Life'];
const de={Destruction:'Zerstörung',Time:'Zeit',Justice:'Gerechtigkeit',Death:'Tod',Freedom:'Freiheit',Space:'Raum',Wisdom:'Weisheit',Illusion:'Illusion',Destiny:'Schicksal',Life:'Leben'};
const limits={colossus:1,statue:4,artwork:12};
const tab=$('tab-pantheon');
if(!tab)return;
const style=document.createElement('style');style.textContent="#pan-infer{border:1px solid #586d86;background:#16263a;border-radius:12px;padding:15px;margin:13px 0}#pan-infer p,#pan-infer small{color:#c0ccd9;font-size:12px}#pan-infer .pi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin:12px 0}#pan-infer .pi-stat{padding:8px;border-radius:8px;border:1px solid #465b76}#pan-infer input{padding:7px;width:100%}#pan-infer .pi-result{margin:9px 0;padding:12px;background:#24354c;border:1px solid #5c7088;border-radius:9px}#pan-infer .pi-result b{color:#efce96}#pan-infer button{margin:8px 8px 8px 0}#pan-infer .pi-chip{display:inline-block;margin:3px;padding:4px 7px;border-radius:6px;background:#354961;font-size:12px}";document.head.append(style);
const panel=document.createElement('section');panel.id='pan-infer';
panel.innerHTML='<div class="eyebrow">EXPERIMENT · GÖTTLICHE WERTE</div>'+
'<h3>⌕ Pantheon aus Göttlichen Werten abschätzen</h3>'+
'<p>Deine zehn ausgelesenen Göttlichen Werte sind <b>Gesamtwerte</b> – nicht allein der Pantheon-Anteil. Arkana, Armbänder und Monolith liefern ebenfalls Punkte. Die Vorschläge sind <b>mögliche Aufstellungen, niemals ein Besitznachweis</b>.</p>'+
'<p id="pi-status">Kein Charakterimport geladen.</p>'+
'<details><summary>Optional: Göttliche Punkte aus anderen Quellen abziehen</summary>'+
'<p>Trage nur Werte ein, die du unabhängig bestätigen kannst. Ein leeres Feld bedeutet „unbekannt“, nicht null. Die Berechnung wird deutlich unsicherer, solange fremde Punkte fehlen.</p>'+
'<div id="pi-inputs" class="pi-grid"></div></details>'+
'<div><button id="pi-calc" type="button" class="primary">Mögliche Aufstellung berechnen</button>'+
'<button id="pi-reset" type="button">Fremdbeiträge löschen</button></div>'+
'<p id="pi-note" aria-live="polite"></p><div id="pi-results"></div>'+
'<small>Die Berechnung markiert keine Gegenstände als gesammelt. Sie ist eine Annäherung mit einem begrenzten Katalog und kann bei identischen Attributsummen nicht entscheiden, welches Stück du tatsächlich besitzt.</small>';
const anchor=$('pan-summary');
if(anchor)anchor.before(panel);else tab.querySelector('.panel')?.append(panel);
let current='',extra={};
function storeKey(){return 'aion2-pantheon-estimator-v1:'+String(data?.sourceRef?.sid||'local')+':'+String(data?.sourceRef?.id||data?.name||'character')}
function load(){
 const key=storeKey();if(current===key)return;
 current=key;let s={};
 try{s=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 extra=s.extra&&typeof s.extra==='object'?s.extra:{};
}
function totals(){
 const list=data?.characterExtras?.stats;
 if(!Array.isArray(list))return {};
 const out={};
 for(const k of stats){
  const row=list.find(x=>String(x?.name||'').toLowerCase().startsWith(k.toLowerCase()+' ['));
  if(row&&Number.isFinite(Number(row.value))&&Number(row.value)>=0)out[k]=Number(row.value);
 }
 return out;
}
function refresh(){
 load();const all=totals(),count=stats.filter(k=>k in all).length;
 $('pi-status').textContent=(data?.name||'Charakter')+' · '+count+' von 10 Göttlichen Werten vorhanden. '+
  (count===10?'Berechnung möglich.':'Bitte zuerst einen EU-Charakter importieren.');
 $('pi-calc').disabled=count!==10;
 $('pi-inputs').innerHTML=stats.map(k=>'<div class="pi-stat"><b>'+esc(de[k])+'</b><small style="display:block">Gesamt: '+
 (all[k]??'?')+'</small><label for="pi-'+k+'">Andere Quellen</label>'+
 '<input type="number" min="0" max="'+(all[k]??0)+'" step="1" id="pi-'+k+
 '" data-pi-stat="'+k+'" value="'+esc(extra[k]??'')+'" placeholder="Unbekannt"></div>').join('');
}
// Greedy complementary constructions. Deliberately avoid an unsupported "confidence percentage".
function infer(items,target,mode){
 const remaining={...target},counts={artwork:0,statue:0,colossus:0},chosen=[];
 const fixed=items.filter(x=>x&&x.stats&&Object.keys(x.stats).length>=2&&limits[x.kind]&&
  Object.entries(x.stats).every(([k,v])=>Number.isFinite(Number(v))&&Number(v)>0&&Number(v)<=target[k])&&
  !['elite-unique','expedition'].includes(x.originalGroup)&&
  (x.faction!=='elyos'||!String(data?.sourceRef?.sid).startsWith('23'))&&
  (x.faction!=='asmodier'||!String(data?.sourceRef?.sid).startsWith('13')));
 for(const kind of ['colossus','statue','artwork']){
  const subset=fixed.filter(x=>x.kind===kind);
  while(counts[kind]<limits[kind]){
   const candidate=subset.filter(x=>!chosen.some(p=>p.id===x.id)&&
    Object.entries(x.stats).every(([k,v])=>Number(v)<=remaining[k]))
   .map(x=>{
    const total=Object.values(x.stats).reduce((sum,v)=>sum+Number(v),0);
    const coverage=Object.entries(x.stats).reduce((sum,[k,v])=>sum+Math.min(Number(v),remaining[k]),0);
    return {item:x,weight:mode===0?coverage:coverage/(total+1)+Object.keys(x.stats).length*.1};
   })
   .sort((a,b)=>b.weight-a.weight||String(a.item.id).localeCompare(String(b.item.id)))[0];
   if(!candidate)break;
   chosen.push(candidate.item);counts[kind]++;
   for(const [k,v] of Object.entries(candidate.item.stats))remaining[k]-=Number(v);
  }
 }
 const missing=stats.reduce((sum,k)=>sum+remaining[k],0);
 return {chosen,counts,remaining,missing};
}
async function calculate(){
 const raw=totals();if(stats.some(k=>raw[k]===undefined))return;
 let missingInputs=0;const target={};
 for(const k of stats){
  const value=extra[k];
  if(value===undefined||value===''){missingInputs++;target[k]=raw[k];continue}
  const n=Number(value);
  if(!Number.isInteger(n)||n<0||n>raw[k]){
   $('pi-note').textContent='Der eingegebene Fremdbeitrag für '+de[k]+' ist ungültig.';return;
  }
  target[k]=raw[k]-n;
 }
 let catalog;
 try{
  const res=await fetch('./pantheon-catalog.json?v=2',{cache:'force-cache'});
  if(!res.ok)throw Error('offline');
  catalog=(await res.json()).items;
 }catch{$('pi-note').textContent='Pantheon-Katalog konnte nicht geladen werden.';return}
 const solutions=[infer(catalog,target,0),infer(catalog,target,1)];
 const uniq=new Set();
 $('pi-note').textContent=(missingInputs?
   missingInputs+' Fremdbeiträge unbekannt: Das sind besonders grobe Beispiele, nicht deine erkannte Pantheon-Aufstellung.':
   'Andere Quellen wurden abgezogen. Auch eine rechnerisch passende Summe kann durch mehrere verschiedene Aufstellungen entstehen.')+
   ' Die Suche nutzt vereinfachte Kombinationen und ist nicht vollständig.';
 $('pi-results').innerHTML=solutions.filter(x=>{
  const key=x.chosen.map(p=>p.id).sort().join('|');
  if(uniq.has(key))return false;uniq.add(key);return true;
 }).map((s,i)=>'<div class="pi-result"><h4>Rechnerische Möglichkeit '+(i+1)+'</h4>'+
 '<p>'+s.chosen.length+' Gegenstände vorgeschlagen · '+s.missing+' nicht erklärte Punkte · '+
 s.counts.artwork+'/12 Gemälde, '+s.counts.statue+'/4 Statuen, '+s.counts.colossus+'/1 Koloss.</p>'+
 '<div>'+s.chosen.map(p=>'<span class="pi-chip">'+esc(p.nameDe||p.name)+'</span>').join('')+'</div>'+
 '<details><summary>Restwerte und mögliche Fundorte</summary><p>'+
 stats.filter(k=>s.remaining[k]>0).map(k=>de[k]+': '+s.remaining[k]).join(' · ')+
 '</p>'+s.chosen.map(p=>'<p><b>'+esc(p.nameDe||p.name)+'</b> – '+esc(p.where||'Fundort nicht erfasst')+'</p>').join('')+'</details>'+
 '</div>').join('')||'<p>Mit den verfügbaren Itemdaten keine sinnvolle Kombination gefunden.</p>';
}
$('pi-inputs').addEventListener('change',e=>{
 const el=e.target.closest('[data-pi-stat]');if(!el)return;
 const k=el.dataset.piStat;if(!stats.includes(k))return;
 extra[k]=el.value;
 try{localStorage.setItem(current,JSON.stringify({extra}))}catch{}
});
$('pi-calc').addEventListener('click',calculate);
$('pi-reset').addEventListener('click',()=>{
 extra={};try{localStorage.removeItem(current)}catch{}
 $('pi-results').innerHTML='';$('pi-note').textContent='Andere Quellen zurückgesetzt.';refresh();
});
const previous=render;
render=function(){previous();refresh()};
refresh();
})();
