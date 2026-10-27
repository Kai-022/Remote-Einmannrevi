import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const js=await readFile(new URL('../pantheon-priority.js',import.meta.url),'utf8');
const html=await readFile(new URL('../armory.html',import.meta.url),'utf8');
const pantheonHtml=await readFile(new URL('../pantheon.js',import.meta.url),'utf8');
assert(html.includes('pantheon-priority.js?v='),'armory loads priority guide');
for(const id of ['pan-priority-guide','pan-priority-list','pan-priority-all','pan-priority-next'])
 assert(pantheonHtml.includes('id="'+id+'"'),'Pantheon has '+id);
new vm.Script(js);

class Fake {
 constructor(id=''){this.id=id;this.innerHTML='';this.listeners={};this.dataset={};this.attributes={};this.value='';}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 querySelectorAll(){return []}
 setAttribute(k,v){this.attributes[k]=v}
 scrollIntoView(){}
 dispatchEvent(){}
}
const elements=new Map();
function get(id){if(!elements.has(id))elements.set(id,new Fake(id));return elements.get(id)}
const roleButtons=['hybrid','heal','dps'].map(value=>Object.assign(new Fake(),{dataset:{panRole:value}}));
const root=get('pan-priority-guide');
root.querySelectorAll=()=>roleButtons;
const document={
 getElementById:get,
 querySelector:()=>new Fake()
};
const records=new Map();
const storage={
 getItem:key=>records.get(key)||null,
 setItem:(key,value)=>records.set(key,value)
};
const fixture={items:[
 {id:'big',kind:'colossus',name:'Zikel',nameDe:'Zikels Schemen',faction:'alle',
  where:'Albtraum-Shop',stats:{Time:45,Destruction:45,Justice:45}},
 {id:'art',kind:'artwork',name:'Painting',faction:'alle',where:'Dungeon',
  stats:{Wisdom:5,Illusion:5,Destiny:5}},
 {id:'statue',kind:'statue',name:'Statue',faction:'alle',where:'Dungeon',
  stats:{Death:12,Freedom:12}}
]};
const data={name:'Taty',mode:'hybrid',sourceRef:{sid:'1305',id:'character-x'},
 characterExtras:{stats:[{name:'Time [Siel]',value:51},{name:'Wisdom [Lumiel]',value:22}]}};
const win={addEventListener:()=>{}};
const context={document,window:win,data,localStorage:storage,
 fetch:async()=>({ok:true,json:async()=>fixture}),console,
 Event:class Event{constructor(type){this.type=type}},
 queueMicrotask};
vm.runInNewContext(js,context,{timeout:2500});
await new Promise(resolve=>setImmediate(resolve));
assert(get('pan-priority-list').innerHTML.includes('Zeit (Siel)'));
assert(get('pan-priority-list').innerHTML.includes('51 Punkte'));
assert(get('pan-priority-next').innerHTML.includes('Zikels Schemen'));
assert.equal(roleButtons[0].attributes['aria-pressed'],'true');

root.listeners.click[0]({target:{closest:selector=>
 selector==='[data-pan-role]'?roleButtons[2]:null}});
assert.equal(roleButtons[2].attributes['aria-pressed'],'true');
assert(get('pan-priority-list').innerHTML.includes('1.</span>'));
assert(get('pan-priority-list').innerHTML.includes('Zerstörung (Zikel)'));
assert.equal(records.get('aion2-pantheon-role-v1:1305:character-x'),'dps');
console.log('Pantheon PvE priority UI PASS: deity points, available collectibles, persistent 3 roles');
