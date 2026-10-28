import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const overlay=await readFile(new URL('daevanion-guide-overlay.js',root),'utf8');
const progress=await readFile(new URL('daevanion-guide-progress-core.js',root),'utf8');
const html=await readFile(new URL('armory.html',root),'utf8');
const meta=JSON.parse(await readFile(new URL('daevanion-eu-cleric-meta.json',root),'utf8'));
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
new vm.Script(overlay);new vm.Script(progress);
assert(html.includes('daevanion-guide-overlay.js?v='),'explicit overlay must load');
assert(html.indexOf('daevanion-guide-tracker.js?v=')<html.indexOf('daevanion-guide-overlay.js?v='),
 'comparison module must load after actual guide progress');

class Fake {
 constructor(id=''){
  this.id=id;this.innerHTML='';this.listeners={};this.style={};this.children=[];
 }
 before(node){this.beforeNode=node}
 append(...children){this.children.push(...children)}
 addEventListener(t,f){(this.listeners[t]??=[]).push(f)}
 querySelector(){return {click:()=>{this.clicked=(this.clicked||0)+1}}}
}
const byId=new Map(),created=[];
const get=id=>{if(!byId.has(id))byId.set(id,new Fake(id));return byId.get(id)};
const document={head:new Fake('head'),getElementById:get,
 createElement:()=>{const el=new Fake();created.push(el);return el}};
const saved=new Map(),localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
const boards=Object.fromEntries(Object.entries(snapshot.daevanionBoards).map(([id,b])=>[
 id,{nodes:b.nodeList.map(n=>({row:Number(n.row),col:Number(n.col),type:n.type,open:!!n.open}))}
]));
const parse=hex=>{
 const result=[];
 for(let i=0;i<hex.length/2;i++){
  const byte=parseInt(hex.slice(2*i,2*i+2),16);
  for(let bit=0;bit<8;bit++)if(byte&(1<<bit))result.push(i*8+bit);
 }
 return result;
};
const guide={id:'test-guide',title:'Original Kleriker-Guide',boards:Object.fromEntries(
 Object.entries(meta.boards).map(([id,b])=>[id,parse(b.bitsHex)]))};
const data={name:'Taty',sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},characterExtras:{boards}};
const handlers={};
let refreshes=0,rawRenderCount=0,guideAvailable=true;
const window={
 addEventListener(t,f){(handlers[t]??=[]).push(f)},
 aionGuideLibrary:{
  current:()=>guideAvailable?guide:null,
  characterKey:()=>data.sourceRef.sid+':'+data.sourceRef.id,
  ownBoards:()=>data.characterExtras.boards
 },
 aionDaevanion:{
  classify(id,node){return node.open?'good':'missing'},
  render(){rawRenderCount++}
 },
 aionBoardsRefresh(){refreshes++}
};
const ctx={window,document,data,localStorage,console};
vm.runInNewContext(progress,ctx,{timeout:4000});
vm.runInNewContext(overlay,ctx,{timeout:4000});
const panel=created.find(x=>x.id==='dg-guide-overlay');
assert(panel,'board overlay must mount');
assert.equal(get('aion-board-content').beforeNode,panel);
assert(panel.innerHTML.includes('Original Kleriker-Guide'));
assert(panel.innerHTML.includes('203'));
assert(panel.innerHTML.includes('297'));
assert(panel.innerHTML.includes('68 %'),'overall percent is 203 / 297 (includes unavailable Ariel)');
assert(panel.innerHTML.includes('18'));
assert(panel.innerHTML.includes('nicht prüfbar'));
assert(panel.innerHTML.includes('Guide über meine Boards legen'));
const first=boards['71'].nodes.find(n=>n.type==='Stat'&&!n.open);
assert.equal(window.aionDaevanion.classify('71',first),'missing');
assert.equal(window.aionGuideOverlay.getMode(),'compare');
panel.listeners.click[0]({target:{closest:q=>q==='[data-ov-mode]'?{dataset:{ovMode:'character'}}:null}});
assert.equal(window.aionGuideOverlay.getMode(),'character');
assert.equal(window.aionDaevanion.classify('71',first),'');
assert(saved.has('aion2-guide-board-overlay-v1:'+snapshot.serverId+':'+snapshot.characterId+':test-guide'));
assert(refreshes>=1);
panel.listeners.click[0]({target:{closest:q=>q==='[data-ov-mode]'?{dataset:{ovMode:'compare'}}:null}});
assert.equal(window.aionDaevanion.classify('71',first),'missing');
panel.listeners.click[0]({target:{closest:q=>q==='[data-ov-board]'?{dataset:{ovBoard:'71'}}:null}});
assert.equal(get('aion-board-content').clicked,1,'board selection is interactive');
const before=window.aionGuideOverlay.getProgress().confirmed;
const cell=guide.boards['71'].find(pos=>{
 const n=boards['71'].nodes.find(n=>(n.row-1)*15+(n.col-1)===pos);
 return n&&!n.open;
});
const actual=boards['71'].nodes.find(n=>(n.row-1)*15+(n.col-1)===cell);
assert(actual);
actual.open=true;
for(const cb of handlers['aion2:character-imported']||[])cb();
assert.equal(window.aionGuideOverlay.getProgress().confirmed,before+1);
assert.equal(panel.innerHTML.includes('204'),true);
data.sourceRef={sid:snapshot.serverId,id:'different-character'};
window.aionGuideOverlay.render();
assert.equal(window.aionGuideOverlay.getMode(),'compare','overlay mode is separate per character');
guideAvailable=false;
window.aionGuideOverlay.render();
assert.equal(panel.style.display,'none');
assert.equal(window.aionDaevanion.classify('71',first),'missing','without guide raw classification is kept');
assert(rawRenderCount>0);
console.log('Guide overlay PASS: actual imported 203/297, 18 unavailable, per-board cards, live updates, mode toggle and character isolation');
