import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const src=await readFile(new URL('../pet-species.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert(html.includes('pet-species.js?v='));
assert(html.includes('pet-species.css?v='));
class Fake{
 constructor(){this.innerHTML='';this.listeners={};this.dataset={};}
 addEventListener(type,cb){(this.listeners[type]??=[]).push(cb)}
}
const list=new Fake(), storage=new Map();
const data={name:'EU Charakter',sourceRef:{sid:'1305',id:'123'},gear:{}};
const ctx={data,isDemo:false,render:()=>{},document:{
 getElementById:id=>id==='pet-list'?list:null,
},localStorage:{
 getItem:key=>storage.get(key)||null,
 setItem:(k,v)=>storage.set(k,v)
}};
vm.runInNewContext(src,ctx,{timeout:2500});
assert.equal((list.innerHTML.match(/class="ps-group"/g)||[]).length,5);
assert.equal((list.innerHTML.match(/class="ps-cell unknown"/g)||[]).length,45);
assert(list.innerHTML.includes('BiS:'));
const input=(species,slot,value)=>list.listeners.change[0]({
 target:{closest:()=>({dataset:{species,slot:String(slot)},value})}
});
input('Cogni',4,'PvE-Schadensverstärkung');
assert((list.innerHTML.match(/class="ps-cell good"/g)||[]).length===1);
input('Fera',4,'Waffenschadensverstärkung');
assert((list.innerHTML.match(/class="ps-cell alt"/g)||[]).length===1);
input('Natura',4,'__other__');
assert((list.innerHTML.match(/class="ps-cell bad"/g)||[]).length===1);
assert.equal((list.innerHTML.match(/class="ps-cell unknown"/g)||[]).length,42);
const saved=JSON.parse(storage.get('aion2-pets-v2:1305:123'));
assert.equal(saved.rolls['Cogni|4'],'PvE-Schadensverstärkung');
assert.equal(saved.rolls['Fera|4'],'Waffenschadensverstärkung');
ctx.data={name:'Anderer',sourceRef:{sid:'1305',id:'456'},gear:{}};
ctx.render();
assert.equal((list.innerHTML.match(/class="ps-cell unknown"/g)||[]).length,45,'separate per-character storage');
console.log('Pet species: 5 collapsible groups; 45 slots; green/yellow/red/unknown; character separation PASS');
