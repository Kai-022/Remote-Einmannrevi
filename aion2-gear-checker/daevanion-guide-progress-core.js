/* Read-only Guide ↔ Character progress metrics for AION 2 Daevanion boards.
 * Progress is based ONLY on actually imported open flags. No manual checkmarks.
 * Separate unsupported/unavailable board cells from truly missing nodes. */
(()=>{
'use strict';
const ORDER=['71','72','73','74','75','76'];
const NAMES={'71':'Nezekan','72':'Zikel','73':'Vaizel','74':'Triniel','75':'Ariel','76':'Azphel'};
const validCell=n=>Number.isInteger(n)&&n>=0&&n<225;
const position=n=>(Number(n.row)-1)*15+(Number(n.col)-1);
function signature(guide){
 const normalized={};
 for(const id of ORDER){
  if(Array.isArray(guide?.boards?.[id])){
   normalized[id]=[...new Set(guide.boards[id].filter(validCell))].sort((a,b)=>a-b);
  }
 }
 return JSON.stringify(normalized);
}
function measure(boards,guide){
 const boardSummary=[],owned={},errors=[],unknown={},unknownTargets=0;
 let total=0,confirmed=0,missing=0,known=0;
 for(const id of ORDER){
  const raw=guide?.boards?.[id];
  if(!Array.isArray(raw))continue;
  const targets=[...new Set(raw.filter(validCell))].sort((a,b)=>a-b);
  if(!targets.length)continue;
  total+=targets.length;
  const nodes=boards?.[id]?.nodes;
  const summary={id,name:NAMES[id],total:targets.length,confirmed:0,missing:0,unknown:0,available:false};
  boardSummary.push(summary);
  if(!Array.isArray(nodes)||!nodes.length){
   summary.unknown=targets.length;unknownTargets+=targets.length;
   unknown[id]=targets;errors.push(NAMES[id]+' nicht im Charakterprofil enthalten');
   continue;
  }
  const cellMap=new Map();
  for(const node of nodes){
   const row=Number(node?.row),col=Number(node?.col);
   if(Number.isInteger(row)&&Number.isInteger(col)&&row>=1&&row<=15&&col>=1&&col<=15){
    cellMap.set(position(node),node);
   }
  }
  summary.available=true;
  for(const cell of targets){
   const node=cellMap.get(cell);
   if(!node||node.type==='None'||node.type==='Start'){
    summary.unknown++;unknownTargets++;
    (unknown[id]??=[]).push(cell);
    continue;
   }
   known++;
   if(node.open){
    summary.confirmed++;confirmed++;
    (owned[id]??=[]).push(cell);
   }else{
    summary.missing++;missing++;
   }
  }
  if(summary.unknown)errors.push(NAMES[id]+': '+summary.unknown+' nicht zuordenbare Guide-Knoten');
 }
 return {total,confirmed,missing,known,unknown:unknownTargets,
  fraction:total?Math.round(confirmed/total*100):0,
  boards:boardSummary,owned,unavailable:unknown,errors,signature:signature(guide)};
}
function additions(oldSnapshot,current){
 const previous=oldSnapshot?.owned||{},today=current?.owned||{};
 const gained={},lost={};let newly=0,removed=0;
 for(const id of ORDER){
  const before=new Set(Array.isArray(previous[id])?previous[id]:[]);
  const now=new Set(Array.isArray(today[id])?today[id]:[]);
  const plus=[...now].filter(x=>!before.has(x)).sort((a,b)=>a-b);
  const minus=[...before].filter(x=>!now.has(x)).sort((a,b)=>a-b);
  if(plus.length){gained[id]=plus;newly+=plus.length;}
  if(minus.length){lost[id]=minus;removed+=minus.length;}
 }
 return {newly,removed,gained,lost};
}
if(typeof window!=='undefined')window.AionGuideProgress={measure,additions,signature,ORDER,NAMES};
})();