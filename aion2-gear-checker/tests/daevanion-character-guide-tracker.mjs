import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const paths=['daevanion-build-presets.js','daevanion-guide-progress-core.js',
 'daevanion-character-guide-core.js','daevanion-guide-tracker.js','daevanion-guide-codec.js'];
const sources=await Promise.all(paths.map(name=>readFile(new URL(name,root),'utf8')));
for(const source of sources)new vm.Script(source);
const html=await readFile(new URL('armory.html',root),'utf8');
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
assert(html.includes('daevanion-guide-tracker.js?v='));
assert(!html.includes('src="./daevanion-guide-steps.js?v='),'manual confirmation UI should not load');
assert(html.indexOf('daevanion-build-presets.js?v=')<html.indexOf('daevanion-guide-codec.js?v='));
assert(html.indexOf('daevanion-character-guide-core.js?v=')<html.indexOf('daevanion-guide-tracker.js?v='));
const profileSkills=snapshot.equipment.skill.skillList;
const byGroup=name=>profileSkills.filter(s=>s.category===name).map(s=>({
 name:s.name,level:s.skillLevel?'Stufe '+s.skillLevel:'Nicht erlernt',
 acquired:!!s.acquired,equipped:!!s.equip,category:s.category
}));
const data={
 name:'Taty',source:'NCSOFT – serverseitiger Testabruf',
 sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},importedAt:snapshot.generatedAt,
 characterExtras:{skills:byGroup('Active'),passives:byGroup('Passive'),dpSkills:byGroup('Dp'),boards:{}}
};
const knownUrl='https://mobalytics.gg/gamebase/guides/aion-2-cleric-condemnation-pve-build';
const guide={id:'my-mobalytics',title:'Mobalytics Condemnation PvE',source:knownUrl,
 templateId:'mobalytics-cleric-condemnation-pve',boards:{},format:'Mobalytics-Guide'};
class Fake{
 constructor(tag=''){this.tag=tag;this.id='';this.innerHTML='';this.textContent='';this.listeners={};this.style={};}
 before(node){this.beforeNode=node}
 after(node){this.afterNode=node}
 append(){}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
}
const els=new Map(),created=[];
const get=id=>{if(!els.has(id))els.set(id,new Fake(id));return els.get(id)};
const document={head:new Fake('head'),getElementById:get,
 createElement:tag=>{const node=new Fake(tag);created.push(node);return node}};
const store=new Map(),localStorage={
 getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)
};
const events={};const win={
 addEventListener(t,fn){(events[t]??=[]).push(fn)},
 dispatchEvent(e){for(const f of events[e.type]||[])f(e)},
 aionGuideLibrary:{
  current:()=>guide,characterKey:()=>data.sourceRef.sid+':'+data.sourceRef.id,
  ownBoards:()=>data.characterExtras.boards,isEditing:()=>false
 }
};
const ctx={window:win,document,localStorage,data,URL,Date,console};
vm.runInNewContext(sources[0],ctx,{timeout:3000});
vm.runInNewContext(sources[1],ctx,{timeout:3000});
vm.runInNewContext(sources[2],ctx,{timeout:3000});
vm.runInNewContext(sources[4],ctx,{timeout:3000});
const parsed=win.AionGuideBoardCodec.parse(knownUrl+'?utm_source=chatgpt');
assert.equal(parsed.templateId,guide.templateId);
assert.equal(parsed.sourceUrl,knownUrl);
assert.equal(Object.keys(parsed.boards).length,0,'image-only guide must never fabricate board node coordinates');
assert.throws(()=>win.AionGuideBoardCodec.parse('https://mobalytics.gg/gamebase/guides/other-build'),'unsupported Mobalytics guides not treated as known');
const preset=win.AionGuidePresets.get(guide.templateId);
assert(preset&&preset.active.length===10);
assert.equal(preset.stigmas.length,4);
const baseline=win.AionGuideCharacterProgress.evaluate(data,preset,guide,win.AionGuideProgress);
assert.equal(baseline.confirmed,22);
assert.equal(baseline.total,23);
assert.equal(baseline.needed,1);
assert.equal(baseline.unknown,0);
assert.equal(baseline.board,null);
assert.equal(baseline.improvements.length,1,'Radiant Recovery is below optional level 20');
assert.equal(baseline.improvements[0].name,'Radiant Recovery');
assert.equal(baseline.groups.active.find(x=>x.name==='Condemnation').level,18);
assert.equal(baseline.groups.stigma.find(x=>x.name==='Earth Punishment').level,20);
assert.equal(baseline.groups.stigma.find(x=>x.name==='Earth Punishment').state,'done');
assert.equal(baseline.specialties.length,10);
const modified={...data,characterExtras:{...data.characterExtras,dpSkills:[]}};
const limited=win.AionGuideCharacterProgress.evaluate(modified,preset,guide,win.AionGuideProgress);
assert.equal(limited.unknown,4,'unavailable stigma data is not misclassified as missing');
assert.equal(limited.needed,1);
vm.runInNewContext(sources[3],ctx,{timeout:5000});
const tracker=created.find(x=>x.id==='dg-character-tracker');
assert(tracker);
assert.equal(get('aion-board-content').beforeNode,tracker);
assert(tracker.innerHTML.includes('22'));
assert(tracker.innerHTML.includes('96 %'));
assert(tracker.innerHTML.includes('Condemnation'));
assert(tracker.innerHTML.includes('Mobalytics'));
assert(tracker.innerHTML.includes('Daevanion-Tafeln im Guide'));
assert(tracker.innerHTML.includes('nicht automatisch prüfbar'));
assert(!tracker.innerHTML.includes('Im Spiel geskillt ✓'));
let history=win.aionGuideTracker.getHistory();
assert.equal(history.length,1,'initial imported snapshot establishes baseline');
assert.equal(history[0].first,true);
win.aionGuideTracker.render();
assert.equal(win.aionGuideTracker.getHistory().length,1,'same snapshot must never duplicate progress');
const oldCond=data.characterExtras.skills.find(x=>x.name==='Condemnation');
const before=oldCond.level;
oldCond.level='Stufe 10';
data.importedAt=new Date(Date.parse(snapshot.generatedAt)+86400000).toISOString();
win.dispatchEvent({type:'aion2:character-imported'});
let now=win.aionGuideTracker.getResults();
assert.equal(now.confirmed,21);
assert.equal(now.needed,2);
assert(tracker.innerHTML.includes('mindestens Stufe 12'));
history=win.aionGuideTracker.getHistory();
assert.equal(history.length,2);
assert(history[1].removed.includes('active:condemnation'),'regression is detected');
oldCond.level=before;
data.importedAt=new Date(Date.parse(snapshot.generatedAt)+2*86400000).toISOString();
win.dispatchEvent({type:'aion2:character-imported'});
history=win.aionGuideTracker.getHistory();
assert.equal(history.length,3);
assert(history[2].newly.includes('active:condemnation'),'newly met guide goal is detected');
assert.equal(win.aionGuideTracker.getResults().confirmed,22);
const guideOnAnotherCharacter={...guide};
data.sourceRef={sid:'1305',id:'different-character'};
win.aionGuideTracker.render();
assert.equal(win.aionGuideTracker.getHistory().length,1,'character history must be kept separate');
assert.equal(win.aionGuideTracker.getHistory()[0].first,true);
// An Aion2Data-only guide compares actual board unlocks and does not claim skill targets.
const boardData=snapshot.daevanionBoards;
data.characterExtras.boards=Object.fromEntries(Object.entries(boardData).map(([id,b])=>[id,{
 nodes:b.nodeList.map(n=>({row:n.row,col:n.col,type:n.type,open:!!n.open}))
}]));
const id='71',allNodes=boardData[id].nodeList;
const cells=allNodes.filter(x=>x.type!=='None'&&x.type!=='Start').slice(0,5).map(x=>(x.row-1)*15+(x.col-1));
const onlyBoard={boards:{'71':cells}};
const boardProgress=win.AionGuideCharacterProgress.evaluate(data,null,onlyBoard,win.AionGuideProgress);
assert.equal(boardProgress.total,cells.length);
assert.equal(boardProgress.groups.active.length,0);
assert.equal(boardProgress.confirmed+boardProgress.needed+boardProgress.unknown,cells.length);
console.log('Guide character tracking PASS: real Mobalytics source, 21 goals, specialties honesty, new imports, optional level milestones, no manual checkmarks, per-character history, board-only guides');
