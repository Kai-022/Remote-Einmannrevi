import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const codec=await readFile(new URL('daevanion-guide-codec.js',root),'utf8');
const importer=await readFile(new URL('daevanion-guide-import.js',root),'utf8');
const html=await readFile(new URL('armory.html',root),'utf8');
const meta=JSON.parse(await readFile(new URL('daevanion-eu-cleric-meta.json',root),'utf8'));
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
new vm.Script(codec);new vm.Script(importer);
assert(html.includes('daevanion-guide-codec.js?v='),'guide decoder must load');
assert(html.includes('daevanion-guide-import.js?v='),'guide importer must load');
assert(html.indexOf('daevanion-eu-comparison.js?v=')<html.indexOf('daevanion-guide-codec.js?v='));
assert(html.indexOf('daevanion-guide-codec.js?v=')<html.indexOf('daevanion-guide-import.js?v='));
class Fake {
 constructor(id=''){
  this.id=id;this.innerHTML='';this.listeners={};this.dataset={};this.style={};
  this.value='';this.open=false;this.textContent='';this.files=[];
 }
 before(node){this.beforeNode=node}
 after(node){this.afterNode=node}
 append(){}
 addEventListener(type,cb){(this.listeners[type]??=[]).push(cb)}
 querySelector(){return null}
 querySelectorAll(){return []}
 click(){}
}
const byId=new Map(),created=[];
const get=id=>{if(!byId.has(id))byId.set(id,new Fake(id));return byId.get(id)};
const document={
 head:new Fake('head'),getElementById:get,
 createElement:()=>{const e=new Fake();created.push(e);return e}
};
const memory=new Map();
const localStorage={
 getItem:k=>memory.get(k)||null,
 setItem:(k,v)=>memory.set(k,v)
};
const boards={};
for(const [id,b] of Object.entries(snapshot.daevanionBoards)){
 boards[id]={nodes:b.nodeList.map(n=>({
  row:n.row,col:n.col,type:n.type,name:n.name,grade:n.grade,
  open:!!n.open,effects:(n.effectList||[]).map(e=>e.desc)
 }))};
}
const data={name:'Taty',sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},characterExtras:{boards}};
const ctx={
 window:{aionDaevanion:{render(){},classify:()=>''},aionBoardsRefresh(){}},
 document,localStorage,data,URL,URLSearchParams,confirm:()=>true,
 atob:s=>Buffer.from(s,'base64').toString('binary'),
 console,Math,Date
};
vm.runInNewContext(codec,ctx,{timeout:4000});
const parse=ctx.window.AionGuideBoardCodec.parse;
const example=parse(meta.sourcePlannerUrl);
assert.equal(example.format,'Aion2Data');
assert.equal(Object.values(example.boards).reduce((sum,x)=>sum+x.length,0),297,'real share link contains all majority cells');
for(const [id,board] of Object.entries(meta.boards)){
 const bitset=new Set();
 for(let i=0;i<board.bitsHex.length/2;i++){
  const n=parseInt(board.bitsHex.slice(2*i,2*i+2),16);
  for(let bit=0;bit<8;bit++)if(n&(1<<bit))bitset.add(i*8+bit);
 }
 assert.deepEqual([...example.boards[id]],[...bitset],'accurate board decoding '+id);
}
assert.throws(()=>parse('https://aion2.gg/daevanion/cleric?b=abc'),'unknown planner URL must not silently import wrong bits');
assert.throws(()=>parse('https://aion2data.com/daevanion/assassin?b='+meta.sourcePlannerUrl.split('b=')[1]),'non-cleric import must be blocked');
assert.deepEqual([...parse('{"boards":{"Nezekan":[{"row":3,"col":3},32,32],"Ariel":[14,15]}}').boards['71']],[32]);
assert.deepEqual([...parse('{"boards":{"Nezekan":[{"row":3,"col":3},32,32],"Ariel":[14,15]}}').boards['75']],[14,15]);
assert.throws(()=>parse('{"boards":{"71":[225]}}'),'coordinates cannot be out of range');

vm.runInNewContext(importer,ctx,{timeout:4000});
const toolbar=created.find(e=>e.id==='daeva-guide-library');
const detail=created.find(e=>e.id==='daeva-guide-comparison');
assert(toolbar&&detail,'guide library and custom comparison are mounted');
assert(get('aion-board-content').beforeNode===toolbar);
assert(get('aion-board-content').afterNode===detail,'custom guide comparison remains below boards');
assert(toolbar.innerHTML.includes('Guide-Board hinzufügen / importieren'));
assert(toolbar.innerHTML.includes('Guide-Bild als Vorlage'));
get('dg-guide-name').value='Mein Klerikerguide';
get('dg-guide-link').value=meta.sourcePlannerUrl;
toolbar.listeners.click[0]({target:{id:'dg-import-button'}});
const savedKey='aion2-daevanion-guides-v1:'+snapshot.serverId+':'+snapshot.characterId;
let saved=JSON.parse(memory.get(savedKey));
assert.equal(saved.guides.length,1);
assert.equal(saved.guides[0].title,'Mein Klerikerguide');
assert.equal(Object.values(saved.guides[0].boards).reduce((sum,v)=>sum+v.length,0),297);
assert(detail.innerHTML.includes('Mein Klerikerguide'));
assert.equal(get('daeva-eu-fold').style.display,'none','EU comparison is hidden while personal guide is selected');
let marked=0;
for(const [id,b] of Object.entries(boards)){
 for(const node of b.nodes){
  if(node.type!=='None'&&node.type!=='Start'&&ctx.window.aionDaevanion.classify(id,node))marked++;
 }
}
assert(marked>100,'actual node positions are compared to imported template');
get('dg-manual-board').value='71';
toolbar.listeners.click[0]({target:{id:'dg-manual-start'}});
assert(toolbar.innerHTML.includes('Bearbeiten aktiv'));
const index=boards['71'].nodes.findIndex(n=>n.type==='SkillLevel'&&!example.boards['71'].includes((n.row-1)*15+n.col-1));
assert(index>=0);
let prevented=false;
const tap={target:{closest:selector=>selector==='[data-node]'?{dataset:{node:String(index)}}:null},
 preventDefault(){prevented=true},stopPropagation(){},stopImmediatePropagation(){}};
get('aion-board-content').listeners.click[0](tap);
assert(prevented,'click during manual editing is not forwarded to the character board');
saved=JSON.parse(memory.get(savedKey));
const cell=(boards['71'].nodes[index].row-1)*15+(boards['71'].nodes[index].col-1);
assert(saved.guides[0].boards['71'].includes(cell),'manual tap alters the guide only');
assert.equal(boards['71'].nodes[index].open,false,'game profile is not changed');

data.sourceRef={sid:'1305',id:'other-eu-character'};
ctx.window.aionDaevanion.render();
assert(!toolbar.innerHTML.includes('Mein Klerikerguide'),'private guide list must not leak across characters');
console.log('Daevanion guides PASS: real Aion2Data 6-board link, per-board manual input, local ownership, image reference UI');
