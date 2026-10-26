import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const code=await readFile(new URL('../pet-screenshot.js',import.meta.url),'utf8');
const live=await readFile(new URL('../pet-live-capture.js',import.meta.url),'utf8');
const start=await readFile(new URL('../pet-scanner-start.js',import.meta.url),'utf8');
for(const [label,src] of [['pet-screenshot',code],['pet-live-capture',live],['pet-scanner-start',start]])
  assert.doesNotThrow(()=>new vm.Script(src),label+' script must parse');
class Element {
 constructor(id=''){this.id=id;this.innerHTML='';this.listeners={};this.style={};this.classList={add(){},remove(){},toggle(){}};}
 addEventListener(type,listener){(this.listeners[type]??=[]).push(listener)}
 before() {}
 querySelector(){return null}
 getContext(){return null}
}
const cache=new Map(), el=new Map();
const get=id=>{if(!el.has(id))el.set(id,new Element(id));return el.get(id)};
const events=[];
const win={addEventListener(){},dispatchEvent(event){events.push(event.type)}};
const storage={
 getItem:key=>cache.get(key)||null,
 setItem:(key,value)=>cache.set(key,value)
};
const ctx={
 document:{getElementById:get,createElement:()=>new Element()},
 window:win,
 localStorage:storage,
 data:{name:'Test Character',gear:{},sourceRef:{sid:'1301',id:'test-id'}},
 isDemo:false,
 Event:class Event {constructor(type){this.type=type}},
};
vm.runInNewContext(code,ctx,{timeout:3000});
const api=win.aionPetOCR;
assert(api,'shared OCR API should be initialized');
assert.equal(api.speciesFromText('Cogni (Lv 10)'), 'Cogni');
assert.equal(api.speciesFromText('Cogni Natura'),null,'ambiguous genus must not be inferred');
assert.equal(api.unlockedSlotsFromText('Cogni Insight Lv 3'),3);
assert.equal(api.unlockedSlotsFromText('Spezieskenntnis Stufe 10'),9);
assert.equal(api.unlockedSlotsFromText('other screen'),null);
const partial=[
 {name:'Max. Angriffskraft',confidence:95},
 {name:'LP %',confidence:95},
 {name:'Kritischer Treffer',confidence:95}
];
assert.equal(api.storeCompleteSpecies('Cogni',partial),false,'without explicit slot count do not mislabel partial read');
assert.equal(api.storeCompleteSpecies('Cogni',partial,3),true);
let saved=JSON.parse(cache.get(api.getPetKey()));
assert.equal(saved.rolls['Cogni|1'],'Max. Angriffskraft');
assert.equal(saved.rolls['Cogni|2'],'LP %');
assert.equal(saved.rolls['Cogni|3'],'Kritischer Treffer');
assert.equal(saved.rolls['Cogni|4'],undefined);
assert.equal(saved.scanned.Cogni.slots,3);
assert.equal(saved.scanned.Cogni.rolls.length,3);
assert(events.includes('aion2:pets-updated'));
assert.equal(api.storeCompleteSpecies('Cogni',partial.slice(0,2),3),false);
assert.equal(api.storeCompleteSpecies('Natura',partial,3),true);
saved=JSON.parse(cache.get(api.getPetKey()));
assert.equal(saved.scanned.Natura.slots,3);
assert.equal(saved.rolls['Cogni|1'],'Max. Angriffskraft','other genus must be unchanged');
console.log('Pet walkthrough: syntax, unique genus, unlocked slots, safe partial save, character key PASS');
