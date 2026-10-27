/* Compare official user Daevanion nodes to sourced PUBLIC Cleric board plans.
 * No skill-name-to-DPS guesses, no invented live leaderboard snapshots.
 * Published build targets are partial; absence from a summary is NOT proof of a mistake. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),root=$('tab-daevanion');if(!root)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={'71':'Nezekan','72':'Zikel','73':'Vaizel','74':'Triniel','75':'Ariel','76':'Azphel'};
const nodeCost=n=>n?.type==='Start'?0:({Common:1,Rare:2,Legend:3,Unique:4})[n?.grade]||0;
const nameOf=n=>String((n?.effects||[]).find(e=>/\+\s*\d+\s*$/.test(e))||n?.name||'').replace(/^Skill Level Up\s*-\s*/i,'').replace(/\s*\+\s*\d+\s*$/,'');
const canonical=s=>String(s||'').toLowerCase().replace(/[’‘']/g,'').replace(/lords\b/g,'lord').replace(/[^a-z0-9]+/g,' ').trim();
const includes=(list,name)=>Array.isArray(list)&&list.some(x=>canonical(x)===canonical(name));
const boards=()=>data?.characterExtras?.boards||{};
const currentId=()=>String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
let refs=null,fetchFailed=false,chosen='rosaEarly',activeId='',comparison=null;
function restore(){
 const key=currentId();
 if(key===activeId)return;
 activeId=key;chosen='rosaEarly';
 try{const saved=localStorage.getItem('aion2-daevanion-reference-v1:'+key);
  if(['rosaEarly','whelps','rosaEnd'].includes(saved))chosen=saved;
 }catch{}
}
function byId(id){return refs?.sources?.find(x=>x.id===id)||null}
function boardTargets(ref,id){
 return ref?.boards?.[String(id)]||{};
}
function occurrences(nodes,type,name){
 return nodes.filter(n=>n.type===type&&canonical(nameOf(n))===canonical(name)).length;
}
function selected(ref,id,n,nodes){
 if(!ref||!n||n.type==='None'||n.type==='Start'||String(id)==='76'||String(id)==='75')return false;
 const skill=nameOf(n),onBoard=boardTargets(ref,id);
 if(ref.nearlyFull){
  // Only explicit late-game skill targets; never infer filler or the exact one omitted corner.
  if(n.type!=='SkillLevel')return false;
  return !includes(ref.exclusions,skill)&&!includes(['Prayer of Concentration','Heal Block'],skill);
 }
 if(n.type==='SkillLevel'){
  if(includes(onBoard.skills,skill))return true;
  if(includes(ref.allBoardSkills,skill))return true;
  if(Object.keys(onBoard.passives||{}).some(k=>canonical(k)===canonical(skill))){
   const limit=Object.entries(onBoard.passives).find(([k])=>canonical(k)===canonical(skill))[1];
   return occurrences(nodes,'SkillLevel',skill)<=Number(limit);
  }
  // Across four boards, the referenced passive was taken to +4 (all its copies).
  if(includes(ref.allBoardPassives,skill))return true;
 }
 if(n.type==='Stat'&&n.grade==='Unique'){
  const explicit=Object.entries(onBoard.stats||{}).find(([k])=>canonical(k)===canonical(skill));
  if(explicit)return occurrences(nodes,'Stat',skill)<=Number(explicit[1]);
  // whelps: guide provides global counts, but not board coordinates. Don't guess which square.
 }
 return false;
}
function nearIndex(nodes){
 const pos=new Map();
 nodes.forEach((n,i)=>{if(n.type!=='None'&&n.row>0&&n.col>0)pos.set(n.row+':'+n.col,i)});
 return i=>{
  const n=nodes[i];return [[-1,0],[1,0],[0,-1],[0,1]]
   .map(([dr,dc])=>pos.get((n.row+dr)+':'+(n.col+dc))).filter(x=>x!==undefined);
 };
}
function pathTo(nodes,target){
 const adjacent=nearIndex(nodes);
 const dist=nodes.map(n=>n.open||n.type==='Start'?0:Infinity),prev=nodes.map(()=>-1),done=new Set();
 for(;;){
  let first=-1;
  dist.forEach((d,i)=>{if(!done.has(i)&&nodes[i].type!=='None'&&Number.isFinite(d)&&(first<0||d<dist[first]))first=i});
  if(first<0||first===target)break;
  done.add(first);
  for(const j of adjacent(first)){
   const v=dist[first]+(nodes[j].open?0:nodeCost(nodes[j]));
   if(v<dist[j]){dist[j]=v;prev[j]=first}
  }
 }
 if(!Number.isFinite(dist[target]))return null;
 const path=[];let next=target;
 while(next>=0&&!nodes[next].open&&nodes[next].type!=='Start'){
  path.unshift(next);next=prev[next];
 }
 return {cost:dist[target],steps:path.length};
}
function audit(){
 restore();
 const ref=byId(chosen),other=byId(chosen==='rosaEarly'?'whelps':'rosaEarly');
 const result={marked:{},missing:[],caution:[],activeCount:0,matched:0,targetCount:0,spent:0};
 if(!refs||!ref)return result;
 for(const [id,board] of Object.entries(boards())){
  const ns=board?.nodes||[];if(!ns.length)continue;
  result.marked[id]={};
  for(let i=0;i<ns.length;i++){
   const n=ns[i];if(n.type==='None'||n.type==='Start')continue;
   if(n.open){result.activeCount++;if(id!=='76'&&id!=='75')result.spent+=nodeCost(n)}
   const take=selected(ref,id,n,ns),peer=selected(other,id,n,ns);
   const label=nameOf(n);
   if(take){
    result.targetCount++;
    if(n.open){result.matched++;result.marked[id][i]='good'}
    else{
     result.marked[id][i]='missing';
     const route=pathTo(ns,i);
     if(route)result.missing.push({id,i,name:label,peer,route,chosen:ref.id});
    }
   }else if(n.open&&n.type==='SkillLevel'&&
    includes(['Lightning Strike Scattershot','Defiance'],label)&&id!=='76'){
     // Both published early-game player builds explicitly skipped these.
     result.marked[id][i]='caution';
     result.caution.push({id,i,name:label,
      note:'In beiden dokumentierten frühen Vergleichs-Builds ausgelassen. Das bedeutet nicht automatisch, dass ein Reset sinnvoll ist.'});
   }
  }
 }
 // Most agreement first; then reachable nodes with shorter extra investment.
 result.missing.sort((a,b)=>Number(b.peer)-Number(a.peer)||
   a.route.cost-b.route.cost||a.route.steps-b.route.steps);
 return result;
}
const style=document.createElement('style');
style.textContent=[
 '#daeva-audit{border:1px solid #947b4c;border-radius:12px;background:#162437;padding:14px;margin:0 0 15px}',
 '#daeva-audit h3{font-size:19px;margin:4px 0 11px;color:#f4d8a7}',
 '#daeva-audit h4{font-size:15px;margin:18px 0 8px;color:#e8c894}',
 '#daeva-audit p,#daeva-audit small{font-size:12px;color:#c0ccda;line-height:1.55}',
 '#daeva-audit .reference-tabs{display:flex;flex-wrap:wrap;gap:7px;margin:11px 0}',
 '#daeva-audit .reference-tabs button{flex:1;min-width:130px;border:1px solid #66778e;padding:11px 8px;border-radius:8px;background:#223249;color:#e5ecf8}',
 '#daeva-audit .reference-tabs button.active{border-color:#d9b576;background:#4a3a27;color:#f8e0b0}',
 '#daeva-audit .daeva-meta{background:#172f39;border:1px solid #53756a;padding:11px;border-radius:10px;margin:12px 0}',
 '#daeva-audit .daeva-counters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}',
 '#daeva-audit .daeva-counters div{background:#1b2e44;border:1px solid #4f667e;padding:9px;border-radius:9px}',
 '#daeva-audit .daeva-counters strong{display:block;color:#eacf9c;font-size:20px}',
 '#daeva-audit .daeva-counters small{display:block;font-size:11px}',
 '#daeva-audit .daeva-row{display:flex;align-items:center;gap:9px;background:#1b2b40;border:1px solid #52667c;border-left:4px solid #efc578;padding:10px;margin:7px 0;border-radius:9px}',
 '#daeva-audit .daeva-row.warn{border-left-color:#df8191}',
 '#daeva-audit .daeva-row>div{flex:1;min-width:0}',
 '#daeva-audit .daeva-row strong{font-size:13px;display:block}',
 '#daeva-audit .daeva-row button{padding:8px 10px;flex-shrink:0;font-size:11px}',
 '#daeva-audit .reference-note{background:#29281f;border:1px solid #807049;padding:11px;border-radius:9px;margin:10px 0}',
 '#daeva-audit .peer-stat{display:flex;justify-content:space-between;gap:10px;padding:7px 4px;border-bottom:1px solid #3c4e63}',
 '#daeva-audit .peer-stat b{font-size:12px}',
 '#daeva-audit details summary{font-size:13px;font-weight:750;color:#e9ca96;cursor:pointer;padding:10px 0}',
 '.aion-node.audit-good{border:2px solid #6cd6a0!important;box-shadow:inset 0 0 0 2px #419972!important}',
 '.aion-node.audit-missing{border:2px solid #f5c974!important;box-shadow:inset 0 0 0 2px #a4823d!important}',
 '.aion-node.audit-caution{border:2px solid #f18b99!important;box-shadow:inset 0 0 0 2px #ad5461!important}',
 '@media(max-width:600px){#daeva-audit .daeva-row{flex-wrap:wrap}#daeva-audit .daeva-row button{margin-left:auto}#daeva-audit .daeva-counters div{padding:7px 5px}}'
].join('\n');
document.head.append(style);
const host=document.createElement('div');host.id='daeva-audit';
$('aion-board-content').before(host);
function row(x,i,warning=false){
 const subtitle=warning?x.note:
  'Noch nicht aktiv · '+(x.peer?'Beide unabhängigen Autoren nutzen diesen Knoten · ':'In dieser veröffentlichten Vorlage · ')+
  'kürzester Weg: '+x.route.cost+' weitere Kristalle ('+x.route.steps+' Knoten)';
 return '<div class="daeva-row'+(warning?' warn':'')+'"><div><strong>'+(i+1)+'. '+esc(names[x.id]||x.id)+
 ' · '+esc(x.name)+'</strong><small>'+esc(subtitle)+'</small></div>'+
 '<button type="button" data-ref-board="'+esc(x.id)+'" data-ref-index="'+x.i+'">Auf Board zeigen</button></div>';
}
function render(){
 restore();
 const count=Object.keys(boards()).length;
 if(!count){host.innerHTML='<h3>Spieler-Builds vergleichen</h3><p>Bitte zuerst Daevanion-Boards importieren. Ohne deine freigeschalteten Knoten ist kein Vergleich möglich.</p>';return}
 if(!refs){host.innerHTML='<h3>Spieler-Builds vergleichen</h3><p>'+ (fetchFailed?'Vergleichsdaten momentan nicht verfügbar. Keine erfundenen Empfehlungen.':'Lade dokumentierte Spieler-Builds …') +'</p>';return}
 comparison=audit();const ref=byId(chosen);
 const sc=comparison;
 const refsButtons=refs.sources.map(x=>'<button type="button" data-ref-id="'+esc(x.id)+'" class="'+(chosen===x.id?'active':'')+'">'+esc(x.title)+'</button>').join('');
 const top=refs.top100||{};
 const meta=(top.nezekan||[]).map(x=>'<div class="peer-stat"><b>'+esc(x.name)+'</b><strong>'+x.pct+' %</strong></div>').join('');
 host.innerHTML='<div class="eyebrow">DAEVANION · VERÖFFENTLICHTE SPIELER-BUILDS</div>'+
 '<h3>Dein Skillbaum gegen andere Kleriker</h3>'+
 '<p>Die markierten Knoten stammen aus veröffentlichten Spieler-Builds. Die eigene Daevanion-Tafel wird nur für den Vergleich ausgelesen – es wird nichts im Spiel verändert.</p>'+
 '<div class="reference-tabs">'+refsButtons+'</div>'+
 '<div class="daeva-meta"><strong>'+esc(ref.creator)+' · '+esc(ref.points)+' Kristalle</strong>'+
 '<p>'+esc(ref.description)+'</p>'+
 '<small>Dein vorhandener Stand: ca. '+sc.spent+' Kristalle auf den vier PvE-Skilltafeln.</small>'+
 '<p><a target="_blank" rel="noopener noreferrer" href="'+esc(ref.uri)+'">Veröffentlichtes Spieler-Board ↗</a> · '+
 '<a target="_blank" rel="noopener noreferrer" href="'+esc(ref.documentation)+'">Quellen & Vergleich ↗</a></p></div>'+
 '<div class="daeva-counters"><div><strong>'+sc.matched+'/'+sc.targetCount+'</strong><small>Belegte Zielknoten vorhanden</small></div>'+
 '<div><strong>'+sc.missing.length+'</strong><small>Belegte Zielknoten fehlen</small></div>'+
 '<div><strong>'+sc.caution.length+'</strong><small>Auffällige frühe Abweichungen</small></div></div>'+
 (ref.nearlyFull?'<div class="reference-note">Endgame: Bei fast vollem Board werden auch Heilfähigkeiten gelernt. Das ist <b>keine frühe Damage-Empfehlung</b>. Für Damage-Fokus wähle die 239-Punkte-Vorlage.</div>':'')+
 '<div class="reference-note">🟢 Grün: im gewählten öffentlichen Spieler-Build und bei dir aktiv. 🟡 Gelb: im öffentlichen Build, bei dir noch offen. 🔴 Rot: in beiden frühen Builds ausdrücklich ausgelassener Skill. Graue Knoten: aus den Quellen nicht eindeutig belegbar – <b>nicht automatisch falsch</b>.</div>'+
 (!boards()['75']?'<p>Die neue Ariel-Tafel fehlt in deinem Import. Sie wird mangels Vergleich nicht bewertet.</p>':'')+
 '<h4>Diese Punkte fehlen gegenüber '+esc(ref.creator)+'</h4>'+
 (sc.missing.length?sc.missing.slice(0,10).map((x,i)=>row(x,i)).join(''):'<p>Alle anhand der Veröffentlichung belegbaren Zielknoten sind bei dir vorhanden.</p>')+
 (sc.missing.length>10?'<details><summary>Weitere '+(sc.missing.length-10)+' Unterschiede anzeigen</summary>'+
 sc.missing.slice(10).map((x,i)=>row(x,i+10)).join('')+'</details>':'')+
 '<h4>Bei beiden frühen Damage-Builds ausgelassen</h4>'+
 (sc.caution.length?sc.caution.map((x,i)=>row(x,i,true)).join(''):
 '<p>Keine eindeutig belegte auffällige Abweichung dieser Art gefunden.</p>')+
 '<details><summary>Was nutzen Top-100-Kleriker häufig? (separater Datensatz)</summary>'+
 '<p>'+esc(top.title)+' · Stichprobe '+(top.sampleSize||'?')+' · '+esc(top.observed||'')+'. Es sind <b>nicht nur Damage-Kleriker</b>. Die Prozentwerte beziehen sich auf angegebene Knoten in Nezekan; Mehrfachknoten werden nicht koordinatengenau zugeordnet.</p>'+
 meta+'<p><a target="_blank" rel="noopener noreferrer" href="'+esc(top.uri)+'">Top-100-Auswertung ansehen ↗</a></p></details>'+
 '<p>Die veröffentlichten Tabellen nennen nicht jeden Verbindungsknoten. Deshalb wird <b>kein kompletter fremder 15×15-Baum erfunden</b>. Eine goldene „Best-in-Slot“-Route lässt sich daraus nicht beweisen. Unterschiedlicher Punktestand und Spielstil machen einen direkten Vergleich begrenzt sinnvoll.</p>';
}
host.addEventListener('click',e=>{
 const btn=e.target.closest('[data-ref-id]');
 if(btn&&byId(btn.dataset.refId)){
  chosen=btn.dataset.refId;
  try{localStorage.setItem('aion2-daevanion-reference-v1:'+currentId(),chosen)}catch{}
  render();window.aionBoardsRefresh?.();return;
 }
 const node=e.target.closest('[data-ref-board]');
 if(node)window.aionBoardSelect?.(node.dataset.refBoard,Number(node.dataset.refIndex));
});
window.aionDaevanion={render,classify:(id,n)=>{
 const ns=boards()[String(id)]?.nodes||[],ix=ns.indexOf(n);
 return comparison?.marked?.[String(id)]?.[ix]||'';
}};
$('aion-board-button')?.addEventListener('click',render);
fetch('./cleric-board-references.json?v=1',{cache:'no-cache'})
.then(async res=>{if(!res.ok)throw Error('HTTP '+res.status);const d=await res.json();
 if(!Array.isArray(d.sources)||d.sources.length<2||!d.top100)throw Error('Ungültige Vergleichsdaten');
 refs=d;
}).catch(()=>{fetchFailed=true})
.finally(()=>{render();window.aionBoardsRefresh?.()});
render();
})();