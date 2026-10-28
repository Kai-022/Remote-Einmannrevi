/* Official NCSoft EU profile test importer. Reads the public snapshot produced by
   the repository's GitHub Actions job; no Cloudflare, passwords or hidden APIs.
   Only the known test character is available until a server is deployed. */
(()=>{
'use strict';
const host='https://aion2.plaync.com';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const panel=document.createElement('section');
panel.className='panel';
panel.id='nc-official-import';
panel.innerHTML=
 '<div class="eyebrow">AION 2 · EU · CHARAKTERIMPORT</div>'+
 '<h2>✧ Deinen Charakter importieren</h2>'+
 '<p>Wähle deinen EU-Server und gib deinen Charakternamen ein. Gear, Skills und Daevanion-Boards werden zusammen geladen.</p>'+
 '<div class="grid" style="align-items:end">'+
 '<div class="field"><label for="nc-server-select">EU-Server</label><select id="nc-server-select" required>'+
 '<option value="">Server auswählen …</option></select></div>'+
 '<div class="field"><label for="nc-character-name">Charaktername</label>'+
 '<input id="nc-character-name" type="text" placeholder="Name im Spiel" maxlength="45" autocomplete="off" required></div></div>'+
 '<div class="actions"><button type="button" class="primary" id="nc-import-name">✧ Charakter importieren</button></div>'+
 '<div id="nc-feedback" class="status" role="status" aria-live="polite"></div>'+
 '<p class="tiny muted" id="nc-api-hint" style="margin-top:11px">Auf GitHub Pages ist der Testcharakter verfügbar. Auf Cloudflare Pages ermöglicht die Live-Schnittstelle den Import weiterer öffentlicher EU-Charaktere.</p>';
document.querySelector('.hero')?.after(panel);
const status=$('nc-feedback');
const euElyos='Siel|Nezekan|Vaizel|Kaisinel|Yustiel|Ariel|Fregion|Meslamtaeda|Hithanya|Nania|Tahavatha|Luteros|Phernos|Daminu|Kasaka|Bakarma|Tsenka|Kochi|Ishtar|Tiamat|Gauss|Lamuatan|Nathara'.split('|');
const euAsmo='Israphel|Zikel|Triniel|Lumiel|Marchutan|Azphel|Ereshkigal|Beritra|Nemon|Hadala|Ludra|Ulgorn|Munin|Odar|Zemurru|Kromede|Quai|Baba|Fafnir|Indnath|Agnita|Atiel|Tassin'.split('|');

const selectedServer=$('nc-server-select');
for(const [label,arr,first] of [['Elyos',euElyos,1301],['Asmodier',euAsmo,2301]]){
 const group=document.createElement('optgroup');group.label=label;
 arr.forEach((name,i)=>{const option=document.createElement('option');option.value=String(first+i);option.textContent=name+' ('+label+')';group.append(option)});
 selectedServer.append(group);
}
selectedServer.value='';

function note(s,error=false){status.textContent=s;status.classList.toggle('error',error);}
function apiOrigin(){
 // On Cloudflare Pages, the site and the read-only Worker share one domain.
 const loc=window.location;
 if((loc.protocol==='https:'&&!loc.hostname.endsWith('.github.io'))||
    (loc.protocol==='http:'&&['localhost','127.0.0.1'].includes(loc.hostname)))
   return loc.origin;
 let value='';
 try{value=localStorage.getItem('aion2_live_api')||''}catch{}
 if(!value)return '';
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')
  throw Error('Die gespeicherte Datenserver-Adresse ist ungültig.');
 return url.origin;
}
async function liveJSON(url,ms){
 let response;
 try{
  response=await fetch(url,{mode:'cors',cache:'no-store',signal:AbortSignal.timeout(ms)});
 }catch{
  throw Error('Keine Verbindung zum EU-Datenserver. Prüfe die Cloudflare-Pages-Veröffentlichung.');
 }
 if(!(response.headers.get('content-type')||'').includes('application/json'))
  throw Error('Die Cloudflare-API ist hier noch nicht aktiviert. Verbinde das Pages-Projekt mit GitHub.');
 const body=await response.json().catch(()=>null);
 if(!response.ok)throw Error(body?.error||'Datenserver: HTTP '+response.status);
 if(!body||typeof body!=='object')throw Error('Der Datenserver hat kein gültiges Ergebnis geliefert.');
 return body;
}
function parseOfficialLink(input) {
 let url;
 try{url=new URL(input.trim());}catch{throw Error('Bitte den vollständigen offiziellen Charakterlink einfügen.');}
 if(url.protocol!=='https:'||url.hostname!=='aion2.plaync.com'||url.searchParams.get('region')!=='eu')
  throw Error('Bitte einen offiziellen EU-Link von aion2.plaync.com mit region=eu verwenden.');
 const match=url.pathname.match(/^\/[a-z]{2}-[a-z]{2}\/characters\/(\d{1,8})\/([^/]+)\/?$/i);
 if(!match)throw Error('Im Link wurden keine gültige Server-ID und Charakter-ID gefunden.');
 let id;try{id=decodeURIComponent(match[2]);}catch{throw Error('Charakter-ID falsch kodiert.');}
 if(!/^[a-zA-Z0-9_+=/-]{8,256}$/.test(id))throw Error('Unbekanntes Charakterformat.');
 return {serverId:match[1],characterId:id};
}
const slots={
 MainHand:'Waffe',SubHand:'Nebenhand',Torso:'Brust',Pants:'Hose',Helmet:'Helm',
 Shoulder:'Schultern',Gloves:'Handschuhe',Boots:'Schuhe',Cape:'Umhang',Belt:'Gürtel',
 Necklace:'Halskette',Earring1:'Ohrring 1',Earring2:'Ohrring 2',Ring1:'Ring 1',
 Ring2:'Ring 2',Bracelet1:'Armband 1',Bracelet2:'Armband 2',Rune1:'Rune 1',
 Rune2:'Rune 2',Amulet:'Amulett',Arcana1:'Arkana 1',Arcana2:'Arkana 2',
 Arcana3:'Arkana 3',Arcana4:'Arkana 4',Arcana5:'Arkana 5'
};
const displayStat=stat=>[stat?.name||stat?.id||'Unbekannter Wert',stat?.value].filter(v=>v!==null&&v!==undefined&&v!=='').join(' ');
const useData=(d,ref)=>{
 const info=d.info?.profile||{},eq=d.equipment?.equipment||{},extra=d.equipment?.skill||{};
 const pieces=eq.equipmentList||[];
 if(!Array.isArray(pieces)||!pieces.length)throw Error('NCSOFT hat keine Ausrüstung geliefert.');
 const gear={};let detailed=0;
 for(const i of pieces){
  const slot=slots[i?.slotPosName];
  if(!slot)continue;
  const detail=d.items?.[String(i.slotPos)]||{};
  const sub=Array.isArray(detail.subStats)?detail.subStats:[];
  const skills=Array.isArray(detail.subSkills)?detail.subSkills:[];
  if(Object.keys(detail).length)detailed++;
  const rolls=[...sub.map(displayStat),...skills.map(k=>[k.name,k.level?'+'+k.level:''].filter(Boolean).join(' '))].filter(Boolean);
  const mains=Array.isArray(detail.mainStats)?detail.mainStats:[];
  const stones=Array.isArray(detail.magicStoneStat)?detail.magicStoneStat:[];
  const gods=Array.isArray(detail.godStoneStat)?detail.godStoneStat:[];
  const picture=String(detail.icon||i.icon||'');
  gear[slot]={
   name:String(i.name||detail.name||slot),plus:Number(i.enchantLevel||0),
   iconUrl:picture,rolls,
   importDetail:{grade:i.grade||detail.grade||'',breakthrough:i.exceedLevel??null,iconUrl:picture,
    itemId:i.id,slotPos:i.slotPos},
   details:{
    basics:mains.map(x=>({name:String(x.name||x.id||''),value:String(x.value??'')+(x.extra&&x.extra!=='0'?' (+'+x.extra+')':'')})),
    manaStones:stones.map(x=>({name:String(x.name||''),value:String(x.value??''),icon:String(x.icon||''),grade:String(x.grade||'')})),
    godStone:gods[0]?{name:String(gods[0].name||''),description:String(gods[0].desc||''),icon:String(gods[0].icon||''),grade:String(gods[0].grade||'')}:null,
    soulRate:detail.soulBindRate?(String(detail.soulBindRate)+' %'):null
   }
  };
 }
 const count=Object.keys(gear).length;
 if(!count)throw Error('Die Slots lassen sich nicht zuordnen.');
 if(Object.keys(data?.gear||{}).length&&!confirm('Vorhandenes Gear durch die '+count+' offiziellen Ausrüstungsgegenstände ersetzen?'))return;
 const rawSkills=Array.isArray(extra.skillList)?extra.skillList:[];
 const group=(cat)=>rawSkills.filter(i=>i&&i.category===cat).map(i=>({
  name:String(i.name||''),level:i.skillLevel?'Stufe '+i.skillLevel:'Nicht erlernt',
  id:Number(i.id||0),icon:i.id?'./nc-icons/skills/'+Number(i.id)+'.webp':String(i.icon||''),category:String(i.category||''),equipped:!!i.equip,acquired:!!i.acquired
 }));
 const boards=d.info?.daevanion?.boardList||[];
 const av=Array.isArray(boards)?boards.map(b=>({
  name:String(b.name||''),level:(b.openNodeCount||0)+' / '+(b.totalNodeCount||'?')+' Knoten',
 id:String(b.id||''),icon:String(b.icon||''),opened:Number(b.openNodeCount||0),total:Number(b.totalNodeCount||0)
 })):[];
 const petwing=d.equipment?.petwing||{};
 const displayName=String(info.characterName||'EU-Charakter').slice(0,45);
 data={name:displayName,mode:$('mode')?.value||'hybrid',gear,
  source:'NCSOFT – serverseitiger Testabruf',sourceRef:{sid:ref.serverId,id:ref.characterId},
  sourceUrl:d.profileUrl,importedAt:d.generatedAt,
  characterExtras:{profile:{name:displayName,className:String(info.className||''),
      level:Number(info.characterLevel||0),combatPower:Number(info.combatPower||0),
      icon:String(info.profileImage||'')},
    stats:(d.info?.stat?.statList||[]).slice(0,80).map(x=>({
      name:String(x.name||x.type||''),value:String(x.value??'')
    })),
    skills:group('Active'),passives:group('Passive'),dpSkills:group('Dp'),stigmas:[],
    daevanion:av,boards:Object.fromEntries(Object.entries(d.daevanionBoards||{}).map(([id,board])=>[
      id,{nodes:(Array.isArray(board?.nodeList)?board.nodeList:[]).slice(0,225).map(n=>({
        id:n.nodeId,row:Number(n.row),col:Number(n.col),name:String(n.name||''),type:String(n.type||''),
        grade:String(n.grade||''),open:!!n.open,icon:String(n.icon||''),
        effects:(Array.isArray(n.effectList)?n.effectList:[]).slice(0,8).map(e=>String(e.desc||''))
      })),stats:(board?.openStatEffectList||[]).slice(0,120).map(x=>String(x.desc||'')),
      skills:(board?.openSkillEffectList||[]).slice(0,120).map(x=>String(x.desc||''))}
    ])),
    pet:petwing.pet||null,wing:petwing.wing||null}};
 isDemo=false;$('charname').value=displayName;$('dash').classList.remove('hidden');
 $('type').textContent='NCSOFT · ÖFFENTLICHE PROFILDATEN';
 store();render();
 if(typeof window!=='undefined'){
  window.aionGuideTracker?.render?.();
  if(typeof Event==='function')window.dispatchEvent(new Event('aion2:character-imported'));
 }
 const when=new Date(d.generatedAt);
 const displayDate=Number.isNaN(when.getTime())?d.generatedAt:when.toLocaleString('de-DE');
 note('Import erfolgreich: '+count+' Gear-Slots, '+detailed+' Gegenstandsdetails und '+rawSkills.length+
   ' Skills geladen. Datenstand: '+displayDate+'. Für neue Spielstände muss die Serverabfrage erneut laufen.');
 $('dash').scrollIntoView({behavior:'smooth',block:'start'});
};
$('nc-import-name').addEventListener('click',async()=>{
 const btn=$('nc-import-name');btn.disabled=true;
 try{
  const serverId=$('nc-server-select').value;
  const name=$('nc-character-name').value.trim();
  if(!serverId||name.length<2)throw Error('Bitte einen EU-Server auswählen und den Charakternamen eingeben.');
  note('Lade öffentliche Charakterdaten …');
  const api=apiOrigin();
  if(api){
   note('Suche '+name+' auf dem ausgewählten Server …');
   const u=new URL('/api/search',api);
   u.search=new URLSearchParams({serverId,name}).toString();
   const answer=await liveJSON(u,20000);
   const same=(answer.characters||[]).filter(x=>
    String(x.serverId)===serverId&&String(x.name).trim().toLowerCase()===name.toLowerCase());
   if(same.length!==1)throw Error(same.length?'Mehrere Treffer auf diesem Server gefunden. Bitte die Charaktersuche später erneut versuchen.':'Charakter auf diesem Server nicht gefunden.');
   const id=same[0].characterId;
   const url=new URL('/api/character',api);
   url.search=new URLSearchParams({serverId,characterId:id}).toString();
   note('Charakter gefunden. Lade Gear, Skills und Daevanion-Boards …');
   const result=await liveJSON(url,85000);
   if(String(result.serverId)!==serverId||String(result.characterId)!==id||
      String(result.info?.profile?.characterName||'').toLowerCase()!==name.toLowerCase())
     throw Error('Datenserver lieferte nicht den ausgewählten Charakter.');
   useData(result,{serverId,characterId:id});
   return;
  }

  const response=await fetch('./nc-character-snapshot.json?t='+Date.now(),{cache:'no-store'});
  if(!response.ok)throw Error('Testdatensatz nicht verfügbar.');
  const d=await response.json();
  if(String(d.serverId)!==serverId||String(d.info?.profile?.characterName||'').toLowerCase()!==name.toLowerCase())
   throw Error('Für diesen Charakter ist noch kein Live-Datenserver angeschlossen. Der Test funktioniert derzeit mit Taty auf Yustiel.');
  useData(d,{serverId,characterId:d.characterId});
 }catch(e){note('Import nicht möglich: '+e.message,true)}
 finally{btn.disabled=false}
});
if(apiOrigin()===window.location.origin){
 const hint=document.getElementById('nc-api-hint');
 if(hint){
  hint.textContent='Prüfe Cloudflare-Live-Import …';
  fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(8000)})
   .then(async r=>r.ok?await r.json():null)
   .then(result=>{hint.textContent=result?.ok?'Live-Import aktiv · Alle öffentlich auffindbaren EU-Charaktere können gesucht werden.':'Cloudflare-Datenserver noch nicht erreichbar.';})
   .catch(()=>{hint.textContent='Cloudflare-Datenserver noch nicht erreichbar.';});
 }
}
$('nc-character-name').addEventListener('keydown',event=>{
 if(event.key==='Enter'){event.preventDefault();$('nc-import-name').click();}
});
window.aionNC={useData};
})();
