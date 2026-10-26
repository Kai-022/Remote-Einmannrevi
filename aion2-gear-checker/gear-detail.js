/* Detail popups and read-only character sections; no invented profile values. */
(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cdnImage=(url,size=37)=>{
 const value=String(url||'');
 if(/^\.\/nc-icons\/skills\/[0-9]{8}\.webp$/.test(value))
  return '<img src="'+esc(value)+'" alt="" loading="lazy" decoding="async" '+
   'style="width:'+size+'px;height:'+size+'px;object-fit:contain;border-radius:6px;flex-shrink:0;background:#1d2736" />';
 try{
  const u=new URL(value);
  if(u.protocol!=='https:'||u.hostname!=='assets.playnccdn.com')return '';
  return '<img src="'+esc(u.href)+'" alt="" loading="lazy" referrerpolicy="no-referrer" '+
   'style="width:'+size+'px;height:'+size+'px;object-fit:contain;border-radius:6px;flex-shrink:0;background:#1d2736" />';
 }catch{return ''}
};
const panel=document.createElement('dialog');panel.id='gear-detail-dialog';panel.style.cssText='max-width:min(650px,96vw);width:96vw;max-height:88vh;overflow:auto;border:1px solid #5c6981;border-radius:14px;background:#131c2a;color:#edf1f8;padding:20px;box-shadow:0 20px 80px #000b';
document.body.append(panel);
panel.addEventListener('click',e=>{if(e.target===panel)panel.close()});
const body=()=>document.getElementById('gear-list');
const section=(heading,arr,sourceLabel)=>'<section style="margin:18px 0"><div class="eyebrow">'+esc(heading)+'</div>'+
 (arr.length?arr.map(([k,v,cls,img])=>'<div class="gear-roll '+esc(cls||'mid')+'" style="margin-top:7px">'+cdnImage(img,27)+'<span class="gear-roll-name">'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join(''):
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
window.aionProfileExtras=window.aionProfileExtras||{};
window.aionProfileExtras.parseTooltip=parseTooltip;
function openGear(slot){
 const item=data?.gear?.[slot];if(!item)return;
 const detail=item.details||{};
 const basics=(detail.basics||[]).map(x=>[x.name,x.value]);
 const souls=(item.rolls||[]).map(x=>{const r=rating(slot,x);return [x,r.text,r.style]});
 const stones=(detail.manaStones||[]).map(x=>[x.name,x.value||'','',x.icon]);
 const god=(detail.godStone||null);
 const grade=item.importDetail?.grade||'';
 const breakthrough=item.importDetail?.breakthrough;
 panel.innerHTML='<button type="button" id="gear-detail-close" style="float:right">✕</button>'+
 '<div class="eyebrow">'+esc(slot)+'</div><div style="display:flex;align-items:center;gap:13px;margin:9px 0">'+cdnImage(item.iconUrl||item.importDetail?.iconUrl,68)+'<h2 style="margin:0">+'+esc(item.plus||0)+' '+esc(item.name||'Unbekannt')+'</h2></div>'+
 '<div class="tip">'+esc(grade)+(breakthrough!=null?' · ◆'+esc(breakthrough):'')+'</div>'+
 section('Basiswerte',basics,'Shugo zeigt diese meist erst beim Öffnen des Items.')+
 (detail.soulRate!=null?'<div class="tip">Seelenbindungsrate: '+esc(detail.soulRate)+'</div>':'')+
 section('Zusätzliche Werte / Seelenbindung',souls,'Das Profil liefert bisher nur die Ausrüstungsliste. Erst ein ausgelesener Item-Tooltip liefert diese Werte.')+
 section('Manasteine',stones)+
 section('Götterstein',god?[[god.name,god.description||'','',god.icon]]:[])+
 '<div class="actions"><button type="button" id="gear-detail-edit">Werte bearbeiten</button></div>';
 panel.querySelector('#gear-detail-close').onclick=()=>panel.close();
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
 const groups=[
  ['Aktive Fähigkeiten',meta.skills],
  ['Passive Fähigkeiten',meta.passives],
  ['DP-Fähigkeiten',meta.dpSkills],
  ['Stigmen (separat)',meta.stigmas],
  ['Daevanion-Übersicht',meta.daevanion]
 ];
 const rows=groups.map(([name,items])=>{
  const arr=Array.isArray(items)?items:[];
  return '<div class="card" style="margin:13px 0"><div class="slothead"><strong>'+esc(name)+'</strong>'+
   '<span class="pill">'+arr.length+'</span></div>'+
   (arr.length?'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px;margin-top:10px">'+
    arr.map(i=>'<div class="gear-roll" style="align-items:center">'+cdnImage((window.aionOfficialSkillIcon?.(i.name))||i.icon,35)+
      '<div class="gear-roll-name"><strong style="display:block">'+esc(i.name)+'</strong>'+
      '<small style="color:var(--muted)">'+esc(i.level||'')+
       (i.equipped?' · Ausgerüstet':'')+'</small></div></div>').join('')+'</div>':
   '<div class="tip">Keine separat erfassten Daten vorhanden.</div>')+'</div>';
 }).join('');
 const companions=(meta.pet||meta.wing)?'<div class="card" style="margin:13px 0"><strong>Begleiter und Schwingen</strong>'+
  (meta.pet?'<div class="gear-roll" style="margin-top:8px">'+cdnImage(meta.pet.icon,52)+
   '<span class="gear-roll-name">Pet: '+esc(meta.pet.name)+'</span><span>Stufe '+esc(meta.pet.level??'?')+'</span></div>':'')+
  (meta.wing?'<div class="gear-roll" style="margin-top:8px">'+cdnImage(meta.wing.icon,52)+
   '<span class="gear-roll-name">Schwingen: '+esc(meta.wing.name)+'</span><span>+'+esc(meta.wing.enchantLevel||0)+'</span></div>':'')+'</div>':'';
 const root=document.getElementById('character-skills-display');
 if(root)root.innerHTML=rows+companions;
}
const originalRender=render;
render=function(){originalRender();displaySkills()};
displaySkills();
window.aionProfileExtras.parse=function(text){
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
};
})();