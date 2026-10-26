/* Optional Shugo item popup collector. Runs only when a user activates the bookmarklet on Shugo.GG. */
(()=>{
'use strict';
const panel=document.createElement('section');panel.className='panel';panel.id='shugo-details-sync';
panel.innerHTML='<h2>↻ Alle geöffneten Item-Werte aktualisieren</h2>'+
'<p>Öffne Shugo.GG, aktiviere den Sammelmodus über ein Lesezeichen und tippe dort jedes Item einmal an. Danach kopierst du alle erkannten Tooltip-Werte auf einmal hierher.</p>'+
'<div class="actions"><a class="button primary" id="shugo-collect-bookmark" draggable="true" title="In die Lesezeichenleiste ziehen">✧ Shugo-Werte sammeln</a></div>'+
'<p class="tiny muted" style="margin-top:8px">Am PC: Link oben in die Lesezeichenleiste ziehen. Auf Shugo.GG das Lesezeichen anklicken, dann alle Gegenstände öffnen und auf „Alle Werte kopieren“ tippen. Manche mobilen Browser erlauben keine JavaScript-Lesezeichen. Die Funktion ist experimentell.</p>'+
'<div class="field"><label for="shugo-collected-data">Gesammelte Tooltip-Daten</label><textarea id="shugo-collected-data" rows="4" placeholder="Hier die gesammelten Daten von Shugo.GG einfügen"></textarea></div>'+
'<button type="button" id="shugo-apply-collection">Gesammelte Werte aktualisieren</button><div class="status" id="shugo-collection-status" role="status"></div>';
const host=document.getElementById('shugo-import')||document.getElementById('dash');
host?.insertAdjacentElement('afterend',panel);
const bookmark=panel.querySelector('#shugo-collect-bookmark');
bookmark.href='javascript:('+collector.toString()+')()';
function collector(){
 if(!/^(www\.)?shugo\.gg$/.test(location.hostname)){alert('Öffne zuerst das EU-Charakterprofil auf Shugo.GG');return}
 if(document.getElementById('aion-collector-panel'))return;
 const records=new Map();
 const hud=document.createElement('div');hud.id='aion-collector-panel';
 hud.style.cssText='position:fixed;bottom:14px;right:10px;z-index:2147483647;background:#121b2c;color:#eee;padding:13px;border:2px solid #e9c27d;border-radius:11px;max-width:310px;font:13px Arial';
 hud.innerHTML='<strong>✧ AION Gear-Sammler</strong><div id="aion-collect-count" style="margin:8px 0">0 Item-Fenster erkannt</div><button id="aion-collect-copy" style="padding:9px">Alle Werte kopieren</button> <button id="aion-collect-close" style="padding:9px">Beenden</button>';
 document.body.appendChild(hud);
 const update=()=>{hud.querySelector('#aion-collect-count').textContent=records.size+' Item-Fenster erkannt'};
 function inspect(){
  for(const node of document.querySelectorAll('[role="dialog"],[aria-modal="true"],[data-state="open"],dialog,[class*="modal"],[class*="Modal"],[class*="popover"],[class*="Popover"],[class*="tooltip"],[class*="Tooltip"]')){
   if(node===hud||hud.contains(node)||node.closest('#aion-collector-panel'))continue;
   const t=(node.innerText||'').trim();
   if(t.length<110||t.length>15000||!/(ZUSÄTZLICHE WERTE|ADDITIONAL STATS|Seelenbindungsrate|Soulbinding rate)/i.test(t))continue;
   const lines=t.split('\n').map(x=>x.trim()).filter(Boolean);
   const name=lines.find(x=>/^\+\s*\d{1,2}\s+\S.{5,100}$/.test(x))||lines.find(x=>/Streitkolben|Helm|Schützer|Breastplate|Mace|Guard/i.test(x));
   if(!name)continue;
   const key=name.toLocaleLowerCase().replace(/\s+/g,' ');
   if(!records.has(key)||records.get(key).length<t.length){records.set(key,t);update();}
  }
 }
 const observer=new MutationObserver(()=>{if(!hud.isConnected)return;inspect()});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 hud.querySelector('#aion-collect-copy').onclick=async()=>{
  inspect();
  if(!records.size){alert('Keine Item-Werte erkannt. Öffne bitte ein Gear-Item auf Shugo.GG.');return;}
  const payload=JSON.stringify({version:1,source:'Shugo.GG',items:[...records.values()]});
  try{await navigator.clipboard.writeText(payload);alert(records.size+' Items kopiert. Im Gear Checker in das Feld „Gesammelte Tooltip-Daten“ einfügen.');}
  catch{prompt('Daten kopieren:',payload);}
 };
 hud.querySelector('#aion-collect-close').onclick=()=>{observer.disconnect();hud.remove()};
 inspect();
}
const status=panel.querySelector('#shugo-collection-status');
panel.querySelector('#shugo-apply-collection').addEventListener('click',()=>{
 let payload;
 try{payload=JSON.parse(panel.querySelector('#shugo-collected-data').value)}catch{status.textContent='Bitte die vom Sammler kopierten JSON-Daten einfügen.';return}
 if(payload?.version!==1||payload.source!=='Shugo.GG'||!Array.isArray(payload.items)||payload.items.length>100){status.textContent='Ungültige Sammlerdaten.';return}
 if(!window.aionProfileExtras?.parseTooltip){status.textContent='Der Tooltip-Parser ist nicht verfügbar.';return}
 const slots=Object.entries(data?.gear||{});
 let updated=0,unmatched=0;
 for(const text of payload.items){
  if(typeof text!=='string'||text.length>15000)continue;
  const lines=text.split(/\r?\n/).map(s=>s.trim());
  const named=lines.find(s=>/^\+\s*\d{1,2}\s+\S.{5,140}$/.test(s));
  if(!named){unmatched++;continue}
  const norm=s=>String(s).replace(/^\+\s*\d{1,2}\s*/,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,'').trim();
  const key=norm(named);
  const candidates=slots.filter(([,item])=>norm(item.name)===key);
  if(candidates.length!==1){unmatched++;continue}
  const [slot,item]=candidates[0],parsed=window.aionProfileExtras.parseTooltip(text);
  if(!parsed.rolls.length&&!parsed.basics.length&&!parsed.manaStones.length&&!parsed.godStone){unmatched++;continue}
  item.details={...item.details,basics:parsed.basics,manaStones:parsed.manaStones,godStone:parsed.godStone,soulRate:parsed.soulRate};
  if(parsed.rolls.length)item.rolls=parsed.rolls;
  updated++;
 }
 if(updated){store();render()}
 status.textContent=updated+' Item(s) aktualisiert. '+(unmatched?unmatched+' ohne eindeutige Zuordnung oder verwertbare Werte.':'')+' Bereits eingetragene Daten anderer Items bleiben erhalten.';
});
})();