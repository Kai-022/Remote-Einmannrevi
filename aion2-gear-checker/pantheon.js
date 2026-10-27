/* Public AION 2 Pantheon tracker. Progress saved locally per character. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={artwork:'Gemälde',statue:'Statue',colossus:'Koloss'};
const plurals={artwork:'Gemälde',statue:'Statuen',colossus:'Kolosse'};
const limit={artwork:12,statue:4,colossus:1};
const grades={Heroic:'Legendär',Unique:'Einzigartig',Epic:'Episch',Rare:'Selten',Common:'Gewöhnlich'};
const gods={Destruction:'Zerstörung (Zikel)',Time:'Zeit (Siel)',Wisdom:'Weisheit (Lumiel)',Illusion:'Illusion (Kaisinel)',Death:'Tod (Triniel)',Freedom:'Freiheit (Vaizel)',Space:'Raum (Israphel)',Justice:'Gerechtigkeit (Nezekan)',Destiny:'Schicksal (Marchutan)',Life:'Leben (Yustiel)'};
const weight={Destruction:3.2,Time:3,Wisdom:2.7,Illusion:2.1,Death:1.9,Freedom:1.2,Destiny:.7,Life:.6,Space:.6,Justice:.5};
const styles=document.createElement('style');
styles.textContent="\n#tab-pantheon .pan-lead{color:#b6c4d1;font-size:13px}\n#tab-pantheon .pan-note{padding:12px 13px;background:#30291e;border:1px solid #886c40;border-radius:9px;color:#f1d6a1;font-size:13px;margin:12px 0}\n#tab-pantheon .pan-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:9px;margin:14px 0}\n#tab-pantheon .pan-summary>div{padding:12px;background:#152133;border:1px solid #344961;border-radius:9px}\n#tab-pantheon .pan-summary strong{display:block;font-size:23px;color:#eacc91}\n#tab-pantheon .pan-summary small{display:block;font-size:12px;color:#bbc9d5}\n#tab-pantheon .pan-bonus{background:#15263b;border:1px solid #46617f;border-radius:9px;padding:13px;margin:12px 0}\n#tab-pantheon .pan-bonus-list{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}\n#tab-pantheon .pan-bonus-list span{font-size:12px;background:#293d51;padding:5px 8px;border-radius:6px}\n#tab-pantheon .pan-filter{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px;margin:15px 0}\n#tab-pantheon .pan-filter input,#tab-pantheon .pan-filter select{width:100%;min-height:41px}\n#tab-pantheon .pan-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(265px,1fr));gap:11px;margin:12px 0}\n#tab-pantheon .pan-card{display:flex;flex-direction:column;gap:9px;padding:12px;background:#172234;border:1px solid #45546b;border-radius:10px;min-width:0}\n#tab-pantheon .pan-card.owned{border-color:#b99b56}\n#tab-pantheon .pan-card.placed{border-color:#83d5a2;background:#17302c}\n#tab-pantheon .pan-top{display:flex;align-items:start;gap:10px}\n#tab-pantheon .pan-img{width:76px;height:76px;flex:0 0 76px;border:1px solid #506079;border-radius:9px;background:#26354a;display:grid;place-items:center;overflow:hidden}\n#tab-pantheon .pan-img img{width:100%;height:100%;object-fit:contain}\n#tab-pantheon .pan-img span{font-size:30px}\n#tab-pantheon .pan-title{flex:1;min-width:0;overflow-wrap:anywhere}\n#tab-pantheon .pan-title strong{display:block;line-height:1.3;font-size:14px}\n#tab-pantheon .pan-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px}\n#tab-pantheon .pan-tags span{font-size:11px;padding:2px 6px;border-radius:5px;background:#34362f;border:1px solid #625b44;color:#e6d9b5}\n#tab-pantheon .pan-source{font-size:12px;line-height:1.45;color:#c5d0df;margin:0;flex:1}\n#tab-pantheon .pan-buttons{display:flex;gap:7px;flex-wrap:wrap}\n#tab-pantheon .pan-buttons button{flex:1;padding:8px 6px;font-size:12px;font-weight:600;border-radius:8px;background:#283950;color:#e8effa;border:1px solid #5b6d87}\n#tab-pantheon .pan-buttons button[aria-pressed=true]{background:#2c493c;border-color:#82d5a6;color:#ccffe2}\n#tab-pantheon .pan-empty{text-align:center;color:#b5c1cf;padding:22px}\n#tab-pantheon .pan-custom{padding:13px;border:1px solid #4c607a;border-radius:9px}\n#tab-pantheon .pan-custom summary{cursor:pointer;color:#ebc788;font-weight:700}\n@media(max-width:650px){#tab-pantheon .pan-summary{grid-template-columns:repeat(2,1fr)}#tab-pantheon .pan-filter{grid-template-columns:repeat(2,1fr)}#tab-pantheon .pan-search-field{grid-column:span 2}#tab-pantheon .pan-cards{grid-template-columns:1fr}}\n";
document.head.append(styles);
const nav=$('dash')?.querySelector('.tabs');
if(!nav)return;
const button=document.createElement('button');
button.type='button';button.id='pantheon-tab-button';button.textContent='▣ Pantheon';
const anchor=nav.querySelector('#aion-board-button')||nav.querySelector('[data-tab="pets"]')||nav.lastElementChild;
if(anchor)anchor.after(button);else nav.append(button);
const page=document.createElement('section');page.id='tab-pantheon';page.className='hidden';
page.innerHTML='<section class="panel"><div class="eyebrow">AION 2 · SAMMLUNG</div>'+
'<h2>▣ Pantheon – Bilder, Statuen & Kolosse</h2>'+
'<p class="pan-lead">Fundorte und Pantheon-Boni nachschlagen, Sammelstücke abhaken und die besten 17 Dekorationen aufstellen.</p>'+
'<div class="pan-note"><b>Manuelle Sammlung:</b> Der bisherige öffentliche AION-2-Charakterimport zeigt nicht, welche Pantheon-Stücke du besitzt. Deine Häkchen und Aufstellungen werden getrennt für jeden Charakter in diesem Browser gespeichert – sie verändern nichts im Spiel.</div>'+
'<div class="pan-summary" id="pan-summary" aria-live="polite"></div>'+
'<div class="pan-bonus"><strong>Gottheiten-Attribute aus deinem importierten Charakterprofil</strong>'+'<div id="pan-official-stats" class="pan-bonus-list"></div>'+'<'+'small class="pan-lead">Gesamtwerte des Charakters – können auch von Armbändern, Arkana und anderen Quellen stammen. Das ist keine automatische Inventarliste.</small></div>'+
'<div class="pan-bonus"><strong>Pantheon-Boni deiner markierten Aufstellung</strong>'+
'<div id="pan-bonus-list" class="pan-bonus-list"></div>'+
'<small class="pan-lead">Nur aus den hier markierten Dekorationen, nicht deine vollständigen Charakterwerte.</small></div>'+
'<div class="pan-filter">'+
'<div class="field pan-search-field"><label for="pan-search">Suchen</label><input id="pan-search" type="search" placeholder="Gemälde, Statue oder Fundort …"></div>'+
'<div class="field"><label for="pan-kind">Kategorie</label><select id="pan-kind"><option value="all">Alle</option><option value="artwork">Gemälde</option><option value="statue">Statuen</option><option value="colossus">Kolosse</option></select></div>'+
'<div class="field"><label for="pan-status">Status</label><select id="pan-status"><option value="all">Alle</option><option value="missing">Fehlen mir</option><option value="owned">Gesammelt</option><option value="placed">Aufgestellt</option></select></div>'+
'<div class="field"><label for="pan-faction">Fraktion</label><select id="pan-faction"><option value="all">Beide</option><option value="elyos">Elyos</option><option value="asmodier">Asmodier</option></select></div>'+
'<div class="field"><label for="pan-sort">Sortieren</label><select id="pan-sort"><option value="dps">PvE-DPS-Bonus (Richtwert)</option><option value="grade">Seltenheit</option><option value="name">Name A–Z</option></select></div>'+
'</div><div class="pan-lead" id="pan-count"></div><div id="pan-feedback" class="status" aria-live="polite"></div>'+
'<div id="pan-cards" class="pan-cards"></div>'+
'<details class="pan-custom"><summary>+ Weiteres Sammelstück ergänzen</summary>'+
'<p class="pan-lead">Falls ein Stück im Katalog fehlt. Unbekannte Boni werden nicht erfunden.</p>'+
'<form id="pan-add-form" class="grid"><div class="field"><label for="pan-add-name">Name</label><input id="pan-add-name" required maxlength="80"></div>'+
'<div class="field"><label for="pan-add-kind">Kategorie</label><select id="pan-add-kind"><option value="artwork">Gemälde</option><option value="statue">Statue</option><option value="colossus">Koloss</option></select></div>'+
'<button type="submit" class="primary">Eintragen</button></form></details>'+
'<p class="tiny muted" style="margin-top:15px">Kuratierte Auswahl, keine vollständige Live-Datenbank. Einige Bilder sind Kategorie-Symbole. DPS-Sortierung ist keine Simulation. Quelle: <a href="https://wikily.gg/aion-2/pantheon-decor" target="_blank" rel="noopener noreferrer">Wikily</a>, <a href="https://github.com/austinsc/aion2-planner/blob/main/tools/pantheon_base.json" target="_blank" rel="noopener noreferrer">Pantheon-Guidedaten</a> und <a href="https://shugo.gg/de/items/pantheon" target="_blank" rel="noopener noreferrer">Shugo.GG</a>.</p>'+
'</section>';
$('dash').append(page);
const preview=document.createElement('section');
preview.id='pantheon-preview';preview.className='panel';
preview.innerHTML='<div class="eyebrow">NEU · PANTHEON-SAMMLUNG</div>'+
 '<h2>🖼️ Gemälde & Statuen sammeln</h2>'+
 '<p class="pan-lead">Entdecke Pantheon-Sammelstücke, ihre Fundorte und Boni. Du kannst sie auch ohne aktiven Charakterimport ansehen.</p>'+
 '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0">'+
 '<img src="./pantheon-icons/fire-temple.png" alt="Feuertempel-Gemälde" loading="lazy" style="width:88px;height:88px;object-fit:contain;border-radius:9px;background:#202b3d">'+
 '<img src="./pantheon-icons/bakarma.png" alt="Transzendierter Bakarma" loading="lazy" style="width:88px;height:88px;object-fit:contain;border-radius:9px;background:#202b3d">'+
 '<img src="./pantheon-icons/colossus-guardian-lord-nahma.webp" alt="Wächtergott Nahma" loading="lazy" style="width:88px;height:88px;object-fit:contain;border-radius:9px;background:#202b3d">'+
 '</div><button id="pantheon-preview-open" type="button" class="primary">▣ Pantheon-Sammlung öffnen</button>';
const host=$('nc-official-import')||document.querySelector('.hero');
host?.after(preview);
preview.querySelector('#pantheon-preview-open').addEventListener('click',()=>{
 $('dash').classList.remove('hidden');
 button.click();
});
button.addEventListener('click',()=>{
 nav.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b===button));
 for(const id of ['gear','upgrades','pets','daevanion'])$('tab-'+id)?.classList.add('hidden');
 page.classList.remove('hidden');
 renderPantheon();
 page.scrollIntoView({behavior:'smooth',block:'start'});
});
nav.querySelectorAll('button').forEach(b=>{
 if(b!==button)b.addEventListener('click',()=>{button.classList.remove('active');page.classList.add('hidden')});
});
let catalog=[],loading=true,loadError='',currentKey='';
let owned=new Set(),placed=new Set(),custom=[];
let filters={search:'',kind:'all',status:'all',faction:'all',sort:'dps'};
const items=()=>catalog.concat(custom);
function storageKey(){
 return 'aion2-pantheon-v1:'+String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'EU-Charakter').normalize('NFKC');
}
function ensureCharacter(){
 const key=storageKey();
 if(currentKey===key)return;
 currentKey=key;
 let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 owned=new Set(Array.isArray(saved.owned)?saved.owned.filter(x=>typeof x==='string'):[]);
 placed=new Set(Array.isArray(saved.placed)?saved.placed.filter(x=>typeof x==='string'):[]);
 custom=Array.isArray(saved.custom)?saved.custom.filter(x=>x&&typeof x.id==='string'&&
 typeof x.name==='string'&&limit[x.kind]).slice(0,70).map(x=>({
 id:x.id.slice(0,100),name:x.name.slice(0,80),kind:x.kind,grade:'',stats:null,
 faction:'alle',where:'Eigener Eintrag',userAdded:true,icon:defaultIcon(x.kind)
 })):[];
}
function defaultIcon(kind){return './pantheon-icons/'+(kind==='artwork'?'artwork':'statue')+'.webp'}
function save(){
 try{localStorage.setItem(currentKey,JSON.stringify({owned:[...owned],placed:[...placed],
 custom:custom.map(({id,name,kind})=>({id,name,kind}))}));return true}catch{return false}
}
function notice(value,bad=false){
 const e=$('pan-feedback');e.textContent=value;e.classList.toggle('error',bad);
}
function score(item){return Object.entries(item.stats||{}).reduce((s,[k,v])=>s+(weight[k]||0)*Number(v||0),0)}
function image(item){
 let src=String(item.icon||'');
 if(!/^\.\/pantheon-icons\/[a-z0-9-]+\.(webp|png)$/.test(src))src=defaultIcon(item.kind);
 const fallback=item.kind==='artwork'?'🖼️':item.kind==='statue'?'🗿':'🏛️';
 return '<div class="pan-img"><img src="'+esc(src)+'" alt="" loading="lazy"'+
 ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'block\'">'+
 '<span style="display:none">'+fallback+'</span></div>';
}
function statPills(stats){
 if(!stats||!Object.keys(stats).length)return '<span>Bonus nicht erfasst</span>';
 return Object.entries(stats).map(([k,v])=>'<span>'+esc(gods[k]||k)+' +'+esc(v)+'</span>').join('');
}
function card(item){
 const has=owned.has(item.id)||placed.has(item.id),put=placed.has(item.id);
 return '<article class="pan-card '+(put?'placed':has?'owned':'')+'">'+
 '<div class="pan-top">'+image(item)+'<div class="pan-title"><strong>'+esc(item.nameDe||item.name)+'</strong>'+
 '<div class="pan-tags"><span>'+esc(labels[item.kind])+'</span>'+
 (item.grade?'<span>'+esc(grades[item.grade]||item.grade)+'</span>':'')+
 (item.faction!=='alle'?'<span>'+esc(item.faction==='elyos'?'Elyos':'Asmodier')+'</span>':'')+
 '</div></div></div><div class="pan-tags">'+statPills(item.stats)+'</div>'+
 '<p class="pan-source"><b>Fundort:</b> '+esc(item.where||'Noch nicht hinterlegt')+'</p>'+
 '<div class="pan-buttons"><button data-pan-action="own" data-id="'+esc(item.id)+'" aria-pressed="'+has+'">'+(has?'✓ Gesammelt':'○ Besitze ich')+'</button>'+
 '<button data-pan-action="place" data-id="'+esc(item.id)+'" aria-pressed="'+put+'">'+(put?'✓ Aufgestellt':'Aufstellen')+'</button>'+
 (item.userAdded?'<button data-pan-action="remove" data-id="'+esc(item.id)+'">Entfernen</button>':'')+
 '</div></article>';
}
function renderSummary(){
 const official=(data?.characterExtras?.stats||[]).filter(x=>x&&
  Object.keys(gods).some(k=>String(x.name||'').startsWith(k+' ['))&&
  Number.isFinite(Number(x.value)));
 $('pan-official-stats').innerHTML=official.length?
 official.map(x=>'<span>'+esc(x.name)+': '+esc(x.value)+'</span>').join(''):
 '<small class="pan-lead">Noch keine offiziellen Charakterwerte importiert.</small>';
 const all=items(),totals={},counts={artwork:0,statue:0,colossus:0};
 for(const x of all)if(placed.has(x.id)){
  counts[x.kind]++;
  for(const [k,v] of Object.entries(x.stats||{}))totals[k]=(totals[k]||0)+Number(v||0);
 }
 const collected=all.filter(x=>owned.has(x.id)||placed.has(x.id)).length;
 $('pan-summary').innerHTML=[
 ['Gesammelt',collected+' / '+all.length,'Manuell erfasst'],
 ['Gemälde',counts.artwork+'/12','Aufgestellt'],
 ['Statuen',counts.statue+'/4','Aufgestellt'],
 ['Kolosse',counts.colossus+'/1','Aufgestellt']
 ].map(([n,v,d])=>'<div>'+esc(n)+'<strong>'+esc(v)+'</strong><small>'+d+'</small></div>').join('');
 const bonus=Object.entries(totals).sort((a,b)=>(weight[b[0]]||0)-(weight[a[0]]||0));
 $('pan-bonus-list').innerHTML=bonus.length?
 bonus.map(([k,v])=>'<span>'+esc(gods[k]||k)+': +'+esc(v)+'</span>').join(''):
 '<small class="pan-lead">Noch nichts aufgestellt.</small>';
}
function renderList(){
 const box=$('pan-cards');
 if(loading){box.innerHTML='<p class="pan-empty">Pantheon-Katalog wird geladen …</p>';return}
 if(loadError){box.innerHTML='<p class="pan-empty">Katalog konnte nicht geladen werden: '+esc(loadError)+'</p>';return}
 const q=filters.search.toLocaleLowerCase('de-DE');
 const list=items().filter(x=>{
  const has=owned.has(x.id)||placed.has(x.id);
  if(filters.kind!=='all'&&x.kind!==filters.kind)return false;
  if(filters.status==='missing'&&has)return false;
  if(filters.status==='owned'&&!has)return false;
  if(filters.status==='placed'&&!placed.has(x.id))return false;
  if(filters.faction!=='all'&&x.faction!=='alle'&&x.faction!==filters.faction)return false;
  return !q||[x.name,x.nameDe||'',x.where,x.kind,...Object.keys(x.stats||{})].join(' ').toLocaleLowerCase('de-DE').includes(q);
 });
 const rank={Heroic:5,Unique:4,Epic:3,Rare:2,Common:1};
 list.sort((a,b)=>filters.sort==='name'?a.name.localeCompare(b.name,'de'):
  filters.sort==='grade'?(rank[b.grade]||0)-(rank[a.grade]||0)||a.name.localeCompare(b.name,'de'):
  score(b)-score(a)||(rank[b.grade]||0)-(rank[a.grade]||0)||a.name.localeCompare(b.name,'de'));
 $('pan-count').textContent=list.length+' von '+items().length+' Sammelstücken angezeigt';
 box.innerHTML=list.length?list.map(card).join(''):'<p class="pan-empty">Für diesen Filter keine Sammelstücke gefunden.</p>';
}
function renderPantheon(){ensureCharacter();renderSummary();renderList()}
window.addEventListener('aion2:pantheon-updated',()=>{currentKey='';renderPantheon();});
page.addEventListener('click',event=>{
 const btn=event.target.closest('[data-pan-action]');if(!btn)return;
 ensureCharacter();
 const item=items().find(x=>x.id===btn.dataset.id),action=btn.dataset.panAction;
 if(!item)return;
 if(action==='own'){
  if(owned.has(item.id)||placed.has(item.id)){owned.delete(item.id);placed.delete(item.id)}
  else owned.add(item.id);
 }else if(action==='place'){
  if(placed.has(item.id))placed.delete(item.id);
  else{
   const used=items().filter(x=>x.kind===item.kind&&placed.has(x.id)).length;
   if(used>=limit[item.kind]){
    notice('Alle '+limit[item.kind]+' Plätze für '+plurals[item.kind]+' sind belegt.',true);return;
   }
   owned.add(item.id);placed.add(item.id);
  }
 }else if(action==='remove'&&item.userAdded){
  if(!confirm('Eigenen Eintrag entfernen?'))return;
  custom=custom.filter(x=>x.id!==item.id);owned.delete(item.id);placed.delete(item.id);
 }
 notice(save()?'Sammlung für '+String(data?.name||'Charakter')+' gespeichert.':'Browser-Speicherung nicht möglich.',false);
 renderSummary();renderList();
});
for(const [id,key] of [['pan-search','search'],['pan-kind','kind'],['pan-status','status'],['pan-faction','faction'],['pan-sort','sort']]){
 $(id).addEventListener(id==='pan-search'?'input':'change',e=>{filters[key]=e.target.value;renderList()});
}
$('pan-add-form').addEventListener('submit',event=>{
 event.preventDefault();ensureCharacter();
 const name=$('pan-add-name').value.trim(),kind=$('pan-add-kind').value;
 if(!limit[kind]||name.length<2||custom.length>=70){notice('Name fehlt oder zu viele eigene Einträge.',true);return}
 const id='custom-'+Date.now().toString(36)+'-'+Math.floor(Math.random()*999999);
 custom.push({id,name,kind,grade:'',stats:null,faction:'alle',where:'Eigener Eintrag',userAdded:true,icon:defaultIcon(kind)});
 $('pan-add-name').value='';
 filters.status='all';filters.kind='all';filters.search='';
 $('pan-status').value='all';$('pan-kind').value='all';$('pan-search').value='';
 save();notice(name+' hinzugefügt.');renderPantheon();
});
const oldRender=render;
render=function(){oldRender();renderPantheon()};
(async()=>{
 try{
  const r=await fetch('./pantheon-catalog.json?v=2',{cache:'no-cache'});
  if(!r.ok)throw Error('HTTP '+r.status);
  const json=await r.json();
  if(!Array.isArray(json.items)||json.items.length<20)throw Error('Ungültiger Datenbestand');
  catalog=json.items.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&limit[x.kind]);
 }catch(e){loadError=String(e.message||e)}
 finally{loading=false;renderPantheon()}
})();
renderPantheon();
})();
