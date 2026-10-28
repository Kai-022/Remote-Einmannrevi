import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const src=await readFile(new URL('daevanion-eu-comparison.js',root),'utf8');
const reference=JSON.parse(await readFile(new URL('daevanion-eu-cleric-meta.json',root),'utf8'));
const html=await readFile(new URL('armory.html',root),'utf8');
const renderer=await readFile(new URL('nc-visuals.js',root),'utf8');
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
new vm.Script(src);
assert(html.includes('daevanion-eu-comparison.js?v='));
assert(!html.includes('src="./daevanion-advisor.js?v='),'old guesser should be disabled');
assert(renderer.includes('window.aionDaevanion?.classify?.'));
assert(renderer.includes('window.aionBoardSelect='));
assert.equal(reference.region,'eu');
assert.equal(reference.className,'Cleric');
assert.equal(reference.completeBoards,96);
assert.equal(reference.profiles,99);
function positions(hex){
 const set=new Set();
 for(let i=0;i<hex.length/2;i++){
  const n=parseInt(hex.slice(2*i,2*i+2),16);
  for(let b=0;b<8;b++)if(n&(1<<b))set.add(i*8+b);
 }
 return set;
}
const sets={};
for(const [id,board] of Object.entries(reference.boards)){
 const set=positions(board.bitsHex);sets[id]=set;
 assert.equal(set.size,board.majorityCount,'bitset must carry exactly the published board count');
}
assert.deepEqual(Object.fromEntries(Object.entries(sets).map(([id,x])=>[id,x.size])),
 {'71':67,'72':63,'73':66,'74':75,'75':18,'76':8});
assert.equal(Object.values(sets).reduce((s,x)=>s+x.size,0),297);
const boards={};
for(const [id,b] of Object.entries(snapshot.daevanionBoards||{})){
 boards[id]={nodes:(b.nodeList||[]).map(n=>({
  row:Number(n.row),col:Number(n.col),type:n.type,name:n.name,grade:n.grade,
  open:!!n.open,effects:(n.effectList||[]).map(x=>x.desc)
 }))};
 const playable=new Set(boards[id].nodes.filter(n=>n.type!=='None').map(n=>(n.row-1)*15+(n.col-1)));
 for(const pos of sets[id])assert(playable.has(pos),'every majority bit must match an actual board node, board '+id+', cell '+pos);
}
class Fake {
 constructor(){this.id='';this.innerHTML='';this.listeners={};}
 before(){}after(node){this.afterNode=node}append(...children){this.appended=children}querySelectorAll(){return []}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
}
const created=[],byId=new Map();
const get=id=>{if(!byId.has(id))byId.set(id,new Fake());return byId.get(id)};
const document={getElementById:get,head:new Fake(),createElement:()=>{const el=new Fake();created.push(el);return el}};
const data={name:'Taty',sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},characterExtras:{boards}};
let refreshed=0,jumped=null;
const window={aionBoardsRefresh:()=>refreshed++,aionBoardSelect:(id,index)=>{jumped=[id,index]}};
const context={document,data,window,fetch:async()=>({ok:true,json:async()=>reference})};
vm.runInNewContext(src,context,{timeout:6000});
await new Promise(r=>setImmediate(r));
const host=created.find(x=>x.id==='daeva-eu-compare');
assert(host);
const fold=created.find(x=>x.id==='daeva-eu-fold');
assert(fold,'EU comparison must have its own collapsible section');
assert.equal(get('aion-board-content').afterNode,fold,'boards must appear above comparison accordion');
assert(fold.appended.includes(host),'comparison content must be inside collapsible section');
assert(fold.appended.some(x=>x.textContent.includes('aufklappen')),'accordion must have readable title');
assert(host.innerHTML.includes('96'));
assert(host.innerHTML.includes('297'));
assert(host.innerHTML.includes('mindestens 50 %'));
assert(host.innerHTML.includes('Keine getrennte Damage-/Heiler-Statistik'));
assert(host.innerHTML.includes('Nicht importiert:'));
assert(host.innerHTML.includes('Ariel'));
assert(host.innerHTML.includes('Mehrheitsknoten'));
assert(!host.innerHTML.includes('Damage-Skillung')&&!host.innerHTML.includes('Heilungs-Skillung'));
assert(refreshed>0);
const counts={good:0,missing:0,caution:0};
for(const [id,board] of Object.entries(boards)){
 for(const n of board.nodes){
  const classify=window.aionDaevanion.classify(id,n);
  if(counts[classify]!==undefined)counts[classify]++;
  const pos=(n.row-1)*15+(n.col-1),expected=sets[id].has(pos);
  if(n.type!=='None'&&n.type!=='Start'){
   assert.equal(classify,expected?(n.open?'good':'missing'):(n.open?'caution':''),
    'classification comes only from EU real-board majority bits, not skill names');
  }
 }
}
assert(counts.good>40&&counts.missing>5&&counts.caution>5);
host.listeners.click[0]({target:{closest:selector=>selector==='[data-eu-board]'?
 {dataset:{euBoard:'71',euIndex:'6'}}:null}});
assert.deepEqual(jumped,['71',6]);
data.characterExtras.boards={};
window.aionDaevanion.render();
assert(host.innerHTML.includes('Keine importierten Tafeln'));
console.log('EU Top Cleric Daevanion PASS: 96 real full-board profiles, 297 verified majority cells, positional comparison, missing boards and navigation');
