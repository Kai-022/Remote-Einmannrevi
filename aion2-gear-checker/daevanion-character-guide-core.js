/* Read-only skill/stigma/progression extraction from imported NCSOFT profiles.
 * Source guide goals are curated in daevanion-build-presets.js.
 * Never assumes specialty loadouts or image-only boards are machine-readable. */
(()=>{
'use strict';
const norm=s=>String(s||'').normalize('NFKC').replace(/[‘’´\u2019']/g,"'").toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim();
function lvl(skill){
 const raw=skill?.skillLevel??skill?.level??null;
 if(typeof raw==='number')return Number.isFinite(raw)?raw:null;
 const match=String(raw||'').match(/(?:stufe\s*)?(\d+)/i);
 return match?Number(match[1]):null;
}
const acquired=s=>s?.acquired===true||s?.acquired===1||s?.acquired==='1'||(lvl(s)!==null&&lvl(s)>0);
const equipped=s=>s?.equipped===true||s?.equip===true||s?.equipped===1||s?.equip===1||
 s?.equipped==='1'||s?.equip==='1';
function rows(data,group){
 const extra=data?.characterExtras||{};
 const source=group==='active'?extra.skills:group==='passive'?extra.passives:extra.dpSkills;
 return Array.isArray(source)?source:[];
}
function match(list,name){
 const wanted=norm(name);
 return list.find(r=>norm(r?.name)===wanted)||null;
}
function evaluateCategory(data,preset,category){
 const definitions=category==='active'?preset.active:category==='passive'?preset.passives:preset.stigmas;
 const list=rows(data,category),available=list.length>0;
 const goalRows=(definitions||[]).map((goal,i)=>{
  const found=match(list,goal.name),level=lvl(found);
  const learned=found&&acquired(found);
  const active=found&&equipped(found);
  let state='unknown',reason='Dieser Bereich ist im Charakterprofil nicht auslesbar.';
  if(available){
   if(!found||!learned){
    state='missing';reason=category==='stigma'?'Nicht ausgerüstet oder nicht erlernt.':'Noch nicht als erlernt erkannt.';
   }else if(category==='stigma'&&!active){
    state='missing';reason='Vorhanden, aber nicht ausgerüstet.';
   }else if(Number.isInteger(goal.minLevel)&&level!==null&&level<goal.minLevel){
    state='missing';reason='Mindestens Stufe '+goal.minLevel+' für den Guide-Meilenstein.';
   }else if(Number.isInteger(goal.minLevel)&&level===null){
    state='unknown';reason='Skillstufe nicht auslesbar – Ziel noch nicht bestätigt.';
   }else{state='done';reason=category==='stigma'?'Stigma ist ausgerüstet.':'Im Charakterprofil erkannt.';}
  }
  const upgrade=Number.isInteger(goal.optionalLevel)&&level!==null&&learned&&level<goal.optionalLevel
    ?{current:level,target:goal.optionalLevel}:null;
  return {id:category+':'+norm(goal.name),category,name:goal.name,rank:goal.rank||i+1,
   state,reason,level,acquired:!!learned,equipped:!!active,minimum:goal.minLevel||null,
   optionalLevel:goal.optionalLevel||null,upgrade,why:goal.why||''};
 });
 return goalRows;
}
function evaluate(data,preset,guideBoards,boardCalculator){
 if(!preset)return {skills:[],groups:{},confirmed:0,needed:0,unknown:0,improvements:[],
  specialties:[],board:null,all:[],characterName:data?.name||'',asOf:data?.importedAt||null};
 const active=evaluateCategory(data,preset,'active');
 const passive=evaluateCategory(data,preset,'passive');
 const stigma=evaluateCategory(data,preset,'stigma');
 const groups={active,passive,stigma},all=[...active,...passive,...stigma];
 const boardsPresent=guideBoards&&Object.values(guideBoards.boards||{}).some(x=>Array.isArray(x)&&x.length>0);
 const board=boardsPresent&&boardCalculator?.measure?
  boardCalculator.measure(data?.characterExtras?.boards||{},guideBoards):null;
 const specialties=(preset.specialties||[]).map(x=>({
  name:x.name,choices:x.choices,note:x.note||'',state:'unknown',
  reason:'Die gewählten Skill-Spezialitäten sind in den vorhandenen Profildaten nicht enthalten.'
 }));
 const upgrades=all.filter(x=>x.upgrade);
 return {
  groups,all,board,specialties,improvements:upgrades,
  confirmed:all.filter(x=>x.state==='done').length+(board?.confirmed||0),
  needed:all.filter(x=>x.state==='missing').length+(board?.missing||0),
  unknown:all.filter(x=>x.state==='unknown').length+(board?.unknown||0),
  available:all.filter(x=>x.state!=='unknown').length+(board?.known||0),
  total:all.length+(board?.total||0),
  asOf:data?.importedAt||null,characterName:data?.name||'Charakter'
 };
}
function pointState(results){
 const status={};
 for(const item of results?.all||[])if(item.state!=='unknown')status[item.id]=item.state==='done';
 const boards=results?.board?.owned||{};
 for(const [id,list] of Object.entries(boards)){
  if(!Array.isArray(list))continue;
  for(const cell of list)status['board:'+id+':'+cell]=true;
 }
 return status;
}
function gains(oldRecord,newRecord){
 const previous=oldRecord?.state||{},current=newRecord?.state||{};
 const newly=[],removed=[];
 for(const [id,value] of Object.entries(current)){
  if(value===true&&previous[id]===false)newly.push(id);
  if(value===false&&previous[id]===true)removed.push(id);
 }
 // Board comparison: previous absence is confirmed not-open only if it was in
 // previous tracked node set, otherwise it could have been unavailable.
 const priorKnown=new Set(oldRecord?.knownBoards||[]);
 const currentKnown=new Set(newRecord?.knownBoards||[]);
 for(const id of currentKnown){
  if(!id.startsWith('board:')||!priorKnown.has(id))continue;
  if(current.state[id]===true&&!Object.prototype.hasOwnProperty.call(previous,id))newly.push(id);
  if(current.state[id]!==true&&previous[id]===true)removed.push(id);
 }
 return {newly:[...new Set(newly)],removed:[...new Set(removed)]};
}
function snapshot(result,sourceTime){
 const state=pointState(result);
 const knownBoards=[];
 for(const b of result?.board?.boards||[]){
  if(b.available)for(let pos=0;pos<225;pos++)knownBoards.push('board:'+b.id+':'+pos);
 }
 return {sourceTime:String(sourceTime||''),savedAt:new Date().toISOString(),
  done:result.confirmed,total:result.total,state,knownBoards};
}
window.AionGuideCharacterProgress={norm,lvl,rows,match,evaluate,pointState,gains,snapshot};
})();