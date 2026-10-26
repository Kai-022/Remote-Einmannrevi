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
const css=document.createElement('style');
css.textContent=`
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
.aion-node.on.special{border-color:#ebca78}
.aion-node img{width:100%;height:100%;object-fit:contain}
.aion-node .tick{position:absolute;bottom:-2px;right:0;font:bold 11px system-ui;color:#abf5cb;text-shadow:0 1px 3px #000}
.aion-node-detail{margin-top:14px;padding:14px;border:1px solid #45516a;border-radius:10px;background:#182335}
.aion-board-legend{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0;color:#b9c4d1;font-size:12px}
.aion-board-dot{width:11px;height:11px;display:inline-block;border-radius:3px;margin-right:5px}
.aion-profile-pic{width:56px;height:56px;object-fit:cover;border-radius:12px;border:1px solid #b58d54}
@media(max-width:600px){.aion-board-grid{justify-content:start}.aion-board-select{flex-basis:140px}}
`;
document.head.append(css);
const nav=$('dash')?.querySelector('.tabs');
if(!nav)return;
const boardButton=document.createElement('button');
boardButton.type='button';boardButton.textContent='◆ Daevanion-Boards';boardButton.id='aion-board-button';
nav.append(boardButton);
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
 const on=!!n.open,special=n.type==='SkillLevel'||n.grade==='Legend';
 const title=esc((n.name||n.type||'Knoten')+(on?' · Freigeschaltet':' · Nicht freigeschaltet'));
 return '<button type="button" class="aion-node '+(on?'on':'off')+(special?' special':'')+
 '" data-node="'+index+'" title="'+title+'" aria-label="'+title+'">'+
 image(n.icon,29)+(on?'<span class="tick">✓</span>':'')+'</button>';
}
function panelFor(node){
 const root=$('aion-board-node-detail');if(!root||!node)return;
 const effects=Array.isArray(node.effects)?node.effects:[];
 root.innerHTML='<div class="aion-node-detail"><div style="display:flex;gap:12px;align-items:center">'+image(node.icon,47)+
  '<div><strong>'+esc(node.name||'Knoten')+'</strong>'+
  '<div class="tip">'+esc(node.grade||node.type||'')+' · '+
   (node.open?'✓ Freigeschaltet':'○ Noch gesperrt')+'</div></div></div>'+
  '<div style="margin-top:12px">'+
  (effects.length?effects.map(x=>'<div class="gear-roll" style="margin-top:5px">'+esc(x)+'</div>').join(''):
  '<div class="tip">Für diesen Knoten liegen keine zusätzlichen Effekte vor.</div>')+'</div></div>';
}
function renderBoards(){
 portrait();
 const meta=data?.characterExtras||{},boards=meta.boards||{},list=Array.isArray(meta.daevanion)?meta.daevanion:[];
 const ids=Object.keys(boards).filter(id=>Array.isArray(boards[id]?.nodes)&&boards[id].nodes.length);
 const root=$('aion-board-content');if(!root)return;
 if(!ids.length){
  selected=null;
  root.innerHTML='<div class="empty">Für diesen Charakter sind noch keine Daevanion-Boarddaten importiert. Der offizielle NCSOFT-Import lädt diese bei verfügbaren öffentlichen Daten.</div>';
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
   '" data-board="'+esc(id)+'">'+image(m.icon,44)+
   '<span><strong>'+esc(m.name||'Board '+id)+'</strong><small>'+opened+' / '+total+' Knoten</small>'+
   '<div class="aion-board-progress"><span style="width:'+Math.min(100,Math.max(0,fraction))+'%"></span></div></span></button>';
 }).join('')+'</div>';
 const stats=(board.stats||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const skills=(board.skills||[]).map(x=>'<li>'+esc(x)+'</li>').join('');
 const summary='<details style="margin-top:14px"><summary style="color:#e8c687;cursor:pointer">Alle freigeschalteten Board-Effekte anzeigen</summary>'+
  '<div class="grid" style="margin-top:10px"><div class="card"><strong>Attribut-Boni</strong>'+
  (stats?'<ul>'+stats+'</ul>':'<p class="tip">Keine erfasst</p>')+'</div>'+
  '<div class="card"><strong>Skill-Boni</strong>'+(skills?'<ul>'+skills+'</ul>':'<p class="tip">Keine erfasst</p>')+'</div></div></details>';
 root.innerHTML=tabs+'<div class="slothead" style="margin:12px 0"><strong>'+esc(definition.name||'Daevanion-Board')+
 '</strong><span class="pill">'+opened+' / '+total+' freigeschaltet</span></div>'+
 '<div class="aion-board-legend"><span><i class="aion-board-dot" style="background:#34704f"></i>Freigeschaltet</span>'+
 '<span><i class="aion-board-dot" style="background:#2b364b"></i>Gesperrt</span>'+
 '<span><i class="aion-board-dot" style="background:#b28b50"></i>Skill-Knoten</span></div>'+
 '<div class="aion-board-scroll"><div class="aion-board-grid">'+matrix+'</div></div>'+
 '<div id="aion-board-node-detail" aria-live="polite"><div class="tip" style="margin-top:12px">Klicke einen Knoten an, um seine Werte anzusehen.</div></div>'+summary;
}
$('aion-board-content').addEventListener('click',e=>{
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
