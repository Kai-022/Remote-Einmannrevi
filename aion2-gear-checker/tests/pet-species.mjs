import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const src=await readFile(new URL('../pet-species.js',import.meta.url),'utf8');
const html=await readFile(new URL('../armory.html',import.meta.url),'utf8');
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
assert(list.innerHTML.includes('Empfohlen:'));
assert(!html.includes('src="./pet-live-capture.js'), 'broken live capture must be disabled');
assert(!html.includes('pet-scanner-start.js?v='),'old scanner shortcut should no longer be shown');
assert(!html.includes('pantheon-screenshot.js?v='),'screenshot importer should be disabled');
assert(html.includes('missing-list.js?v='),'missing checklist must load');
assert(list.innerHTML.includes('Zahlenwert (optional)'));
const input=(species,slot,value,kind='select')=>list.listeners.change[0]({
 target:{closest:()=>({dataset:{species,slot:String(slot)},value,
   matches:query=>kind==='select'?query==='select':kind==='manual'?query==='[data-manual-roll]':query==='[data-roll-number]'
 }) }
});
input('Cogni',4,'PvE-Schadensverstärkung');
assert((list.innerHTML.match(/class="ps-cell good"/g)||[]).length===1);
input('Fera',4,'Waffenschadensverstärkung');
assert((list.innerHTML.match(/class="ps-cell alt"/g)||[]).length===1);
input('Natura',4,'__other__');
input('Natura',4,'Schadensresistenz (Rückseitig)','manual');
input('Natura',4,'0,6 %','number');
assert((list.innerHTML.match(/class="ps-cell bad"/g)||[]).length===1);
assert.equal((list.innerHTML.match(/class="ps-cell unknown"/g)||[]).length,42);
const saved=JSON.parse(storage.get('aion2-pets-v2:1305:123'));
assert.equal(saved.rolls['Cogni|4'],'PvE-Schadensverstärkung');
assert.equal(saved.rolls['Fera|4'],'Waffenschadensverstärkung');
assert.equal(saved.rolls['Natura|4'],'Schadensresistenz (Rückseitig)');
assert.equal(saved.details['Natura|4'].value,'0,6 %');
ctx.data={name:'Anderer',sourceRef:{sid:'1305',id:'456'},gear:{}};
ctx.render();
assert.equal((list.innerHTML.match(/class="ps-cell unknown"/g)||[]).length,45,'separate per-character storage');
console.log('Manual Pet species: 45 slots, own talent names, numeric values, green/yellow/red/unknown and separate character storage PASS');
