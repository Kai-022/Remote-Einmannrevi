/* Detail popups and read-only character sections; no invented profile values. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const panel=document.createElement('dialog');panel.id='gear-detail-dialog';panel.style.cssText='max-width:min(650px,96vw);width:96vw;max-height:88vh;overflow:auto;border:1px solid #5c6981;border-radius:14px;background:#131c2a;color:#edf1f8;padding:20px;box-shadow:0 20px 80px #000b';
document.body.append(panel);
panel.addEventListener('click',e=>{if(e.target===panel)panel.close()});
const body=()=>document.getElementById('gear-list');
const section=(heading,arr,sourceLabel)=>'<section style="margin:18px 0"><div class="eyebrow">'+esc(heading)+'</div>'+
 (arr.length?arr.map(([k,v,cls])=>'<div class="gear-roll '+esc(cls||'mid')+'" style="margin-top:7px"><span class="gear-roll-name">'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join(''):
 '<div class="tip">Nicht in den importierten Daten enthalten. '+esc(sourceLabel||'')+'</div>')+'</section>';
function parseTooltip(input){
 const lines=String(input||'').replace(/\r/g,'').split('\n').map(v=>v.trim()).filter(Boolean);
 const result={basics:[],manaStones:[],godStone:null,rolls:[],soulRate:null};
 let zone='';
 const headers=[['basic',/^(?:BASISWERTE|BASE STATS)$/i],['rolls',/^(?:ZUSÄTZLICHE WERTE(?:\s*\(\d+\s*\/\s*\d+\))?|ADDITIONAL STATS(?:\s*\(\d+\s*\/\s*\d+\))?)$/i],['mana',/^(?:MANASTEINE(?:\s*\(\d+\s*\/\s*\d+\))?|MANASTONES(?:\s*\(\d+\s*\/\s*\d+\))?)$/i],['god',/^(?:GÖTTLICHER STEIN(?:\s*\(\d+\s*\/\s*\d+\))?|GODSTONE(?:\s*\(\d+\s*\/\s*\d+\))?)$/i]];
 for(let n=0;n<lines.length;n++){
  const line=lines[n];
  const matched=headers.find(x=>x[1].test(line));
  if(matched){zone=matched[0];continue;}
  if(/^(?:QUELLE|SOURCE|HERSTELLEN|CRAFTING|Seelenbindungsrate)$/i.test(line)){zone='';continue;}
  const soul=/^(?:Seelenbindungsrate|Soulbinding rate)\s*:?\s*([\d.,]+\s*%)$/i.exec(line);
  if(soul){result.soulRate=soul[1];continue;}
  if(!zone)continue;
  if(zone==='god'){
    if(!result.godStone)result.godStone={name:line.slice(0,130),description:''};
    else result.godStone.description=(result.godStone.description+' '+line).slice(0,500);
    continue;
  }
  const m=/^(.{2,90}?)\s+([+]?\s*[\d.,]+\s*%?)$/.exec(line);
  if(m){
   if(zone==='rolls')result.rolls.push(m[1].trim()+' '+m[2].trim());
   else (zone==='basic'?result.basics:result.manaStones).push({name:m[1].trim(),value:m[2].trim()});
  }else if(zone==='mana'&&line.length<100)result.manaStones.push({name:line,value:''});
 }
 result.rolls=result.rolls.slice(0,15);
 result.basics=result.basics.slice(0,20);
 result.manaStones=result.manaStones.slice(0,8);
 return result;
}
function openGear(slot){
 const item=data?.gear?.[slot];if(!item)return;
 const detail=item.details||{};
 const basics=(detail.basics||[]).map(x=>[x.name,x.value]);
 const souls=(item.rolls||[]).map(x=>{const r=rating(slot,x);return [x,r.text,r.style]});
 const stones=(detail.manaStones||[]).map(x=>[x.name,x.value||'']);
 const god=(detail.godStone||null);
 const grade=item.importDetail?.grade||'';
 const breakthrough=item.importDetail?.breakthrough;
 panel.innerHTML='<button type="button" id="gear-detail-close" style="float:right">✕</button>'+
 '<div class="eyebrow">'+esc(slot)+'</div><h2 style="margin:9px 0">+'+esc(item.plus||0)+' '+esc(item.name||'Unbekannt')+'</h2>'+
 '<div class="tip">'+esc(grade)+(breakthrough!=null?' · ◆'+esc(breakthrough):'')+'</div>'+
 section('Basiswerte',basics,'Shugo zeigt diese meist erst beim Öffnen des Items.')+
 (detail.soulRate!=null?'<div class="tip">Seelenbindungsrate: '+esc(detail.soulRate)+'</div>':'')+
 section('Zusätzliche Werte / Seelenbindung',souls,'Das Profil liefert bisher nur die Ausrüstungsliste. Erst ein ausgelesener Item-Tooltip liefert diese Werte.')+
 section('Manasteine',stones)+
 section('Götterstein',god?[[god.name,god.description||'']]:[])+
 '<details style="margin-top:18px"><summary style="cursor:pointer;color:#e8c687">Detaillierte Werte vom Shugo-Item einfügen</summary>'+
 '<p class="tip">Auf Shugo.GG das Item anklicken, die Werte aus dem geöffneten Fenster kopieren und hier einfügen. Das ist nötig, wenn der automatische Profilabruf die Tooltip-Werte nicht liefert.</p>'+
 '<textarea id="gear-tooltip-text" rows="6" style="width:100%" placeholder="BASISWERTE&#10;Angriffskraft 398&#10;ZUSÄTZLICHE WERTE (5/10)&#10;Schadensverstärkung +6.7%"></textarea>'+
 '<button type="button" id="gear-tooltip-save" style="margin-top:7px">Detailwerte übernehmen</button></details>'+
 '<div class="actions"><button type="button" id="gear-detail-edit">Werte bearbeiten</button></div>';
 panel.querySelector('#gear-detail-close').onclick=()=>panel.close();
 panel.querySelector('#gear-tooltip-save').onclick=()=>{
  const raw=panel.querySelector('#gear-tooltip-text').value;
  if(!raw.trim())return;
  const parsed=parseTooltip(raw);
  if(!(parsed.rolls.length||parsed.basics.length||parsed.manaStones.length||parsed.godStone||parsed.soulRate)){
    alert('Keine Werte erkannt. Bitte den Text aus dem geöffneten Shugo-Item-Fenster kopieren.');
    return;
  }
  item.details={...item.details,basics:parsed.basics,manaStones:parsed.manaStones,godStone:parsed.godStone,soulRate:parsed.soulRate};
  if(parsed.rolls.length)item.rolls=parsed.rolls;
  store();render();panel.close();openGear(slot);
 };
 panel.querySelector('#gear-detail-edit').onclick=()=>{panel.close();const target=document.getElementById('slot');if(target){target.value=slot;fillEdit();document.getElementById('editform')?.scrollIntoView({behavior:'smooth'});}};
 if(typeof panel.showModal==='function')panel.showModal();else panel.setAttribute('open','');
}
body()?.addEventListener('click',e=>{
 const card=e.target.closest('.gear-modern');if(!card || e.target.closest('.edititem'))return;
 const slot=card.querySelector('.eyebrow')?.textContent?.trim();
 if(slot)openGear(slot);
});
const skillPanel=document.createElement('section');skillPanel.id='character-skills';skillPanel.className='panel';
skillPanel.innerHTML='<h2>✦ Fähigkeiten, Stigmen und Daevanion</h2>'+
'<p>Öffentliche Charakterdaten, falls sie beim Import tatsächlich mitgeliefert werden.</p>'+
'<div id="character-skills-display"></div>';
document.getElementById('tab-upgrades')?.append(skillPanel);
function displaySkills(){
 const meta=data?.characterExtras||{};
 const groups=[['Fähigkeiten',meta.skills],['Stigmen',meta.stigmas],['Daevanion',meta.daevanion]];
 const rows=groups.map(([name,items])=>'<div class="card" style="margin:12px 0"><strong>'+esc(name)+'</strong>'+
 (Array.isArray(items)&&items.length?items.map(i=>'<div class="gear-roll" style="margin-top:7px"><span class="gear-roll-name">'+esc(i.name)+'</span><span>'+esc(i.level||'')+'</span></div>').join(''):'<div class="tip">Noch keine verlässlichen '+esc(name)+'-Daten importiert.</div>')+'</div>').join('');
 const root=document.getElementById('character-skills-display');if(root)root.innerHTML=rows;
}
const originalRender=render;
render=function(){originalRender();displaySkills()};
displaySkills();
window.aionProfileExtras={
 parse(text){
  const lines=String(text||'').split(/\r?\n/).map(x=>x.trim());
  const labels={skills:/^(?:#{1,4}\s*)?(?:Skills|Fähigkeiten|Fertigkeiten)$/i,stigmas:/^(?:#{1,4}\s*)?(?:Stigmas|Stigmen)$/i,daevanion:/^(?:#{1,4}\s*)?(?:Daevanion)$/i};
  const sections={skills:[],stigmas:[],daevanion:[]};let mode=null;
  for(const line of lines){
   const recognized=Object.entries(labels).find(([,re])=>re.test(line));
   if(recognized){mode=recognized[0];continue;}
   if(/^#{1,3}\s+[^\s]/.test(line)&&!recognized){mode=null;continue;}
   if(!mode||!line||/^\|?\s*[-:| ]+\|?$/.test(line))continue;
   const parts=line.split('|').map(v=>v.trim()).filter(Boolean);
   if(parts.length<2 || !/(\d+|Lv\.?\s*\d+)/i.test(parts[parts.length-1]))continue;
   const name=parts[0].replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[*_]/g,'').trim();
   if(name.length<3||name.length>100||/^(name|skill|level|stufe)$/i.test(name))continue;
   sections[mode].push({name,level:parts[parts.length-1].slice(0,50)});
  }
  for(const k of Object.keys(sections))sections[k]=sections[k].slice(0,70);
  return sections;
 }
};
})();