/* PvE Cleric Daevanion comparison: imported nodes + heuristically ranked path choices.
 * References: AION2 Vault 2026-10-22, Aion2 Companion, Aion2.gg EU.
 * Does not edit the game; path prices reflect official board grade costs. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),page=$('tab-daevanion');if(!page)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const boardNames={'71':'Nezekan','72':'Zikel','73':'Vaizel','74':'Triniel','75':'Ariel','76':'Azphel'};
const damage={'Condemnation':107,'Chain of Torment':106,'Judgment Thunder':100,'Divine Aura':97,"Earth's Retribution":94,'Debilitating Mark':90,"Empyrean Lord's Grace":106,"Empyrean Lords' Grace":106,"Earth's Grace":100,'Bolt':71};
const heals={'Radiant Recovery':110,'Healing Light':108,'Light of Regeneration':103,'Healing Enhancement':99,'Warm Benediction':98,'Radiant Benediction':95,'Prayer of Concentration':88,'Immortal Veil':68};
const stats={
 hybrid:{'Cooldown Reduction':109,'Combat Speed':108,'Damage Boost':103,'PvE Damage Boost':107,'Critical Damage Boost':91,'Multi-Hit Chance':87,'Damage Tolerance':79,'PvE Damage Tolerance':81},
 heal:{'Cooldown Reduction':108,'Combat Speed':97,'Damage Tolerance':101,'PvE Damage Tolerance':105,'Damage Boost':69,'PvE Damage Boost':69},
 dps:{'Cooldown Reduction':109,'Combat Speed':108,'Damage Boost':111,'PvE Damage Boost':115,'Critical Damage Boost':98,'Multi-Hit Chance':92,'Damage Tolerance':37}
};
const roles=['hybrid','heal','dps'],titles={hybrid:'Hybrid',heal:'Heilung',dps:'Schaden'};
let mode='hybrid',character='',audit=null;
const charKey=()=>String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
const boards=()=>data?.characterExtras?.boards||{};
const norm=t=>String(t||'').toLowerCase().replace(/[’‘']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const nodeName=n=>String((n.effects||[]).find(s=>/\+\s*\d+\s*$/.test(s))||n.name||'').replace(/^Skill Level Up\s*-\s*/i,'').replace(/\s*\+\s*\d+\s*$/,'');
function updateMode(){
 const k=charKey();if(k===character)return;
 character=k;mode=roles.includes(data?.mode)?data.mode:'hybrid';
 try{const m=localStorage.getItem('aion2-daevanion-role-v1:'+k);if(roles.includes(m))mode=m}catch{}
}
function value(id,n){
 if(!n||n.type==='None'||n.type==='Start')return 0;
 if(String(id)==='76'||/^pvp/i.test(n.name||''))return -50;
 const name=norm(n.type==='SkillLevel'?nodeName(n):n.name);
 if(n.type==='SkillLevel'){
  const d=Object.entries(damage).find(([x])=>norm(x)===name)?.[1]||15;
  const h=Object.entries(heals).find(([x])=>norm(x)===name)?.[1]||15;
  return mode==='dps'?d:mode==='heal'?h:Math.max(d*.91,h*.9);
 }
 return Object.entries(stats[mode]).find(([x])=>norm(x)===name)?.[1]||8;
}
const price=n=>({Start:0,Common:1,Rare:2,Legend:3,Unique:4})[n.grade]??(n.type==='SkillLevel'?3:1);
function neighbors(nodes){
 const map=new Map();nodes.forEach((n,i)=>{if(n.type!=='None'&&n.row&&n.col)map.set(n.row+','+n.col,i)});
 return i=>{const n=nodes[i];return [[1,0],[-1,0],[0,1],[0,-1]]
   .map(([dy,dx])=>map.get((n.row+dy)+','+(n.col+dx))).filter(v=>v!==undefined)};
}
function route(nodes,target,around){
 const dist=nodes.map(n=>n.open||n.type==='Start'?0:Infinity),prev=nodes.map(()=>-1),seen=new Set();
 for(;;){
  let ix=-1;dist.forEach((d,i)=>{if(!seen.has(i)&&nodes[i].type!=='None'&&Number.isFinite(d)&&(ix<0||d<dist[ix]))ix=i});
  if(ix<0||ix===target)break;seen.add(ix);
  for(const j of around(ix)){
   const next=dist[ix]+(nodes[j].open?0:price(nodes[j]));
   if(next<dist[j]){dist[j]=next;prev[j]=ix;}
  }
 }
 if(!Number.isFinite(dist[target]))return null;
 const path=[];let cursor=target;
 while(cursor>=0&&!nodes[cursor].open&&nodes[cursor].type!=='Start'){
  path.unshift(cursor);cursor=prev[cursor];
 }
 return {path,cost:dist[target]};
}
function analyze(){
 updateMode();
 const missing=[],warnings=[],status={},summary={good:0,missing:0,caution:0};
 for(const [id,b] of Object.entries(boards())){
  const nodes=b.nodes||[];if(!nodes.length)continue;
  status[id]={};const around=neighbors(nodes);
  const stillHigh=nodes.some(n=>!n.open&&value(id,n)>=78);
  nodes.forEach((n,i)=>{
   if(n.type==='None'||n.type==='Start')return;
   const v=value(id,n);
   if(v>=78){
    if(n.open){summary.good++;status[id][i]='good';}
    else{
     const path=route(nodes,i,around);
     if(path){summary.missing++;status[id][i]='missing';
      missing.push({id,i,name:nodeName(n),points:v,cost:path.cost,steps:path.path.length})}
    }
   }
   if(n.open&&(id==='76'||(n.type==='SkillLevel'&&v<30&&stillHigh))){
    const links=around(i).filter(j=>nodes[j].open||nodes[j].type==='Start').length;
    if(id==='76'||links<=1){
     status[id][i]='caution';summary.caution++;
     warnings.push({id,i,name:nodeName(n),reason:id==='76'?
      'PvP-Tafel mit eigener Währung – für PvE nur eingeschränkt hilfreich.':
      'Für diesen Build niedrige Priorität. Vor einer Rücksetzung prüfen, ob ein anderer Knoten davon abhängt.'});
    }
   }
  });
 }
 missing.sort((a,b)=>b.points/Math.max(1,b.cost)-a.points/Math.max(1,a.cost)||b.points-a.points);
 return {missing,warnings,status,summary};
}
const css=document.createElement('style');
css.textContent=[
 '#daeva-audit{padding:14px;margin:0 0 15px;border:1px solid #9b7e49;border-radius:13px;background:#172436}',
 '#daeva-audit h3{color:#f0d29e;font-size:19px;margin:5px 0 9px}',
 '#daeva-audit h4{font-size:15px;color:#eac58d;margin:16px 0 8px}',
 '#daeva-audit p{color:#bdc9d9;font-size:12px}',
 '.daeva-modes{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}',
 '.daeva-modes button{flex:1;min-width:80px;padding:10px;border:1px solid #66748a;background:#20314a;border-radius:8px}',
 '.daeva-modes button.active{background:#543f26;color:#f5d9a3;border-color:#dbba79}',
 '.daeva-counters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:11px 0}',
 '.daeva-counters>div{padding:10px;border-radius:9px;border:1px solid #445870;background:#102033}',
 '.daeva-counters strong{display:block;color:#efd196;font-size:23px}',
 '.daeva-counters small{font-size:11px;color:#c0cdde}',
 '.daeva-item{display:flex;align-items:center;gap:9px;padding:10px;margin:7px 0;border:1px solid #56657b;border-left:4px solid #e6bb66;background:#1b2c42;border-radius:8px}',
 '.daeva-item.caution{border-left-color:#df7e8a}',
 '.daeva-item>div{flex:1;min-width:0}',
 '.daeva-item strong{font-size:13px;display:block}',
 '.daeva-item small{color:#b5c4d6;font-size:11px;display:block;margin-top:4px}',
 '.daeva-item button{padding:8px;flex-shrink:0;font-size:11px}',
 '.daeva-notice{border:1px solid #7c673f;border-radius:8px;background:#2b271e;padding:10px;margin:11px 0;color:#ecd9b8;font-size:12px}',
 '.daeva-more summary{color:#eed2a1;font-size:13px;padding:10px;cursor:pointer}',
 '.aion-node.audit-good{border:2px solid #74e0a9!important;box-shadow:inset 0 0 0 2px #4db681!important}',
 '.aion-node.audit-missing{border:2px solid #ffd273!important;box-shadow:inset 0 0 0 2px #d6a247!important}',
 '.aion-node.audit-caution{border:2px solid #f3949b!important;box-shadow:inset 0 0 0 2px #cf5363!important}',
 '@media(max-width:600px){.daeva-counters{gap:5px}.daeva-counters>div{padding:7px}.daeva-counters strong{font-size:19px}.daeva-item{flex-wrap:wrap}.daeva-item button{margin-left:auto}}'
].join('\n');
document.head.append(css);
const host=document.createElement('div');host.id='daeva-audit';
$('aion-board-content').before(host);
const recommendation=(x,i,isWarning)=>'<div class="daeva-item'+(isWarning?' caution':'')+'"><div><strong>'+
 (i+1)+'. '+esc(boardNames[x.id]||x.id)+' · '+esc(x.name)+'</strong><small>'+
 (isWarning?esc(x.reason):'Geschätzter zusätzlicher Weg: '+x.cost+' Kristalle über '+x.steps+' neue Knoten')+
 '</small></div><button type="button" data-daevaboard="'+esc(x.id)+'" data-daevaindex="'+x.i+'">Auf Tafel zeigen</button></div>';
function render(){
 audit=analyze();
 const ids=Object.keys(boards()).filter(id=>boards()[id]?.nodes?.length);
 if(!ids.length){host.innerHTML='<h3>Deine Skillung vergleichen</h3><p>Bitte zuerst die offiziellen Daevanion-Tafeln importieren. Ohne importierte Knoten kann keine Skillung ausgewertet werden.</p>';return}
 const missing=audit.missing,warnings=audit.warnings,s=audit.summary;
 host.innerHTML='<div class="eyebrow">DAEVANION · KLERIKER PVE</div>'+
 '<h3>Dein Skillbaum im Vergleich</h3><p>Vergleich deiner aktuell importierten Knoten mit Empfehlungen. Wähle den Spielstil.</p>'+
 '<div class="daeva-modes">'+roles.map(x=>'<button type="button" data-daevamode="'+x+'" class="'+(x===mode?'active':'')+'">'+titles[x]+'</button>').join('')+'</div>'+
 '<div class="daeva-counters"><div><strong>'+s.good+'</strong><small>Wichtige Punkte aktiv</small></div>'+
 '<div><strong>'+s.missing+'</strong><small>Wichtige Punkte fehlen</small></div>'+
 '<div><strong>'+s.caution+'</strong><small>Mögliche Fehlprioritäten</small></div></div>'+
 (ids.includes('75')?'':'<div class="daeva-notice">Die neue Ariel-PvE-Tafel (seit 21.10.2026) fehlt in deinen gespeicherten Profildaten. Sie wird nicht als falsch gewertet.</div>')+
 '<div class="daeva-notice">Farben im Skillbaum: <b style="color:#8beab9">Grün</b> = wichtiger Punkt aktiviert, <b style="color:#f1cb82">Gelb</b> = empfohlen, aber fehlt, <b style="color:#f1a1a9">Rot</b> = bei diesem Build möglicherweise nicht sinnvoll. Verbindungsknoten werden nicht pauschal als falsch markiert.</div>'+
 '<h4>Deine nächsten empfohlenen Skillpunkte</h4>'+
 (missing.length?missing.slice(0,8).map((x,i)=>recommendation(x,i,false)).join(''):'<p>Keine wichtigen fehlenden Punkte in den importierten Tafeln erkannt.</p>')+
 (missing.length>8?'<details class="daeva-more"><summary>Weitere '+(missing.length-8)+' Empfehlungen anzeigen ▾</summary>'+
 missing.slice(8).map((x,i)=>recommendation(x,i+8,false)).join('')+'</details>':'')+
 '<h4>Was könnte ungünstig verteilt sein?</h4>'+
 (warnings.length?warnings.slice(0,12).map((x,i)=>recommendation(x,i,true)).join(''):
 '<p>Keine offensichtlich unpassenden Endknoten gefunden. Alle verbundenen Füllknoten können notwendig sein.</p>')+
 '<p>Die Empfehlungen sind regelbasiert und kein nachgewiesener mathematischer Best-in-Slot-Skillbaum. Keine Änderung im Spiel. <a href="https://aion2vault.com/builds/cleric/daevanion/" target="_blank" rel="noopener noreferrer">Kleriker-Build (22.10.2026)</a> · <a href="https://aion2.grimvane.app/companion/wiki/daevanion-cleric/" target="_blank" rel="noopener noreferrer">Heiler-Routen</a>.</p>';
}
host.addEventListener('click',e=>{
 const change=e.target.closest('[data-daevamode]');
 if(change&&roles.includes(change.dataset.daevamode)){
  mode=change.dataset.daevamode;
  try{localStorage.setItem('aion2-daevanion-role-v1:'+charKey(),mode)}catch{}
  render();window.aionBoardsRefresh?.();return;
 }
 const loc=e.target.closest('[data-daevaboard]');
 if(loc)window.aionBoardSelect?.(loc.dataset.daevaboard,Number(loc.dataset.daevaindex));
});
window.aionDaevanion={
 render,
 classify:(id,n)=>{
  const list=boards()[String(id)]?.nodes;if(!list)return '';
  const ix=list.indexOf(n);return audit?.status[String(id)]?.[ix]||'';
 }
};
$('aion-board-button')?.addEventListener('click',render);
render();window.aionBoardsRefresh?.();
})();