/* AION 2 guide-route planner: browser-only, character board snapshot + guide cells.
 * Uses orthogonally adjacent cells; this is an estimated geometric unlock route,
 * NOT a verified server unlock/currency calculation or DPS optimizer.
 * Each step is a node not yet open, in planned shortest-path order. */
(()=>{
'use strict';
const BOARD_NAMES={'71':'Nezekan','72':'Zikel','73':'Vaizel','74':'Triniel','75':'Ariel','76':'Azphel'};
const SORT=['71','72','73','74','75','76'];
const cell=n=>(Number(n.row)-1)*15+(Number(n.col)-1);
const playable=n=>n&&n.type!=='None'&&Number.isInteger(Number(n.row))&&Number.isInteger(Number(n.col))&&
 Number(n.row)>=1&&Number(n.row)<=15&&Number(n.col)>=1&&Number(n.col)<=15;
function label(n){
 return String((Array.isArray(n.effects)?n.effects:[]).find(v=>/\+\s*\d+\s*$/.test(v))||n.name||n.type||'Knoten')
  .replace(/^Skill Level Up\s*-\s*/i,'').replace(/\s*\+\s*\d+\s*$/,'').trim();
}
function buildGraph(nodes){
 const index=new Map(),edges=nodes.map(()=>[]);
 nodes.forEach((n,i)=>{if(playable(n))index.set(cell(n),i)});
 for(const [pos,i] of index){
  const r=Math.floor(pos/15),c=pos%15;
  for(const [dr,dc] of [[-1,0],[0,-1],[0,1],[1,0]]){
   if(r+dr<0||r+dr>=15||c+dc<0||c+dc>=15)continue;
   const neighbor=index.get((r+dr)*15+c+dc);
   if(neighbor!==undefined)edges[i].push(neighbor);
  }
 }
 return {index,edges};
}
function getRoute(nodes,edges,open,targets){
 const n=nodes.length,dist=new Array(n).fill(Infinity),prev=new Array(n).fill(-1),used=new Set();
 for(const i of open)dist[i]=0;
 for(let turn=0;turn<n;turn++){
  let best=-1;
  for(let i=0;i<n;i++){
   if(used.has(i)||!playable(nodes[i])||!Number.isFinite(dist[i]))continue;
   if(best<0||dist[i]<dist[best]||(dist[i]===dist[best]&&i<best))best=i;
  }
  if(best<0)break;
  used.add(best);
  for(const j of edges[best]){
   const p=open.has(j)?0:targets.has(cell(nodes[j]))?10:13;
   if(dist[best]+p<dist[j]){dist[j]=dist[best]+p;prev[j]=best;}
  }
 }
 let selected=-1;
 for(const index of targets.values()){
  if(open.has(index)||!Number.isFinite(dist[index]))continue;
  if(selected<0||dist[index]<dist[selected]||(dist[index]===dist[selected]&&cell(nodes[index])<cell(nodes[selected])))selected=index;
 }
 if(selected<0)return null;
 const path=[];let v=selected,guard=0;
 while(v>=0&&!open.has(v)&&guard++<n){path.unshift(v);v=prev[v];}
 if(v<0||guard>=n)return null;
 return {target:selected,path};
}
function plan(boards,guide,confirmed={}){
 if(!guide||!guide.boards)return {boards:[],steps:[],totals:{target:0,open:0,confirmed:0,pending:0,connectors:0,blocked:0,unavailable:0},warnings:[]};
 const result={boards:[],steps:[],totals:{target:0,open:0,confirmed:0,pending:0,connectors:0,blocked:0,unavailable:0},warnings:[]};
 const ids=SORT.filter(id=>Array.isArray(guide.boards[id]));
 for(const id of ids){
  const targets=new Set(guide.boards[id].filter(Number.isInteger).filter(c=>c>=0&&c<225));
  if(!targets.size)continue;
  const entry={id,name:BOARD_NAMES[id],target:targets.size,open:0,confirmed:0,
   pending:0,connectors:0,blocked:[],unavailable:false,steps:[]};
  result.boards.push(entry);
  result.totals.target+=targets.size;
  const nodes=boards?.[id]?.nodes;
  if(!Array.isArray(nodes)||!nodes.length){
   entry.unavailable=true;entry.pending=targets.size;result.totals.unavailable+=targets.size;
   result.warnings.push(entry.name+': Charakter-Tafel fehlt. Bitte die offiziellen Boarddaten nachladen.');
   continue;
  }
  const {index,edges}=buildGraph(nodes),open=new Set();
  const approved=new Set(Array.isArray(confirmed[id])?confirmed[id]:[]);
  const actualGoals=new Set(),plannedGoals=new Set();
  for(const [i,node] of nodes.entries()){
   if(playable(node)&&(node.open||node.type==='Start')){
    open.add(i);
    if(targets.has(cell(node))&&node.open)actualGoals.add(cell(node));
   }
  }
  const allTargets=new Map();
  for(const pos of targets){
   const i=index.get(pos);
   if(i===undefined||nodes[i].type==='None'){
    entry.blocked.push({cell:pos,reason:'Dieser Knoten existiert in der importierten Boardversion nicht.'});
    continue;
   }
   allTargets.set(pos,i);
   if(actualGoals.has(pos)){entry.open++;result.totals.open++;}
  }
  const manualOpen=new Set();
  for(const pos of approved){
   const i=index.get(pos);
   if(i!==undefined&&!open.has(i)&&nodes[i].type!=='Start'){
    manualOpen.add(pos);open.add(i);
    if(targets.has(pos)&&allTargets.has(pos)){
     entry.confirmed++;result.totals.confirmed++;
    }
   }
  }
  for(const pos of targets){
   if(!allTargets.has(pos))continue;
   if(actualGoals.has(pos)||manualOpen.has(pos))plannedGoals.add(pos);
  }
  let pending=new Map([...allTargets].filter(([pos])=>!plannedGoals.has(pos)));
  let rounds=0;
  while(pending.size&&rounds++<250){
   const route=getRoute(nodes,edges,open,new Map(pending));
   if(!route)break;
   const focus=label(nodes[route.target]);
   if(!route.path.length){pending.delete(cell(nodes[route.target]));continue;}
   for(const i of route.path){
    if(open.has(i))continue;
    open.add(i);
    const node=nodes[i],pos=cell(node),isTarget=targets.has(pos);
    const step={boardId:id,boardName:entry.name,index:i,cell:pos,row:Number(node.row),col:Number(node.col),
     name:label(node),grade:String(node.grade||''),kind:String(node.type||''),
     target:isTarget,goal:focus,reason:isTarget?'Im importierten Guide vorgesehen':'Verbindungsknoten auf dem kürzesten geschätzten Weg zu „'+focus+'“'};
    entry.steps.push(step);result.steps.push(step);
    if(isTarget)pending.delete(pos);
    else{entry.connectors++;result.totals.connectors++;}
   }
   pending.delete(cell(nodes[route.target]));
  }
  entry.blocked.push(...[...pending].map(([pos])=>({cell:pos,reason:'Vom bereits geöffneten Bereich aus kein zusammenhängender Weg berechenbar.'})));
  entry.pending=targets.size-entry.open-entry.confirmed-entry.blocked.filter(x=>!allTargets.has(x.cell)).length;
  result.totals.pending+=entry.steps.filter(s=>s.target).length+entry.blocked.filter(x=>allTargets.has(x.cell)).length;
  result.totals.blocked+=entry.blocked.length;
  if(entry.blocked.length)result.warnings.push(entry.name+': '+entry.blocked.length+' Guide-Ziele lassen sich nicht zuordnen oder verbinden.');
  if(id==='76'&&entry.steps.length)result.warnings.push('Azphel verwendet PvP-spezifische Fortschritte; die Währung wird hier nicht berechnet.');
 }
 result.steps.forEach((s,i)=>{s.number=i+1});
 return result;
}
if(typeof window!=='undefined')window.AionGuideRoutePlanner={plan,cell,label,BOARD_NAMES,SORT};
})();
