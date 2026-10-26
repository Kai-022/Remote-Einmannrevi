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
panel.innerHTML='<div class="eyebrow">NEU · OFFIZIELLE AION-2-DATEN · EU</div>'+
 '<h2>✧ Charakter über EU-Server importieren</h2>'+
 '<p>Wähle deinen EU-Server und gib deinen Charakternamen ein.</p>'+
 '<div class="grid"><div class="field"><label for="nc-server-select">EU-Server</label><select id="nc-server-select"></select></div><div class="field"><label for="nc-character-name">Charaktername</label><input id="nc-character-name" value="Taty" autocomplete="off"></div></div>'+ '<div class="actions"><button type="button" class="primary" id="nc-import-name">✧ Charakter importieren</button></div>'+
 '<details style="margin-top:15px"><summary style="color:var(--gold);cursor:pointer">Alternativ: Offiziellen Charakterlink einfügen</summary><div class="grid" style="align-items:end"><div class="field"><label for="nc-public-link">Offizieller AION-2-Charakterlink</label>'+
 '<input id="nc-public-link" type="url" placeholder="https://aion2.plaync.com/en-us/characters/…?region=eu" autocomplete="url"></div>'+
 '<button type="button" id="nc-import">Aus Link importieren</button></div></details>'+
 '<div id="nc-feedback" class="status" role="status" aria-live="polite"></div>'+
 '<details style="margin-top:14px"><summary style="color:var(--gold);cursor:pointer">Eigener Live-Datenserver (optional)</summary><p class="tiny muted">Wenn ein Live-Datenserver eingerichtet ist, können alle EU-Charaktere geladen werden.</p><input type="url" id="nc-api-base" placeholder="https://dein-server.de"><button type="button" id="nc-api-save">Adresse speichern</button></details>'+
 '<p class="tiny muted" style="margin-top:11px">Das ist zunächst ein <b>serverseitiger Testabruf</b> für den bisher angegebenen EU-Charakter. Es werden gespeicherte echte NCSOFT-Daten geladen, keine Demo. Andere Charaktere brauchen später einen öffentlichen Datenserver. Der Zeitstempel zeigt, wie aktuell die Daten sind.</p>';
const shugo=$('shugo-import');
if(shugo)shugo.parentNode.insertBefore(panel,shugo);
else document.querySelector('.hero')?.after(panel);
const status=$('nc-feedback');
const euElyos='Siel|Nezekan|Vaizel|Kaisinel|Yustiel|Ariel|Fregion|Meslamtaeda|Hithanya|Nania|Tahavatha|Luteros|Phernos|Daminu|Kasaka|Bakarma|Tsenka|Kochi|Ishtar|Tiamat|Gauss|Lamuatan|Nathara'.split('|');
const euAsmo='Israphel|Zikel|Triniel|Lumiel|Marchutan|Azphel|Ereshkigal|Beritra|Nemon|Hadala|Ludra|Ulgorn|Munin|Odar|Zemurru|Kromede|Quai|Baba|Fafnir|Indnath|Agnita|Atiel|Tassin'.split('|');

const selectedServer=$('nc-server-select');
for(const [label,arr,first] of [['Elyos',euElyos,1301],['Asmodier',euAsmo,2301]]){
 const group=document.createElement('optgroup');group.label=label;
 arr.forEach((name,i)=>{const option=document.createElement('option');option.value=String(first+i);option.textContent=name+' ('+label+')';group.append(option)});
 selectedServer.append(group);
}
selectedServer.value='1305';

function note(s,error=false){status.textContent=s;status.classList.toggle('error',error);}
const apiInput=$('nc-api-base');
try{apiInput.value=localStorage.getItem('aion2_live_api')||''}catch{}
function apiOrigin(){
 const value=apiInput.value.trim();if(!value)return '';
 const url=new URL(value);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')
  throw Error('Bitte nur die HTTPS-Grundadresse des Datenservers eintragen.');
 return url.origin;
}
$('nc-api-save').onclick=()=>{
 try{const addr=apiOrigin();localStorage.setItem('aion2_live_api',addr);note(addr?'Datenserver gespeichert.':'Datenserver entfernt.')}
 catch(e){note(e.message,true)}
};
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
    manaStones:stones.map(x=>({name:String(x.name||''),value:String(x.value??'')})),
    godStone:gods[0]?{name:String(gods[0].name||''),description:String(gods[0].desc||'')}:null,
    soulRate:detail.soulBindRate?(String(detail.soulBindRate)+' %'):null
   }
  };
 }
 const count=Object.keys(gear).length;
 if(!count)throw Error('Die Slots lassen sich nicht zuordnen.');
 if(Object.keys(data?.gear||{}).length&&!confirm('Vorhandenes Gear durch die '+count+' offiziellen Ausrüstungsgegenstände ersetzen?'))return;
 const rawSkills=Array.isArray(extra.skillList)?extra.skillList:[];
 const group=(cat)=>rawSkills.filter(i=>i&&i.category===cat).map(i=>({
  name:String(i.name||''),level:i.skillLevel?'Stufe '+i.skillLevel:'Nicht erlernt'
 }));
 const boards=d.info?.daevanion?.boardList||[];
 const av=Array.isArray(boards)?boards.map(b=>({
  name:String(b.name||''),level:(b.openNodeCount||0)+' / '+(b.totalNodeCount||'?')+' Knoten'
 })):[];
 const petwing=d.equipment?.petwing||{};
 const displayName=String(info.characterName||'EU-Charakter').slice(0,45);
 data={name:displayName,mode:$('mode')?.value||'hybrid',gear,
  source:'NCSOFT – serverseitiger Testabruf',sourceRef:{sid:ref.serverId,id:ref.characterId},
  sourceUrl:d.profileUrl,importedAt:d.generatedAt,
  characterExtras:{skills:[...group('Active'),...group('Passive')],stigmas:group('Dp'),daevanion:av,
    pet:petwing.pet||null,wing:petwing.wing||null}};
 isDemo=false;$('charname').value=displayName;$('dash').classList.remove('hidden');
 $('type').textContent='NCSOFT · ÖFFENTLICHE PROFILDATEN';
 store();render();
 const when=new Date(d.generatedAt);
 const displayDate=Number.isNaN(when.getTime())?d.generatedAt:when.toLocaleString('de-DE');
 note('Import erfolgreich: '+count+' Gear-Slots, '+detailed+' Gegenstandsdetails und '+rawSkills.length+
   ' Skills geladen. Datenstand: '+displayDate+'. Für neue Spielstände muss die Serverabfrage erneut laufen.');
 $('dash').scrollIntoView({behavior:'smooth',block:'start'});
};
$('nc-import').addEventListener('click',async()=>{
 const btn=$('nc-import');btn.disabled=true;
 try{
  const ref=parseOfficialLink($('nc-public-link').value);
  note('Prüfe offiziellen NCSOFT-Datensatz …');
  const r=await fetch('./nc-character-snapshot.json?t='+Date.now(),{method:'GET',cache:'no-store'});
  if(!r.ok)throw Error('Testdatensatz noch nicht veröffentlicht (HTTP '+r.status+').');
  const d=await r.json();
  if(d.version!==1||d.region!=='eu'||d.serverId!==ref.serverId||d.characterId!==ref.characterId)
   throw Error('Für diesen Charakter liegt noch kein vorbereiteter Datensatz vor. Der Test gilt nur für den bekannten EU-Charakter; andere IDs brauchen einen Datenserver.');
  useData(d,ref);
 }catch(e){note('Import nicht möglich: '+String(e.message||e),true);}
 finally{btn.disabled=false;}
});
$('nc-import-name').addEventListener('click',async()=>{
 const btn=$('nc-import-name');btn.disabled=true;
 try{
  const serverId=$('nc-server-select').value;
  const name=$('nc-character-name').value.trim();
  if(!serverId||name.length<2)throw Error('Bitte Server und Charakternamen eingeben.');
  note('Lade öffentliche Charakterdaten …');
  const api=apiOrigin();
  if(api){
   note('Suche '+name+' auf dem ausgewählten Server …');
   const u=new URL('/api/search',api);
   u.search=new URLSearchParams({serverId,name}).toString();
   const response=await fetch(u,{mode:'cors',signal:AbortSignal.timeout(20000)});
   const answer=await response.json();
   if(!response.ok)throw Error(answer.error||'Charaktersuche fehlgeschlagen.');
   const same=(answer.characters||[]).filter(x=>
    String(x.serverId)===serverId&&String(x.name).trim().toLowerCase()===name.toLowerCase());
   if(same.length!==1)throw Error(same.length?'Mehrere Treffer: bitte den offiziellen Profil-Link verwenden.':'Charakter auf diesem Server nicht gefunden.');
   const id=same[0].characterId;
   const url=new URL('/api/character',api);
   url.search=new URLSearchParams({serverId,characterId:id}).toString();
   const full=await fetch(url,{mode:'cors',signal:AbortSignal.timeout(60000)});
   const result=await full.json();
   if(!full.ok)throw Error(result.error||'Ausrüstungsabruf fehlgeschlagen.');
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
window.aionNC={useData,parseOfficialLink};
})();
