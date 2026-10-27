import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const bridge=await readFile(new URL('pantheon-wtb-bridge.js',root),'utf8');
const wtb=await readFile(new URL('want-to-buy.js',root),'utf8');
const guide=await readFile(new URL('pantheon-priority.js',root),'utf8');
const html=await readFile(new URL('armory.html',root),'utf8');
for(const src of [bridge,wtb,guide])new vm.Script(src);
assert(html.includes('pantheon-wtb-bridge.js?v='),'bridge must be included');
assert(html.indexOf('pantheon-wtb-bridge.js?v=')<html.indexOf('want-to-buy.js?v='));
assert(html.includes(':not(#wtb-panel)'),'WTB cannot remain hidden by Armory layout');

class Fake {
 constructor(id=''){
  this.id=id;this.listeners={};this.value='all';this.innerHTML='';this.textContent='';
  this.style={display:'none'};this.dataset={};this.className='';
 }
 addEventListener(t,cb){(this.listeners[t]??=[]).push(cb)}
 insertAdjacentElement(){}
 scrollIntoView(){}
 querySelectorAll(){return []}
}
const els=new Map();
const get=id=>{if(!els.has(id))els.set(id,new Fake(id));return els.get(id)};
const doc={
 getElementById:get,
 querySelector:q=>q==='header.top'?get('header'):get('hero'),
 createElement:()=>new Fake(),
};
const storage=new Map();
const localStorage={
 getItem:key=>storage.get(key)||null,
 setItem:(key,v)=>storage.set(key,v)
};
const win={handlers:{},addEventListener(type,cb){(this.handlers[type]??=[]).push(cb)},
 dispatchEvent(event){for(const callback of this.handlers[event.type]||[])callback(event);}};
const character={name:'Taty',sourceRef:{sid:'1305',id:'char-1'}};
const ctx={window:win,document:doc,localStorage,data:character,
 Event:class Event{constructor(type){this.type=type}},
 console,confirm:()=>true,alert:()=>{}};
vm.runInNewContext(bridge,ctx,{timeout:2000});
const b=win.aionPantheonWTB;
const item={id:'statue-gerod',name:'Gerod',kind:'statue',where:'Albtraum-Shop',
 stats:{Freedom:10,Space:10}};
assert(b.add(item));
assert.equal(b.planned().length,1);
assert(!b.owned(item.id));
assert.equal(b.acquireInfo(item).mode,'shop');
assert.equal(b.acquireInfo({where:'Weltboss Wächtergott'}).mode,'farm');
vm.runInNewContext(wtb,ctx,{timeout:2500});
assert(get('wtb-items').innerHTML.includes('Gerod'));
assert(get('wtb-filter').innerHTML.includes('Pantheon / Sammelstücke'));
assert(get('wtb-items').innerHTML.includes('pantheon:statue-gerod'));
get('wtb-items').listeners.change[0]({target:{dataset:{wtbCheck:'pantheon:statue-gerod'},checked:true}});
assert(b.owned(item.id),'bought item must be marked owned');
assert.equal(b.planned().length,0,'bought item must disappear from open shopping list');
const pan=JSON.parse(storage.get('aion2-pantheon-v1:1305:char-1'));
assert(pan.owned.includes(item.id));
assert(!pan.placed,'bought item must not be auto-equipped');
assert(!get('wtb-items').innerHTML.includes('pantheon:statue-gerod'),'WTB list refresh');
assert(b.add({...item,id:'statue-kibelisk',name:'Kibelisk',where:'Quest'}));
assert.equal(b.planned().length,1);
character.sourceRef={sid:'1305',id:'char-2'};
assert.equal(b.planned().length,0,'character-specific WTB wishlist');
assert(!b.owned('statue-gerod'),'new character must not inherit ownership');
character.sourceRef={sid:'1305',id:'char-1'};
assert.equal(b.planned()[0].id,'statue-kibelisk');
b.syncOwned('statue-kibelisk');
assert.equal(b.planned().length,1,'sync does nothing before piece is owned');
const pan2=JSON.parse(storage.get('aion2-pantheon-v1:1305:char-1'));
pan2.owned.push('statue-kibelisk');
storage.set('aion2-pantheon-v1:1305:char-1',JSON.stringify(pan2));
b.syncOwned('statue-kibelisk');
assert.equal(b.planned().length,0,'manual Pantheon acquired item leaves WTB list');
console.log('Pantheon ↔ WTB integration PASS: add, buy, remove, character isolation, own vs placed');
