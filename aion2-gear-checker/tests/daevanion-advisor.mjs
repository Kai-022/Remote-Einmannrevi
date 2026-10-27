import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const advisor=await readFile(new URL('daevanion-advisor.js',root),'utf8');
const refs=JSON.parse(await readFile(new URL('cleric-board-references.json',root),'utf8'));
const html=await readFile(new URL('armory.html',root),'utf8');
const renderer=await readFile(new URL('nc-visuals.js',root),'utf8');
const snapshot=JSON.parse(await readFile(new URL('nc-character-snapshot.json',root),'utf8'));
assert(html.includes('daevanion-advisor.js?v=2'));
assert(html.includes('nc-visuals.js?v='));
assert(renderer.includes('window.aionDaevanion?.classify?.'));
assert(renderer.includes('window.aionBoardSelect'));
assert.equal(refs.sources.length,3);
assert.equal(new Set(refs.sources.map(s=>s.creator)).size,2,'two distinct public player authors');
assert.equal(refs.top100.sampleSize,100);
new vm.Script(advisor);
const boards={};
for(const [id,b] of Object.entries(snapshot.daevanionBoards||{})){
 boards[id]={nodes:(b.nodeList||[]).map(n=>({
  row:n.row,col:n.col,name:n.name,type:n.type,grade:n.grade,
  open:!!n.open,effects:(n.effectList||[]).map(x=>x.desc)
 }))};
}
class Fake {
 constructor(){this.id='';this.innerHTML='';this.listeners={};this.dataset={};this.style={};}
 before(){}append(){}scrollIntoView(){}querySelectorAll(){return []}
 addEventListener(type,callback){(this.listeners[type]??=[]).push(callback)}
}
const created=[],getters=new Map();
const get=id=>{if(!getters.has(id))getters.set(id,new Fake());return getters.get(id)};
const document={
 getElementById:get,head:new Fake(),
 createElement:()=>{const el=new Fake();created.push(el);return el}
};
const values=new Map();
const localStorage={getItem:key=>values.get(key)||null,setItem:(k,v)=>values.set(k,v)};
const data={name:'Taty',sourceRef:{sid:snapshot.serverId,id:snapshot.characterId},characterExtras:{boards}};
let refreshed=0,opened=null;
const win={
 aionBoardsRefresh:()=>{refreshed++},
 aionBoardSelect:(id,i)=>{opened=[id,i]}
};
const ctx={document,window:win,data,localStorage,fetch:async()=>({ok:true,json:async()=>refs})};
vm.runInNewContext(advisor,ctx,{timeout:3000});
await new Promise(resolve=>setImmediate(resolve));
const host=created.find(el=>el.id==='daeva-audit');
assert(host);
assert(host.innerHTML.includes('MrRosaPony'));
assert(host.innerHTML.includes('whelps'));
assert(host.innerHTML.includes('392'),'compare with actual invested budget');
assert(host.innerHTML.includes('Ariel'),'notify that newest board is not available');
assert(host.innerHTML.includes('Top-100-Kleriker'));
assert(host.innerHTML.includes('41/45'),'show actual matched reference target counts');

const healingNodes=Object.entries(boards).flatMap(([id,b])=>
 b.nodes.map((n,i)=>({id,n,i})).filter(x=>/Healing Light/i.test(x.n.name)));
assert(healingNodes.length>=4);
assert(healingNodes.every(x=>!['good','missing'].includes(win.aionDaevanion.classify(x.id,x.n))),
 'early DPS plan must not mark Healing Light as a target');
const allStatuses=Object.entries(boards).flatMap(([id,b])=>b.nodes.map(n=>win.aionDaevanion.classify(id,n)));
assert(allStatuses.includes('good')&&allStatuses.includes('missing'));

host.listeners.click[0]({target:{closest:s=>s==='[data-ref-id]'?
 {dataset:{refId:'whelps'}}:null}});
assert(refreshed>=1);
assert(healingNodes.some(x=>['good','missing'].includes(win.aionDaevanion.classify(x.id,x.n))),
 'whelps build specifically buys Healing Light');
assert.equal(values.get('aion2-daevanion-reference-v1:'+snapshot.serverId+':'+snapshot.characterId),'whelps');
host.listeners.click[0]({target:{closest:s=>s==='[data-ref-board]'?
 {dataset:{refBoard:'71',refIndex:'4'}}:null}});
assert.deepEqual(opened,['71',4]);
data.characterExtras.boards={};
win.aionDaevanion.render();
assert(host.innerHTML.includes('Bitte zuerst Daevanion-Boards importieren'));
console.log('Daevanion public peer comparison PASS: three sourced boards, distinct DPS/heal marks, own costs and deep linking');
