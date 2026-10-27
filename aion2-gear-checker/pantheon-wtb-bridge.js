/* Shared Pantheon ↔ Want-to-Buy sync. Browser-local and character-specific.
   Shopping means recorded intention; bought marks collected, not placed. */
(()=>{
'use strict';
const DB='aion2.pantheon-wtb.v1:';
const panDB='aion2-pantheon-v1:';
const character=()=>String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'EU-Charakter').normalize('NFKC');
const listKey=()=>DB+character();
const panKey=()=>panDB+character();
function read(key){
 try{
  const v=JSON.parse(localStorage.getItem(key)||'{}');
  return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 }catch{return {}}
}
function send(type){
 if(typeof window!=='undefined')window.dispatchEvent(new Event(type));
}
const valid=(item)=>item&&typeof item.id==='string'&&/^[a-z0-9-]{2,100}$/i.test(item.id)&&
 typeof item.name==='string'&&item.name.trim().length>1&&['artwork','statue','colossus'].includes(item.kind);
function planned(){const d=read(listKey());return Array.isArray(d.items)?d.items.filter(valid).slice(0,150):[]}
function stored(){return read(panKey())}
function owned(id){
 const pan=stored();
 return (Array.isArray(pan.owned)&&pan.owned.includes(id))||
 (Array.isArray(pan.placed)&&pan.placed.includes(id));
}
function acquireInfo(item){
 const where=String(item?.where||'Fundort nicht bekannt').slice(0,200);
 if(/albtraum.shop/i.test(where))return {mode:'shop',label:'Albtraum-Tauschshop',where};
 if(/shugo.festival.shop/i.test(where))return {mode:/oder|elitegegner/i.test(where)?'both':'shop',label:'Shugo-Festival-Shop',where};
 if(/abgrund.*shop/i.test(where))return {mode:/oder/i.test(where)?'both':'shop',label:'Abgrund-/Festival-Shop',where};
 if(/shop|händler|tausch/i.test(where))return {mode:/oder|elitegegner/i.test(where)?'both':'shop',label:'Tauschshop / im Spiel prüfen',where};
 if(/markt|handelsposten/i.test(where))return {mode:'market',label:'Markt (Handelbarkeit prüfen)',where};
 if(/quest|erfolg|weltboss|boss|dungeon|elite|monster|dropp|drop|expedition|konvert/i.test(where))
   return {mode:'farm',label:'Farmen / Quest',where};
 return {mode:'unknown',label:'Fundort prüfen',where};
}
function add(item){
 if(!valid(item)||owned(item.id))return false;
 const entries=planned();
 if(entries.some(x=>x.id===item.id))return true;
 const entry={id:item.id,name:item.name.trim().slice(0,100),kind:item.kind,where:String(item.where||'').slice(0,200),
   stats:item.stats&&typeof item.stats==='object'?item.stats:null,addedAt:new Date().toISOString()};
 try{localStorage.setItem(listKey(),JSON.stringify({items:[...entries,entry]}));send('aion2:wtb-updated');return true}
 catch{return false}
}
function remove(id){
 const entries=planned();if(!entries.some(x=>x.id===id))return true;
 try{localStorage.setItem(listKey(),JSON.stringify({items:entries.filter(x=>x.id!==id)}));send('aion2:wtb-updated');return true}
 catch{return false}
}
function bought(id){
 const item=planned().find(x=>x.id===id);if(!item)return false;
 const pan=stored(),current=new Set(Array.isArray(pan.owned)?pan.owned:[]);
 current.add(id);
 // Persist ownership first. If this fails, keep the shopping item.
 try{localStorage.setItem(panKey(),JSON.stringify({...pan,owned:[...current]}))}
 catch{return false}
 const removed=remove(id);
 if(!removed)return false;
 send('aion2:pantheon-updated');
 return true;
}
function syncOwned(id){
 if(owned(id))remove(id);
}
if(typeof window!=='undefined')window.aionPantheonWTB={
 character,planned,owned,acquireInfo,add,remove,bought,syncOwned
};
})();
