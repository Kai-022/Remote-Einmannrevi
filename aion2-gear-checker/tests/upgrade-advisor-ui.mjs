// Minimal no-dependency DOM smoke test for the static AION 2 Upgrade Advisor UI.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const base=new URL('../',import.meta.url);
const core=await readFile(new URL('upgrade-advisor-core.js',base),'utf8');
const ui=await readFile(new URL('upgrade-advisor.js',base),'utf8');
const html=await readFile(new URL('armory.html',base),'utf8');
assert(html.includes('<script src="./upgrade-advisor-core.js?v='));
assert(html.includes('<script src="./upgrade-advisor.js?v='));
const nodes=[];
class Fake{
 constructor(){
  this.listeners={};this.dataset={};this.id='';this.value='';this.innerHTML='';this.textContent='';
  this.style={};this.className='';this.attributes={};
  this.classList={add:()=>{},remove:()=>{},toggle:()=>{},contains:()=>false};
  nodes.push(this);
 }
 addEventListener(type,cb){(this.listeners[type]??=[]).push(cb)}
 append(){} after(){} before(){} scrollIntoView(){} setAttribute(k,v){this.attributes[k]=v}
 querySelector(){return new Fake()}
 querySelectorAll(){return []}
 get firstElementChild(){return new Fake()}
}
const byId=new Map();
const nav=new Fake();
const dash=new Fake();
dash.querySelector=selector=>selector==='.tabs'?nav:new Fake();
const document={
 head:new Fake(),
 createElement:()=>new Fake(),
 getElementById:id=>{
  if(id==='dash')return dash;
  if(!byId.has(id))byId.set(id,new Fake());
  return byId.get(id);
 },
 querySelector:()=>new Fake()
};
const storage=new Map();
const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,v)=>storage.set(key,v)};
const catalog={items:[
 {id:'painting-1',kind:'artwork',name:'Gartua',where:'Weltboss Gartua',stats:{Wisdom:5}},
 {id:'statue-1',kind:'statue',name:'Bakarma',where:'Draupnir',stats:{Death:12}}
]};
const sandbox={
 window:{},document,localStorage,console,
 data:{name:'Taty',mode:'dps',sourceRef:{sid:'1305',id:'test-123'},importedAt:'2026-10-26T12:00:00Z',
  gear:{Waffe:{name:"Ludra's Fatal Mace",plus:5,rolls:['MP +92','Block +59'],
   importDetail:{grade:'Unique'}}},
  characterExtras:{profile:{className:'Cleric',level:45},daevanion:[]}},
 render:()=>{},navigator:{clipboard:{writeText:async()=>{}}},
 fetch:async()=>({ok:true,json:async()=>catalog}),confirm:()=>true
};
vm.runInNewContext(core,sandbox,{timeout:2000});
vm.runInNewContext(ui,sandbox,{timeout:2000});
await new Promise(resolve=>setImmediate(resolve));
const tab=nodes.find(x=>x.id==='aion-advisor-button');
const page=nodes.find(x=>x.id==='tab-advisor');
assert(tab&&page,'advisor tab and page must be mounted');
assert(byId.get('adv-stats').innerHTML.includes('Gear-Slots'),'dashboard summary must render');
assert(byId.get('adv-list').innerHTML.includes('Reroll'),'advisor must show actual gear action');
tab.listeners.click?.[0]();
assert(byId.get('adv-identity').textContent.includes('Taty'),'character identity must render');
assert(byId.get('adv-next').innerHTML.includes('NÄCHSTER'),'next action must render');
const list=byId.get('adv-list');
const before=JSON.parse(storage.get('aion2-advisor-v1:1305:test-123')||'{}');
assert(!before.done||before.done.length===0);
const task=sandbox.window.AionAdvisorCore.analyze(sandbox.data,{role:'dps'}).actions[0];
list.listeners.click?.[0]({target:{closest:q=>q==='[data-adv-done]'?{dataset:{advDone:task.id}}:null}});
assert(JSON.parse(storage.get('aion2-advisor-v1:1305:test-123')).done.includes(task.id),'done must persist per character');
byId.get('adv-hide-done').listeners.change?.[0]({target:{value:'all'}});
byId.get('adv-reset-price').listeners.change?.[0]({target:{value:'25000'}});
assert(byId.get('adv-list').innerHTML.includes('375.000'),'one reroll total must update when reset material price supplied');
list.listeners.change?.[0]({target:{closest:q=>q==='[data-adv-price]'?{dataset:{advPrice:'Waffe'},value:'340000'}:null}});
assert.equal(JSON.parse(storage.get('aion2-advisor-v1:1305:test-123')).replacementPrices.Waffe,340000);
byId.get('adv-role').listeners.change?.[0]({target:{value:'heal'}});
assert(byId.get('adv-identity').textContent.includes('Gruppenheilung'));
console.log('Upgrade Advisor UI smoke test passed: mount, next action, role, material costs, replacement prices, local progress.');
