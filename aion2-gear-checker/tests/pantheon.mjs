// Offline Pantheon catalog and UI smoke checks – no external API or game account.
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const catalog=JSON.parse(await readFile(new URL('../pantheon-catalog.json',import.meta.url),'utf8'));
const paths=new Set(),types={artwork:0,statue:0,colossus:0};
assert.equal(catalog.version,1);
assert.equal(catalog.slots.artwork,12);
assert.equal(catalog.slots.statue,4);
assert.equal(catalog.slots.colossus,1);
assert(catalog.items.length>=80);
for(const item of catalog.items){
 assert(typeof item.id==='string'&&!paths.has(item.id),'duplicate collectible ID');
 paths.add(item.id);
 assert(item.kind in types,'unexpected item type');
 types[item.kind]++;
 assert(item.name.length>1);
 assert(item.where.length>2);
 assert(item.stats===null||Object.values(item.stats).every(v=>Number.isFinite(Number(v))&&Number(v)>=0));
 assert(/^\.\/pantheon-icons\/[a-z0-9-]+\.(webp|png)$/.test(item.icon));
 assert((await stat(new URL('../'+item.icon.slice(2),import.meta.url))).size>300);
}
assert.equal(types.statue,19);
assert(types.artwork>=60);
const code=await readFile(new URL('../pantheon.js',import.meta.url),'utf8');
execFileSync(process.execPath,['--check','-'],{input:code});
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
assert(html.includes('<script src="./pantheon.js?v='));
const fakeItems=[];
const fakeById=new Map();
class Fake{
 constructor(){
  this.listeners={};this.style={};this.className='';this.id='';this.value='';
  this.textContent='';this.innerHTML='';
  this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};
  fakeItems.push(this);
 }
 after(){} append(){} scrollIntoView(){}
 addEventListener(type,cb){(this.listeners[type]??=[]).push(cb)}
 click(){for(const cb of this.listeners.click||[])cb({target:this})}
 querySelector(){return new Fake()}
 querySelectorAll(){return [new Fake()]}
 get lastElementChild(){return new Fake()}
}
const tabs=new Fake();
const document={
 head:new Fake(),
 createElement:()=>new Fake(),
 querySelector:q=>q==='#dash .tabs'?tabs:new Fake(),
 getElementById:id=>{
  if(!fakeById.has(id))fakeById.set(id,new Fake());
  return fakeById.get(id);
 }
};
const storage=new Map();
const localStorage={
 getItem:key=>storage.get(key)??null,
 setItem:(key,value)=>storage.set(key,value)
};
const context={
 document,localStorage,console,
 data:{name:'Taty',sourceRef:{sid:'1305',id:'character-a'},
  characterExtras:{stats:[{name:'Wisdom [Lumiel]',value:17}]}},
 render:()=>{},
 confirm:()=>true,
 fetch:async()=>({ok:true,json:async()=>catalog})
};
vm.runInNewContext(code,context,{timeout:2000});
await new Promise(resolve=>setImmediate(resolve));
const page=fakeItems.find(x=>x.id==='tab-pantheon');
assert(page,'Pantheon page must be mounted');
const byId=id=>document.getElementById(id);
assert(byId('pan-count').textContent.includes(String(catalog.items.length)),'catalog should show all items');
assert(byId('pan-official-stats').innerHTML.includes('17'),'official deity stat must be shown as separate total');
const cardClick=(action,id)=>{
 const cb=page.listeners.click?.[0];assert(cb,'missing button delegate');
 cb({target:{closest:()=>({dataset:{panAction:action,id}})}});
};
const first=catalog.items.find(x=>x.kind==='statue');
const key='aion2-pantheon-v1:1305:character-a';
cardClick('own',first.id);
assert(JSON.parse(storage.get(key)).owned.includes(first.id));
cardClick('place',first.id);
assert(JSON.parse(storage.get(key)).placed.includes(first.id));
assert(byId('pan-summary').innerHTML.includes('1/4'),'one statue should be placed');
const four=catalog.items.filter(x=>x.kind==='statue').slice(1,5);
four.forEach(x=>cardClick('place',x.id));
assert.equal(JSON.parse(storage.get(key)).placed.length,4,'fifth statue must be blocked');
byId('pan-kind').listeners.change?.[0]({target:{value:'statue'}});
assert(byId('pan-count').textContent.includes('19 von'),'statue filter should show 19');
context.data={name:'Second',sourceRef:{sid:'1301',id:'character-b'}};
context.render();
assert(byId('pan-summary').innerHTML.includes('0/4'),'second character must have separate progress');
context.data={name:'Taty',sourceRef:{sid:'1305',id:'character-a'},
 characterExtras:{stats:[{name:'Wisdom [Lumiel]',value:17}]}};
context.render();
assert(byId('pan-summary').innerHTML.includes('4/4'),'original progress should reload');
console.log('Pantheon checks passed:',catalog.items.length,'items',types,'4 statue slots; per-character progress; owned and placed; imported stats.');
