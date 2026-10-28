import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const core=await readFile(new URL('daevanion-guide-plan-core.js',root),'utf8');
const ui=await readFile(new URL('daevanion-guide-steps.js',root),'utf8');
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
const meta=JSON.parse(await readFile(new URL('daevanion-eu-cleric-meta.json',root),'utf8'));
const html=await readFile(new URL('armory.html',root),'utf8');
const renderer=await readFile(new URL('nc-visuals.js',root),'utf8');
new vm.Script(core);new vm.Script(ui);
assert(html.includes('daevanion-guide-plan-core.js?v='));
assert(html.includes('daevanion-guide-steps.js?v='));
assert(html.indexOf('daevanion-guide-import.js?v=')<html.indexOf('daevanion-guide-plan-core.js?v='));
assert(html.indexOf('daevanion-guide-plan-core.js?v=')<html.indexOf('daevanion-guide-steps.js?v='));
assert(renderer.includes('window.aionGuideSteps?.isNext?.'),'next-node tile highlight is wired');
const boards={};
for(const [id,b] of Object.entries(snapshot.daevanionBoards||{})){
 boards[id]={nodes:(b.nodeList||[]).map(n=>({
  row:n.row,col:n.col,type:n.type,grade:n.grade,open:!!n.open,
  name:n.name,effects:(n.effectList||[]).map(e=>e.desc)
 }))};
}
const getBits=hex=>{
 const cells=[];
 for(let i=0;i<hex.length/2;i++){
  const n=parseInt(hex.slice(2*i,2*i+2),16);
  for(let bit=0;bit<8;bit++)if(n&(1<<bit))cells.push(i*8+bit);
 }
 return cells;
};
const guide={id:'testing',title:'Kleriker Plan',boards:Object.fromEntries(
 Object.entries(meta.boards).map(([id,b])=>[id,getBits(b.bitsHex)])
)};
class Element{
 constructor(tag=''){this.tag=tag;this.id='';this.innerHTML='';this.listeners={};this.style={};this.value='';this.open=false;}
 before(node){this.beforeNode=node}
 after(node){this.afterNode=node}
 append(){}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
}
const elements=new Map();
const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)};
const created=[];
const document={
 head:new Element('head'),getElementById:get,
 createElement:tag=>{const el=new Element(tag);created.push(el);return el;}
};
const saved=new Map();
const localStorage={
 getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)
};
const data={name:'Taty',sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},
 characterExtras:{boards}};
const window={aionBoardsRefresh(){this.refreshes=(this.refreshes||0)+1},
 aionBoardSelect(id,index){this.lastNode=[id,index]},
 aionGuideLibrary:{
  current:()=>guide,ownBoards:()=>data.characterExtras.boards,
  characterKey:()=>String(data.sourceRef.sid)+':'+String(data.sourceRef.id),
  isEditing:()=>false,
  showNode(id,index){window.lastNode=[id,index]}
 }};
const ctx={window,document,data,localStorage,Date};
vm.runInNewContext(core,ctx,{timeout:7000});
const planner=window.AionGuideRoutePlanner;
const initial=planner.plan(boards,guide,{});
assert.equal(initial.totals.target,297);
assert.equal(initial.totals.open,203);
assert.equal(initial.totals.unavailable,18);
assert.equal(initial.totals.pending,76);
assert.equal(initial.totals.connectors,0);
assert.equal(initial.steps.length,76);
assert(initial.warnings.some(x=>x.includes('Ariel')));
const nodeFromStep=step=>boards[step.boardId].nodes[step.index];
const first=initial.steps[0];
assert.equal(nodeFromStep(first).open,false);
assert.equal(first.target,true);
assert(first.row>=1&&first.row<=15&&first.col>=1&&first.col<=15);
vm.runInNewContext(ui,ctx,{timeout:7000});
const panel=created.find(x=>x.id==='dg-step-plan');
assert(panel);
assert.equal(get('aion-board-content').beforeNode,panel);
assert(panel.innerHTML.includes('DEIN PERSÖNLICHER SKILLFAHRPLAN'));
assert(panel.innerHTML.includes('NÄCHSTER SCHRITT'));
assert(panel.innerHTML.includes('Kleriker Plan'));
assert(panel.innerHTML.includes('Taty'));
assert(panel.innerHTML.includes('76'));
assert(panel.innerHTML.includes('Ariel'));
assert(panel.innerHTML.includes('Im Spiel geskillt'));
assert(window.aionGuideSteps.isNext(first.boardId,nodeFromStep(first)));
const fakeTarget=(kind,dataset)=>({closest:selector=>selector===kind?{dataset}:null});
panel.listeners.click[0]({target:fakeTarget('[data-dg-step-show]',{dgStepShow:first.boardId,dgStepIndex:String(first.index)})});
assert.deepEqual(window.lastNode,[first.boardId,first.index]);
panel.listeners.click[0]({target:fakeTarget('[data-dg-step-done]',{dgStepDone:first.boardId,dgStepCell:String(first.cell)})});
const key='aion2-daevanion-step-checks-v1:'+snapshot.serverId+':'+snapshot.characterId+':testing';
const manual=JSON.parse(saved.get(key));
assert(manual.confirmed[first.boardId].includes(first.cell));
assert.equal(nodeFromStep(first).open,false,'character NCSOFT node must NEVER be modified by marking done');
const after=window.aionGuideSteps.getPlan();
assert.equal(after.steps.length,75,'next step is calculated after user confirmation');
assert.equal(after.totals.confirmed,1);
assert(after.steps[0].cell!==first.cell);
assert(window.refreshes>=1);
panel.listeners.click[0]({target:fakeTarget('[data-dg-step-undo]',{dgStepUndo:first.boardId,dgStepCell:String(first.cell)})});
assert.equal(window.aionGuideSteps.getPlan().steps.length,76);
assert.equal(window.aionGuideSteps.getPlan().totals.confirmed,0);
panel.listeners.change[0]({target:{id:'dg-plan-board',value:'74'}});
assert(panel.innerHTML.includes('Triniel'));
assert(window.aionGuideSteps.getPlan().steps.some(s=>s.boardId==='71'));

const fixtureNodes=[
 {row:1,col:1,type:'Start',open:false,grade:'None',name:'Start'},
 {row:1,col:2,type:'Stat',open:false,grade:'Common',name:'Verbindung'},
 {row:1,col:3,type:'SkillLevel',open:false,grade:'Legend',name:'Wichtiger Knoten'}
];
const fixture={boards:{'71':[2]}},fixtureBoards={'71':{nodes:fixtureNodes}};
const path=planner.plan(fixtureBoards,fixture,{});
assert.equal(path.steps.length,2);
assert.deepEqual([...path.steps.map(s=>s.cell)],[1,2]);
assert.equal(path.steps[0].target,false,'intermediary bridge step is explicitly marked');
assert.equal(path.steps[1].target,true,'guide target remains next after connector');
assert.equal(path.steps[0].goal,'Wichtiger Knoten');
const confirmed=planner.plan(fixtureBoards,fixture,{'71':[1]});
assert.equal(confirmed.steps.length,1);
assert.equal(confirmed.steps[0].cell,2);
fixtureNodes[2].open=true;
const finished=planner.plan(fixtureBoards,fixture,{});
assert.equal(finished.steps.length,0);
assert.equal(finished.totals.open,1);
assert.equal(finished.totals.pending,0);

data.sourceRef={sid:'1305',id:'other-character'};
window.aionGuideSteps.render();
assert.equal(window.aionGuideSteps.getPlan().totals.confirmed,0);
assert(!panel.innerHTML.includes('manuell bestätigt</span>')||panel.innerHTML.includes('<b>0</b> manuell bestätigt'));
data.characterExtras.boards={};
window.aionGuideSteps.render();
assert(panel.innerHTML.includes('Charakterdaten')||panel.innerHTML.includes('Charakter-Tafel'));
assert.equal(window.aionGuideSteps.getPlan().totals.unavailable,297);
guide.boards={'71':[]};
data.characterExtras.boards=boards;
window.aionGuideSteps.render();
assert(panel.innerHTML.includes('noch keine Knoten gespeichert'),'empty guide should ask for manual node selection');
console.log('Guide step-by-step PASS: 297 authentic targets, shortest connector paths, next-node highlight, confirm/undo, character isolation, missing boards');
