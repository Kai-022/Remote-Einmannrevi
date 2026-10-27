import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const advisor=await readFile(new URL('daevanion-advisor.js',root),'utf8');
const renderer=await readFile(new URL('nc-visuals.js',root),'utf8');
const html=await readFile(new URL('armory.html',root),'utf8');
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
assert(html.includes('daevanion-advisor.js?v='),'editor includes Daevanion advisor');
assert(html.includes('nc-visuals.js?v='));
assert(renderer.includes('window.aionDaevanion?.classify?.'),'node audit is wired into original renderer');
assert(renderer.includes('window.aionBoardSelect'),'board deep-link must work');
new vm.Script(advisor);
new vm.Script(renderer);
const boards={};
for(const [id,b] of Object.entries(snapshot.daevanionBoards||{})){
 boards[id]={nodes:(b.nodeList||[]).map(n=>({
  row:n.row,col:n.col,name:n.name,type:n.type,grade:n.grade,
  open:!!n.open,effects:(n.effectList||[]).map(x=>x.desc)
 }))};
}
assert.equal(Object.keys(boards).length,5);
class Element{
 constructor(){this.id='';this.innerHTML='';this.className='';this.listeners={};this.dataset={};this.style={};}
 before(){} append(){} querySelectorAll(){return []}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
}
const nodes=new Map();
const created=[];
const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
const document={
 head:new Element(),createElement:()=>{const x=new Element();created.push(x);return x},
 getElementById:get
};
const storage=new Map(),localStorage={
 getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)
};
const data={name:'Taty',mode:'hybrid',sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},
 characterExtras:{boards}};
let refreshed=0,lastSelected=null;
const window={
 aionBoardsRefresh:()=>{refreshed++},
 aionBoardSelect:(id,i)=>{lastSelected=[id,i]}
};
const ctx={document,window,data,localStorage};
vm.runInNewContext(advisor,ctx,{timeout:5000});
const rootElement=created.find(el=>el.id==='daeva-audit');
assert(rootElement,'advisor element must mount');
assert(rootElement.innerHTML.includes('Ariel-PvE-Tafel'),'warn about Ariel data not yet imported');
assert(rootElement.innerHTML.includes('Deine nächsten empfohlenen Skillpunkte'));
assert(rootElement.innerHTML.includes('geschätzter')||rootElement.innerHTML.includes('Geschätzter')||rootElement.innerHTML.includes('Kristalle'));
assert(rootElement.innerHTML.includes('Hybrid'));
const statuses=[];
for(const [id,b] of Object.entries(boards))for(const n of b.nodes)statuses.push(window.aionDaevanion.classify(id,n));
assert(statuses.includes('good'),'recommended taken nodes colored green');
assert(statuses.includes('missing'),'important unlearned nodes colored yellow');
assert(statuses.includes('caution'),'low-priority nodes colored cautiously');
assert(refreshed>=1);
const original=rootElement.innerHTML;
rootElement.listeners.click[0]({target:{closest:s=>s==='[data-daevamode]'?{dataset:{daevamode:'heal'}}:null}});
assert.equal(storage.get('aion2-daevanion-role-v1:'+snapshot.serverId+':'+snapshot.characterId),'heal');
assert(rootElement.innerHTML.includes('Gruppen')===false||rootElement.innerHTML.includes('Heilung'));
assert(rootElement.innerHTML!==original,'different build must alter recommendations');
rootElement.listeners.click[0]({target:{closest:s=>s==='[data-daevaboard]'?{dataset:{daevaboard:'71',daevaindex:'12'}}:null}});
assert.deepEqual(lastSelected,['71',12]);
data.characterExtras.boards={};
window.aionDaevanion.render();
assert(rootElement.innerHTML.includes('Bitte zuerst die offiziellen Daevanion-Tafeln importieren'));
console.log('Daevanion advisor PASS: snapshot comparison, tri-color audit, roles, missing Ariel, navigation');
