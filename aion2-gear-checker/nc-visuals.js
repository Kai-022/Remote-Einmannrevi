/* Official AION 2 Daevanion node boards and character visuals. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=(url,size=30,extra='')=>{
 try{
  const u=new URL(String(url||''));
  if(u.protocol!=='https:'||u.hostname!=='assets.playnccdn.com')return '';
  return '<img src="'+esc(u.href)+'" alt="" loading="lazy" referrerpolicy="no-referrer" '+
   'style="width:'+size+'px;height:'+size+'px;object-fit:contain;flex-shrink:0" '+extra+'>';
 }catch{return ''}
};
// Official skill IDs from NCSOFT public profile. Artwork is stored locally in nc-icons/skills.
const skillIdByName={"earth s retribution":"17010000","judgment thunder":"17040000","debilitating mark":"17080000","divine aura":"17150000","chain of torment":"17070000","lightning strike scattershot":"17370000","light of regeneration":"17090000","condemnation":"17350000","healing light":"17100000","radiant recovery":"17120000","bolt":"17060000","defiance":"17240000","warm benediction":"17710000","empyrean lords benediction":"17720000","empyrean lord s grace":"17730000","healing enhancement":"17740000","immortal veil":"17750000","heal block":"17760000","prayer of concentration":"17770000","earth s grace":"17780000","survival willpower":"17790000","radiant benediction":"17800000","power burst":"17280000","absolution":"17290000","benevolence":"17160000","prayer of amplification":"17430000","summon resurrection":"17390000","earth punishment":"17400000","salvation":"17270000","root":"17190000","light of protection":"17410000","yustiel s power":"17420000","voice of doom":"17300000","assault mark":"17700000","noble aura":"17440000"};
const normalizeSkill=v=>String(v||'').trim().toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ');
const iconForSkill=name=>{
 const clean=String(name||'').replace(/^Skill Level Up\s*-\s*/i,'').replace(/\s*\+\s*\d+\s*$/,'');
 const id=skillIdByName[normalizeSkill(clean)];
 return id?'./nc-icons/skills/'+id+'.webp':'';
};
window.aionOfficialSkillIcon=iconForSkill;
const nodeSkillName=n=>{
 const effect=(n.effects||[]).find(v=>/\+\s*\d+\s*$/.test(v));
 return String(effect||n.name||'').replace(/^Skill Level Up\s*-\s*/i,'').replace(/\s*\+\s*\d+\s*$/,'');
};
const nodeFrame=n=>['common','rare','legend','unique','start'].includes(String(n?.grade||'').toLowerCase())?
 String(n.grade).toLowerCase():(n?.type==='Start'?'start':'common');
const smallArt=(src,cls='')=>src?'<img src="'+esc(src)+'" class="'+cls+'" alt="" loading="lazy" decoding="async">':'';
const plan=[
 {label:'Solo-DPS',terms:['Verdammnis','Rache der Erde','Donnerschlag','Heilige Aura','Strafe der Erde','Schadensverstärkung','Kritischer Schadens','Mehrfachtreffer','Angriffskraft','Segen des Gebieters']},
 {label:'Gruppen-PvE',terms:['Verdammnis','Glanz der Genesung','Licht der Heilung','Heilige Aura','Rache der Erde','Abklingzeit','Kampftempo','Schadensverstärkung','Segen des Gebieters']}
];
let buildMode='none';
function priority(n){
 const mode=plan.find(x=>x.label===buildMode);
 if(!mode||!n||n.type==='None')return false;
 const text=[n.name,...(n.effects||[])].join(' ').toLocaleLowerCase('de-DE');
 return mode.terms.some(t=>text.includes(t.toLocaleLowerCase('de-DE')));
}
const css=document.createElement('style');
css.textContent=`
.tabs{flex-wrap:wrap!important;overflow:visible!important;row-gap:0!important}
.tabs button{padding:11px 12px!important;font-size:13px}
#aion-board-button{color:#edd097;font-weight:800;border:1px solid #947546;border-radius:8px;background:#302a20}
#aion-board-button.active{background:#51432f;color:#ffe1a0}
.aion-board-jump{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #9d7945;border-radius:10px;padding:12px 14px;margin:12px 0;background:#2a2b25;flex-wrap:wrap}
.aion-board-jump button{border:1px solid #e8c687;color:#fff1cf;background:#554127;border-radius:7px;padding:9px 12px}
.aion-board-tabs{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0}
.aion-board-select{display:flex;gap:9px;align-items:center;border:1px solid #47536a;border-radius:10px;background:#172233;color:#edf1f8;padding:11px;text-align:left;flex:1 1 160px;cursor:pointer}
.aion-board-select.active{border-color:#e8c687;background:#333125}
.aion-board-select strong{display:block}
.aion-board-select small{color:#bac5d3}
.aion-board-progress{height:7px;background:#0c1321;border-radius:10px;overflow:hidden;margin-top:6px}
.aion-board-progress span{display:block;height:100%;background:#6acf9e}
.aion-board-scroll{overflow-x:auto;overscroll-behavior-inline:contain;padding:10px;border:1px solid #33445d;border-radius:12px;background:#101928}
.aion-board-grid{display:grid;grid-template-columns:repeat(15,35px);grid-template-rows:repeat(15,35px);gap:4px;width:max-content;min-width:100%;justify-content:center}
.aion-node{width:35px;height:35px;border:1px solid #303949;border-radius:6px;background:#131c29;color:#7f8b9c;padding:2px;position:relative;display:grid;place-items:center;cursor:pointer}
.aion-node:focus-visible{outline:2px solid #e8c687;outline-offset:1px}
.aion-node.filler{opacity:.14;pointer-events:none}
.aion-node.off{filter:saturate(.44);opacity:.62}
.aion-node.on{background:#254d3a;border-color:#78d9ac;box-shadow:inset 0 0 0 1px #47976e}
.aion-node.special{border-color:#c49e59}
.aion-node.on.special{border-color:#ebca78}.aion-node.priority{outline:2px solid #e3b15b;outline-offset:-2px;box-shadow:0 0 8px #dfac4c88}.aion-board-builds{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.aion-board-builds button{padding:9px 12px;border:1px solid #68768a;border-radius:7px;background:#1a293a;color:#eee}.aion-board-builds button.active{border-color:#f0bd68;color:#ffd88e;background:#40321e}
.aion-node.with-art{background-repeat:no-repeat;background-position:center;background-size:100% 100%;border-color:transparent}
.aion-node img.aion-node-skill{width:76%;height:76%;object-fit:cover;border-radius:4px;filter:none;position:relative;z-index:1;box-shadow:0 0 0 1px #0009}
.aion-node.with-art .tick{z-index:2;background:#16432fd9;border-radius:2px;line-height:12px}.aion-node-fallback{font-size:20px;color:#e4c48a}.aion-node img:not([src]){display:none}
.aion-node .tick{position:absolute;bottom:-2px;right:0;font:bold 11px system-ui;color:#abf5cb;text-shadow:0 1px 3px #000}
.aion-node-detail{margin-top:14px;padding:14px;border:1px solid #45516a;border-radius:10px;background:#182335}
.aion-board-legend{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0;color:#b9c4d1;font-size:12px}
.aion-board-dot{width:11px;height:11px;display:inline-block;border-radius:3px;margin-right:5px}
.aion-node-skill-detail{width:48px;height:48px;object-fit:cover;border-radius:8px}
.aion-board-header-icon{width:44px;height:44px;object-fit:contain}
.aion-profile-pic{width:56px;height:56px;object-fit:cover;border-radius:12px;border:1px solid #b58d54}
@media(max-width:600px){.aion-board-grid{justify-content:start}.aion-board-select{flex-basis:140px}}
`;
document.head.append(css);
const nav=$('dash')?.querySelector('.tabs');
if(!nav)return;
const boardButton=document.createElement('button');
boardButton.type='button';boardButton.textContent='◆ Daevanion-Boards';boardButton.id='aion-board-button';
const gearTab=nav.querySelector('[data-tab="gear"]');
if(gearTab)gearTab.after(boardButton);else nav.prepend(boardButton);
const jump=document.createElement('div');jump.id='aion-board-jump';jump.className='aion-board-jump';
jump.innerHTML='<span>◆ <strong>Daevanion-Boards</strong> <small id="aion-board-indicator">– nach dem Import hier ansehen</small></span>'+
 '<button type="button" id="aion-board-jump-btn">Boards öffnen</button>';
nav.before(jump);
jump.querySelector('button').onclick=()=>boardButton.click();
const page=document.createElement('section');page.id='tab-daevanion';page.className='hidden';
page.innerHTML='<section class="panel"><h2>◆ Daevanion-Boards</h2>'+
 '<p>Offiziell importierte Knoten, Freischaltungen und Effekte. Tippe auf einen Knoten, um die Details zu sehen.</p>'+
 '<div id="aion-board-content"></div></section>';
$('dash').append(page);
boardButton.addEventListener('click',()=>{
 nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===boardButton));
 for(const id of ['gear','upgrades','pets'])$('tab-'+id)?.classList.add('hidden');
 page.classList.remove('hidden');
});
nav.querySelectorAll('button[data-tab]').forEach(button=>button.addEventListener('click',()=>{
 boardButton.classList.remove('active');page.classList.add('hidden');
}));
let selected=null;
function portrait(){
 const info=data?.characterExtras?.profile||{};
 const symbol=$('dash')?.querySelector('.char .symbol');
 if(!symbol)return;
 symbol.textContent='✧';
 try{
  const u=new URL(String(info.icon||''));
  if(u.protocol==='https:'&&u.hostname==='profileimg.plaync.com'){
   const img=document.createElement('img');img.src=u.href;
   img.alt='Charakterbild';img.className='aion-profile-pic';
   img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();
   symbol.replaceChildren(img);
  }
 }catch{}
 const char=$('dash')?.querySelector('.char');
 let line=$('aion-profile-meta');
 if(!line&&char){
  line=document.createElement('small');line.id='aion-profile-meta';
  char.querySelector('.right')?.before(line);
 }
 if(line){
  line.textContent=info.name?((info.className||'Charakter')+
   (info.level?' · Lv. '+info.level:'')+
   (info.combatPower?' · '+Number(info.combatPower).toLocaleString('de-DE')+' CP':'')):'';
 }
}
function tile(n,index){
 if(!n||n.type==='None')return '<div class="aion-node filler" aria-hidden="true"></div>';
 const on=!!n.open,special=n.type==='SkillLevel'||n.grade==='Legend',recommended=priority(n);
 const title=esc((n.name||n.type||'Knoten')+(on?' · Freigeschaltet':' · Nicht freigeschaltet'));
 const isSkill=n.type==='SkillLevel',src=isSkill?iconForSkill(nodeSkillName(n)):'';
 const frame='./nc-icons/frames/'+nodeFrame(n)+'.png';
 const fallback=n.type==='Start'?'★':(isSkill?'✦':'');
 const art=smallArt(src,'aion-node-skill')||(fallback?'<span class="aion-node-fallback">'+fallback+'</span>':'');
 return '<button type="button" class="aion-node with-art '+(on?'on':'off')+
  (special?' special':'')+(recommended?' priority':'')+
  '" style="background-image:url(\''+frame+'\')" data-node="'+index+
  '" title="'+title+'" aria-label="'+title+'">'+art+
  (on?'<span class="tick">✓</span>':'')+'</button>';
}
function panelFor(node){
 const root=$('aion-board-node-detail');if(!root||!node)return;
 const effects=Array.isArray(node.effects)?node.effects:[];
 root.innerHTML='<div class="aion-node-detail"><div style="display:flex;gap:12px;align-items:center">'+smallArt(iconForSkill(nodeSkillName(node)),'aion-node-skill-detail')+
  '<div><strong>'+esc(node.name||'Knoten')+'</strong>'+
  '<div class="tip">'+esc(node.grade||node.type||'')+' · '+
   (node.open?'✓ Freigeschaltet':'○ Noch gesperrt')+'</div></div></div>'+
  '<div style="margin-top:12px">'+
  (effects.length?effects.map(x=>'<div class="gear-roll" style="margin-top:5px">'+esc(x)+'</div>').join(''):
  '<div class="tip">Für diesen Knoten liegen keine zusätzlichen Effekte vor.</div>')+'</div></div>';
}
async function loadMissingBoards(){
 const ref=data?.sourceRef;
 if(!ref?.sid||!ref?.id)throw Error('Bitte zuerst deinen Charakter über den offiziellen NCSOFT-Import laden.');
 const response=await fetch('./nc-character-snapshot.json?t='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw Error('Der gespeicherte NCSOFT-Testdatensatz konnte nicht geladen werden.');
 const d=await response.json();
 if(String(d.serverId)!==String(ref.sid)||String(d.characterId)!==String(ref.id))
  throw Error('Für deinen Charakter ist hier noch kein Board-Datensatz gespeichert. Nutze den offiziellen Live-Import mit deinem Server.');
 const original=d.daevanionBoards||{},list=d.info?.daevanion?.boardList||[];
 const boards={};
 for(const [id,board] of Object.entries(original)){
  boards[id]={
   nodes:(Array.isArray(board.nodeList)?board.nodeList:[]).slice(0,225).map(n=>({
    id:n.nodeId,row:Number(n.row),col:Number(n.col),name:String(n.name||''),
    type:String(n.type||''),grade:String(n.grade||''),open:!!n.open,
    icon:String(n.icon||''),effects:(Array.isArray(n.effectList)?n.effectList:[]).map(e=>String(e.desc||''))
   })),
   stats:(board.openStatEffectList||[]).map(v=>String(v.desc||'')),
   skills:(board.openSkillEffectList||[]).map(v=>String(v.desc||''))
  };
 }
 const count=Object.keys(boards).length;
 if(!count)throw Error('Die offiziellen Profildaten enthalten keine Daevanion-Tafeln.');
 data.characterExtras=data.characterExtras||{};
 data.characterExtras.boards=boards;
 data.characterExtras.daevanion=list.map(b=>({
  id:String(b.id),name:String(b.name||''),icon:String(b.icon||''),
  opened:Number(b.openNodeCount||0),total:Number(b.totalNodeCount||0),
  level:(b.openNodeCount||0)+' / '+(b.totalNodeCount||'?')+' Knoten'
 }));
 const p=d.info?.profile||{};
 data.characterExtras.profile=data.characterExtras.profile||{
  name:String(p.characterName||''),className:String(p.className||''),
  level:Number(p.characterLevel||0),combatPower:Number(p.combatPower||0),
  icon:String(p.profileImage||'')
 };
 store();render();
 return count;
}
function renderBoards(){
 portrait();
 const indicator=$('aion-board-indicator');
 if(indicator){
   const count=Object.values(data?.characterExtras?.boards||{}).filter(b=>Array.isArray(b?.nodes)&&b.nodes.length).length;
   indicator.textContent=count?' · '+count+' Tafeln importiert':' · noch keine Tafeln importiert';
 }
 const meta=data?.characterExtras||{},boards=meta.boards||{},list=Array.isArray(meta.daevanion)?meta.daevanion:[];
 const ids=Object.keys(boards).filter(id=>Array.isArray(boards[id]?.nodes)&&boards[id].nodes.length);
 const root=$('aion-board-content');if(!root)return;
 if(!ids.length){
  selected=null;
  root.innerHTML='<div class="empty">Für diesen Charakter sind noch keine Daevanion-Boarddaten geladen. Öffne den offiziellen NCSOFT-Import oder lade bei einem bereits importierten Charakter die Tafeln nach.</div>'+
   '<button type="button" class="primary" id="aion-recover-boards" style="margin-top:12px">◆ Board-Daten nachladen</button>'+
   '<div id="aion-recover-status" class="tip" role="status"></div>';
  return;
 }
 if(!ids.includes(selected))selected=ids[0];
 const definition=list.find(x=>String(x.id)===selected)||{};
 const board=boards[selected];
 const nodes=board.nodes;
 const indices=new Map();
 nodes.forEach((n,i)=>{if(n.row>=1&&n.row<=15&&n.col>=1&&n.col<=15)indices.set(n.row+':'+n.col,i)});
 let matrix='';
 for(let row=1;row<=15;row++)for(let col=1;col<=15;col++){
  const index=indices.get(row+':'+col);
  matrix+=tile(index==null?null:nodes[index],index);
 }
 const currentOpened=nodes.filter(n=>n.open&&n.type!=='None').length;
 const total=definition.total||nodes.filter(n=>n.type!=='None').length;
 const opened=definition.opened??currentOpened;
 const tabs='<div class="aion-board-tabs">'+ids.map(id=>{
  const m=list.find(x=>String(x.id)===id)||{},b=boards[id];
  const opened=m.opened??b.nodes.filter(n=>n.open&&n.type!=='None').length;
  const total=m.total||b.nodes.filter(n=>n.type!=='None').length;
  const fraction=total?Math.round(100*opened/total):0;
  return '<button type="button" class="aion-board-select'+(id===selected?' active':'')+
   '" data-board="'+esc(id)+'">'+smallArt('./nc-icons/frames/start.png','aion-board-header-icon')+
   '<span><strong>'+esc(m.name||'Board '+id)+'</strong><small>'+opened+' / '+total+' Knoten</small>'+
   '<div class="aion-board-progress"><span style="width:'+Math.min(100,Math.max(0,fraction))+'%"></span></div></span></button>';
 }).join('')+'</div>';
 const stats=(board.stats||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const skills=(board.skills||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const summary='<details style="margin-top:14px"><summary style="color:#e8c687;cursor:pointer">Alle freigeschalteten Board-Effekte anzeigen</summary>'+
  '<div class="grid" style="margin-top:10px"><div class="card"><strong>Attribut-Boni</strong>'+
  (stats?'<ul>'+stats+'</ul>':'<p class="tip">Keine erfasst</p>')+'</div>'+
  '<div class="card"><strong>Skill-Boni</strong>'+(skills?'<ul>'+skills+'</ul>':'<p class="tip">Keine erfasst</p>')+'</div></div></details>';
 const buildControls='<div class="aion-board-builds"><button data-build="none" class="'+(buildMode==='none'?'active':'')+'">Meine Skillung</button>'+
 plan.map(x=>'<button data-build="'+esc(x.label)+'" class="'+(buildMode===x.label?'active':'')+'">'+esc(x.label)+'</button>').join('')+'</div>'+
 '<p class="tip">Goldene Umrandung = empfohlener Zielknoten (keine automatisch berechnete günstigste Route). Empfehlungen nach öffentlich verfügbaren Kleriker-Guides; kein garantierter Max-DPS-Nachweis.</p>';
 root.innerHTML=buildControls+tabs+'<div class="slothead" style="margin:12px 0"><strong>'+esc(definition.name||'Daevanion-Board')+
 '</strong><span class="pill">'+opened+' / '+total+' freigeschaltet</span></div>'+
 '<div class="aion-board-legend"><span><i class="aion-board-dot" style="background:#34704f"></i>Freigeschaltet</span>'+
 '<span><i class="aion-board-dot" style="background:#2b364b"></i>Gesperrt</span>'+
 '<span><i class="aion-board-dot" style="background:#b28b50"></i>Skill-Knoten</span></div>'+
 '<div class="aion-board-scroll"><div class="aion-board-grid">'+matrix+'</div></div>'+
 '<div id="aion-board-node-detail" aria-live="polite"><div class="tip" style="margin-top:12px">Klicke einen Knoten an, um seine Werte anzusehen.</div></div>'+summary;
}
$('aion-board-content').addEventListener('click',async e=>{
 const reload=e.target.closest('#aion-recover-boards');
 if(reload){
  reload.disabled=true;
  const status=$('aion-recover-status');
  if(status)status.textContent='Prüfe gespeicherte NCSOFT-Daten …';
  try{const count=await loadMissingBoards();if(status)status.textContent=count+' Tafeln geladen.';}
  catch(error){if(status)status.textContent=String(error.message||error);reload.disabled=false;}
  return;
 }
 const preset=e.target.closest('[data-build]');
 if(preset){buildMode=preset.dataset.build;renderBoards();return;}
 const board=e.target.closest('[data-board]');
 if(board){
  selected=board.dataset.board;renderBoards();return;
 }
 const button=e.target.closest('[data-node]');
 if(button){
  const board=data?.characterExtras?.boards?.[selected];
  const node=board?.nodes?.[Number(button.dataset.node)];
  panelFor(node);
 }
});
const previous=render;
render=function(){previous();renderBoards()};
renderBoards();
})();
