import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const code=await readFile(new URL('../pantheon-inference.js',import.meta.url),'utf8');
const html=await readFile(new URL('../armory.html',import.meta.url),'utf8');
assert(html.includes('pantheon-inference.js?v='));
const registered=new Map(),arr=[];
class Fake{
 constructor(){this.listeners={};this.id='';this.textContent='';this.innerHTML='';this.value='';this.disabled=false;arr.push(this)}
 addEventListener(type,cb){(this.listeners[type]??=[]).push(cb)}
 append(){} before(){}
 querySelector(){return new Fake()}
}
const document={head:new Fake(),createElement:()=>new Fake(),getElementById:id=>{
 if(id==='tab-pantheon')return tab;
 if(!registered.has(id))registered.set(id,new Fake());
 return registered.get(id);
}};
const tab=new Fake();const storage=new Map();
const stats=['Destruction','Time','Justice','Death','Freedom','Space','Wisdom','Illusion','Destiny','Life'].map((k,i)=>({name:k+' [D]',value:25+i*5}));
const ctx={document,data:{name:'Test',sourceRef:{sid:'1305',id:'test'},characterExtras:{stats}},
 localStorage:{getItem:key=>storage.get(key)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 render:()=>{},fetch:async()=>({ok:true,json:async()=>({items:[
 {id:'a',name:'Statue A',kind:'statue',stats:{Death:12,Freedom:12},where:'Test'},
 {id:'b',name:'Painting A',kind:'artwork',stats:{Wisdom:5,Illusion:5},where:'Test'},
 {id:'c',name:'Colossus A',kind:'colossus',stats:{Destruction:10,Justice:10,Time:10},where:'Test'}
 ]})}),console};
vm.runInNewContext(code,ctx,{timeout:2000});
assert.equal(registered.get('pi-calc').disabled,false);
await registered.get('pi-calc').listeners.click[0]();
assert(registered.get('pi-results').innerHTML.includes('Rechnerische Möglichkeit'));
assert(registered.get('pi-note').textContent.includes('unbekannt'));
registered.get('pi-inputs').listeners.change[0]({target:{closest:()=>({dataset:{piStat:'Time'},value:'5'})}});
assert.equal(JSON.parse(storage.get('aion2-pantheon-estimator-v1:1305:test')).extra.Time,'5');
registered.get('pi-reset').listeners.click[0]();
assert.equal(storage.size,0);
ctx.data={name:'Empty',characterExtras:{stats:[]}};
ctx.render();
assert(registered.get('pi-status').textContent.includes('0 von 10')||registered.get('pi-calc').disabled===true);
console.log('Pantheon estimator smoke tests passed');
