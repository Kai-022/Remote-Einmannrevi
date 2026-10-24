/* AION 2 EU Character Import — public, read-only */
(() => {
  'use strict';
  const el = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]));
  const styles = document.createElement('style');
  styles.textContent = '.import-result{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #465268;padding:11px;margin:8px 0;border-radius:8px;background:#131c2a}.import-result button{flex-shrink:0}.import-result strong{display:block}.import-result span{font-size:12px;color:#acb7c6}.import-msg{padding:11px 0;color:#e6c78d;font-size:13px;white-space:pre-line}.import-msg.success{color:#7fe0af}.import-msg.error{color:#f09595}.import-quiet{font-size:12px;color:#a6b1c1}.import-quiet a{color:#e8c687}.import-stats{display:flex;gap:14px;flex-wrap:wrap;color:#c6d2df;font-size:13px}.import-stats b{color:#e8c687}.import-manual{background:#101a29;padding:11px;border-radius:7px;border:1px solid #3d485a}.import-manual summary{cursor:pointer;color:#e8c687}';
  document.head.appendChild(styles);
  const box = document.createElement('section');
  box.className = 'panel';
  box.id = 'import-panel';
  box.innerHTML = '<h2>✧ Charakter automatisch importieren (EU)</h2>'+
  '<p>Füge deinen offiziellen EU-Charakterlink ein. Die Webseite versucht, die öffentlich freigegebenen Daten direkt abzurufen – ohne zusätzliche Konten oder Verbindung zu weiteren Diensten.</p>'+
  '<form id="import-search-form" class="grid" style="align-items:end"><div class="field"><label for="import-name">Charaktername (mindestens 2 Zeichen)</label><input id="import-name" placeholder="Dein Charaktername" required minlength="2" maxlength="40" autocomplete="off"></div><button type="submit" class="primary" id="import-search-button">🔎 EU-Charakter suchen</button></form>'+
  '<div class="import-msg" id="import-message" role="status" aria-live="polite">Bereit für die Suche.</div>'+
  '<div id="import-results" aria-label="Gefundene Charaktere"></div>'+
  '<div id="import-summary" class="import-stats"></div>'+
  '<p class="import-quiet" style="margin-top:15px">Direktabruf über öffentlich zugängliche Daten von NCSOFT und Vi.ki. Falls die Quellseite Browseranfragen blockiert, wird kein Gear importiert und deine bisherigen Werte bleiben erhalten.</p>'+
  '<details class="import-manual"><summary>Alternative: Charakterdaten als JSON importieren</summary><p class="import-quiet">Falls du eine JSON-Datei der öffentlichen Charakter-/Equipment-Daten hast, kannst du sie hier öffnen. Keine Logins oder Zugangsdaten verwenden.</p><input type="file" id="import-json-file" accept=".json,application/json"><button id="import-json-button" type="button" style="margin-top:10px">JSON-Daten prüfen und importieren</button></details>';
  // Profiles from the public AION 2 EU armory already carry both IDs; searching is optional.
  const linkPanel = document.createElement('div');
  linkPanel.className = 'import-manual';
  linkPanel.style.margin='14px 0';
  linkPanel.innerHTML='<strong style="color:#e8c687">Einfacher: Charakterlink einfügen</strong>'+
    '<p class="import-quiet">Der Link wird lokal ausgewertet. Server und Charakter-ID werden ohne Namenssuche erkannt.</p>'+
    '<form id="profile-link-form" class="grid" style="align-items:end">'+
    '<div class="field"><label for="profile-link">Offizieller AION-2-Charakterlink (EU)</label><input type="url" id="profile-link" placeholder="https://aion2.plaync.com/en-us/characters/…?region=eu" required autocomplete="off"></div>'+
    '<button type="submit" class="primary" id="profile-link-button">✧ Gear aus Link importieren</button></form>'+
    '<div class="import-quiet" style="margin-top:8px">Keine Installation und kein zusätzliches Konto. Hinweis: Bei HTTP 403 oder CORS können wir die Ausrüstung aus dem Link allein nicht abrufen. Dann bleibt der manuelle oder JSON-Import.</div>';
  box.insertBefore(linkPanel,box.querySelector('#import-search-form'));
  const transferPanel = document.createElement('div');
  transferPanel.className='import-manual';
  transferPanel.style.margin='14px 0';
  transferPanel.innerHTML =
    '<strong style="color:#e8c687">Ohne Cloudflare: direkt von deiner geöffneten AION-2-Seite übernehmen (Testfunktion)</strong>'+
    '<p class="import-quiet">Wenn die direkte Suche blockiert wird, kannst du den Gear-Abruf auf der offiziellen AION-2-Seite selbst starten. Ziehe den folgenden Link einmal in deine Lesezeichenleiste und klicke das Lesezeichen, während dein offizielles Charakterprofil geöffnet ist.</p>'+
    '<div class="actions"><a class="button primary" id="gear-bookmark" style="cursor:grab" title="In die Lesezeichenleiste ziehen">✧ AION-2-Gear übernehmen</a>'+
    '<a class="button" target="_blank" rel="noopener noreferrer" href="https://aion2.plaync.com/en-us/characters/1305/GXf_uDNlKcYJYIHNvVUVBbBYQmXHGspXUlVENSk2RAc%3D?region=eu">Offizielles Profil öffnen ↗</a></div>'+
    '<p class="import-quiet">Ablauf: <b>1.</b> Lesezeichenleiste mit Strg+Umschalt+B einblenden. <b>2.</b> Goldenen Link dorthin ziehen. <b>3.</b> Offizielles EU-Profil öffnen und dort auf das neue Lesezeichen klicken. Es öffnet diesen Gear Checker mit deinen Daten. Keine Installation, kein zusätzliches Konto. Funktioniert nur, wenn NCSOFT die Ausrüstungsdaten auf seiner eigenen Seite freigibt und Lesezeichen-Skripte erlaubt.</p>';
  box.insertBefore(transferPanel,box.querySelector('#import-search-form'));
  const bookmark = transferPanel.querySelector('#gear-bookmark');
  bookmark.href = 'javascript:('+importAion2FromOfficialSite.toString()+')()';
  bookmark.setAttribute('draggable','true');

  const currentPanel = el('charname').closest('.panel');
  currentPanel.parentNode.insertBefore(box,currentPanel);
  // Correction: label the older section as optional manual editor.
  const h = currentPanel.querySelector('h2');
  if(h)h.textContent='Manuelle Eingabe / Bearbeitung';
  const info = currentPanel.querySelector('.info');
  if(info)info.textContent='Optional: Du kannst Gear jederzeit von Hand ergänzen oder korrigieren. Der automatische EU-Import steht oben.';
  const notice = (s,kind='')=>{const p=el('import-message');p.textContent=s;p.className='import-msg '+kind;};
  const listNode=el('import-results');
  // No proxy, no extra account. Direct requests work only when AION 2/Vi.ki permit browser access.
  try{localStorage.removeItem('aion2_proxy_url');}catch{}
  const get=async (url,ms=22000)=>{
    const ctl = new AbortController(); const t=setTimeout(()=>ctl.abort(),ms);
    try{
      const response=await fetch(url,{method:'GET',mode:'cors',headers:{Accept:'application/json'},signal:ctl.signal,credentials:'omit'});
      const content=await response.json().catch(()=>null);
      if(!response.ok)throw Error((content?.code?content.code+': ':'')+(content?.error||'HTTP '+response.status));
      if(content && typeof content==='object' && content.error)throw Error(content.code ? content.code+': '+content.error : content.error);
      return content;
    }finally{clearTimeout(t);}
  };
  const unwrap=(v)=>{
    for(let n=0;n<4;n++){
      if(v && typeof v==='object' && !Array.isArray(v)){
        if(Array.isArray(v.content)&&v.content[0]?.text){try{v=JSON.parse(v.content[0].text);continue;}catch{}}
        if(v.data&&typeof v.data==='object'){v=v.data;continue;}
        if(v.result&&typeof v.result==='object'){v=v.result;continue;}
      }
      break;
    }
    return v;
  };
  const first=(o,...paths)=>{for(const path of paths){const v=path.split('.').reduce((x,k)=>x?.[k],o);if(v!==null && v!==undefined && v!=='')return v;}return null;};
  const arr=(o,...keys)=>{for(const k of keys){const v=first(o,k);if(Array.isArray(v))return v;}return[];};
  const rawMatches=(raw)=>{
    const o=unwrap(raw);
    if(Array.isArray(o))return o;
    const known=arr(o,'characters','matches','list','items','results','characterList','result.list','data.list','data.characters','searchResults','results.characters','results.items','result.characters','characters.list','characters.items','data.matches','data.results','data.items');
    if(known.length)return known;
    return [];
  };
  const normalizeMatch=x=>{
    const id=first(x,'characterId','character_id','ref.characterId','charId','id','character.id','character.characterId');
    const sid=first(x,'serverId','server_id','ref.serverId','server.id','character.serverId');
    if(id===null||sid===null)return null;
    const n=first(x,'characterName','name','character_name','nickname','profile.characterName')||'Unbekannt';
    const server=first(x,'serverName','server_name','worldName','server.name')||('Server '+sid);
    const cls=first(x,'className','class_name','jobName','class','job')||'';
    return {id:String(id),sid:String(sid),name:String(n).replace(/<[^>]*>/g,''),server:String(server),cls:typeof cls==='string'?cls:'',level:first(x,'characterLevel','level','lv')||'',race:first(x,'factionName','raceName','race')||''};
  };
  let found=[],selected=null,activeSource='',loading=false;
  async function search(ev){
    ev.preventDefault();
    if(loading)return;
    const name=el('import-name').value.trim();
    if(name.length<2){notice('Mindestens zwei Zeichen eingeben.','error');return;}
    found=[];listNode.innerHTML='';el('import-summary').innerHTML='';
    notice('Suche direkt über die öffentlichen EU-Datenquellen …');
    loading=true;el('import-search-button').disabled=true;
    const sources=[
      ['Vi.ki','https://aion2.vi.ki/-/aion2/search?'+new URLSearchParams({region:'eu',name})],
      ['NCSOFT','https://api-search.plaync.com/aion2global/search/v2/character?'+new URLSearchParams({keyword:name,region:'eu',localeInfo:'en',serverId:'',page:'1',size:'30'})]
    ];
    const errors=[];
    try{
      for(const [source,url] of sources){
        try{
          const result=await get(url,10000);
          const objects=rawMatches(result);
          if(!objects.length){errors.push(source+': keine Treffer');continue;}
          const matches=objects.map(normalizeMatch).filter(Boolean);
          if(!matches.length){errors.push(source+': Antwortformat nicht erkannt');continue;}
          found=matches;activeSource=source;break;
        }catch(e){errors.push(source+': '+e.message);}
      }
      if(!found.length){
        notice('Keine Ergebnisse über die direkte Verbindung. '+errors.join(' / ')+
          '. Die Webseiten dürfen öffentliche Daten blockieren (CORS/HTTP 403). Ohne einen zusätzlichen Server ist dann nur die manuelle Gear-Eingabe oder der JSON-Dateiimport möglich.','error');
        return;
      }
      listNode.innerHTML='<div class="import-quiet">'+found.length+' Treffer gefunden. Wähle deinen EU-Charakter:</div>'+
        found.slice(0,50).map((x,i)=>'<div class="import-result"><div><strong>'+esc(x.name)+'</strong><span>'+esc(x.server)+' · '+esc(x.cls||'Klasse nicht angegeben')+(x.level?' · Level '+esc(x.level):'')+'</span></div><button type="button" class="import-pick" data-index="'+i+'">Importieren</button></div>').join('');
      notice('Suche über '+activeSource+' erfolgreich.','success');
    }finally{loading=false;el('import-search-button').disabled=false;}
  }

  const slotMap = str=>{
    const s=String(str||'').replace(/[\s_-]/g,'').toLowerCase();
    if(!s)return null;
    const checks=[
      [/mainhand|mainweapon|^weapon$|^weapon1$|^mace$|^waffe$|^streitkolben$/,'Waffe'],
      [/subhand|offhand|secondary|shield|^schutz$|nebenhand/,'Nebenhand'],
      [/helmet|head|helm|hood|kopf/,'Helm'],
      [/shoulder|schulter/,'Schultern'],
      [/chest|torso|^body$|upperbody|^top$|robe|brust|oberk[oö]rper/,'Brust'],
      [/pants|trouser|lowerbody|bottom|legging|hose|bein/,'Hose'],
      [/glove|hand|handschuh/,'Handschuhe'],
      [/boots|^foot$|shoe|schuh|stiefel/,'Schuhe'],
      [/cloak|cape|mantle|umhang/,'Umhang'],
      [/necklace|neck|halskette/,'Halskette'],
      [/earring|ohrring/,'Ohrring'],
      [/bracelet|armband/,'Armband'],
      [/ring|^finger/,'Ring'],
      [/amulet|amulett/,'Amulett'],
      [/belt|g[uü]rtel/,'Gürtel'],
      [/rune|runen/,'Rune']
    ];
    for(const [re,slot]of checks)if(re.test(s)){
      if(['Ring','Ohrring','Armband','Rune'].includes(slot))return slot+(s.includes('2')||s.includes('right')||s.includes('secondary')?' 2':' 1');
      return slot;
    }
    return null;
  };
  const normalizeEquipment=o=>{
    const a=unwrap(o);
    const raw=arr(a,'equipment.equipmentList','equipment.slots','equipmentList','slots','gear','gears','equipped','items','equipment','character.equipment','character.gear','equipment.items','profile.equipment','equipment.equipmentList','character.equipmentList','character.equipment.slots','character.gear.slots','gear.slots');
    return raw.filter(v=>v && typeof v==='object'&&(v.name||v.itemName||v.id||v.item?.name));
  };
  const describeStat=x=>{
    if(typeof x==='string')return x.trim();
    if(!x||typeof x!=='object')return'';
    const n=first(x,'name','statName','optionName','label','type','id')||'';
    const v=first(x,'value','statValue','amount','stat','level');
    return [n,v].filter(y=>y!==null).join(' ').trim();
  };
  const parseRolls=x=>{
    const options=arr(x,'subStats','substats','soulBinding.stats','soulBinding.options','subStat.statList','subStats.statList','subSkill.statList','item.subStat.statList','item.subStats','soulBindings','soulBindStats','subOptionList','options','rolls','soulImprint','details.subStats','item.subStats');
    const skills=arr(x,'subSkills','subSkill.skillList','details.subSkills','item.subSkills');
    return [...options.map(describeStat),...skills.map(q=>[q.name||q.skillName, q.level!=null?('+'+q.level):''].join(' ').trim())].filter(Boolean);
  };
  function equipmentToGear(equipment){
    let gear={},extra=[],ambiguous=0,withRolls=0;
    for(const item of normalizeEquipment(equipment)){
      const pos=first(item,'slotPosName','slotName','slot','equipmentSlot','position','typeSlot','item.slotPosName');
      const slot=slotMap(pos);
      if(!slot){extra.push((item.name||item.itemName||'Item')+' ('+(pos??'?')+')');continue;}
      let targetSlot=slot;
      if(gear[targetSlot] && /^(Ring|Ohrring|Armband|Rune) 1$/.test(targetSlot))targetSlot=targetSlot.replace(' 1',' 2');
      if(gear[targetSlot]){ambiguous++;continue;}
      const rolls=parseRolls(item);
      if(rolls.length)withRolls++;
      gear[targetSlot]={name:String(first(item,'name','itemName','item.name')||slot),plus:Number(first(item,'enchantLevel','enchant','enhanceLevel','enhancement','item.enchantLevel')||0)||0,rolls,
        importDetail:{grade:first(item,'grade','rarity')||'',slotPos:first(item,'slotPos','slot')||null,itemId:first(item,'id','itemId','item.id')||null}};
    }
    return {gear,extra,ambiguous,withRolls};
  }
  async function getProfileAndEquipment(ref){
    const errors=[];
    const q=new URLSearchParams({region:'eu',server:ref.sid,id:ref.id});
    try{
      const d=unwrap(await get('https://aion2.vi.ki/-/aion2/character?'+q,10000));
      const equipment=normalizeEquipment(d).length?d:first(d,'equipment','character','profile','characterData')||d;
      if(normalizeEquipment(equipment).length)return {profile:d,equipment,source:'Vi.ki direkt'};
      errors.push('Vi.ki: keine erkennbaren Ausrüstungsdaten');
    }catch(e){errors.push('Vi.ki: '+e.message);}
    const args=new URLSearchParams({region:'eu',lang:'en',characterId:ref.id,serverId:ref.sid});
    try{
      const base='https://aion2.plaync.com/api/character/';
      const gear=unwrap(await get(base+'equipment?'+args,10000));
      if(!normalizeEquipment(gear).length)throw Error('Keine erkennbaren Ausrüstungsdaten');
      let profile={};
      try{profile=unwrap(await get(base+'info?'+args,8000));}catch{}
      return {profile,equipment:gear,source:'NCSOFT direkt'};
    }catch(e){errors.push('NCSOFT: '+e.message);}
    throw Error(errors.join(' / ')+'. Der Link wurde erkannt, aber diese Datenquellen erlauben möglicherweise keine direkte Abfrage aus GitHub Pages. Du kannst dein Gear weiterhin manuell oder über eine JSON-Datei eintragen.');
  }

  // Seelenbindungs-Detailwerte werden nur übernommen, wenn die öffentlich
  // zugängliche Charakterantwort diese bereits enthält; keine Umgehung von Zugriffssperren.
  async function addSoulBindings(){return {count:0,checked:0};}
  async function importRef(ref) {
    if(loading)return;
    if(ref.cls && !/cleric|kleriker|치유성|治癒星/i.test(ref.cls) && !confirm('Achtung: Der ausgewählte Charakter ist laut Suche '+ref.cls+'. Die Gear-Empfehlungen dieser Webseite sind für Kleriker. Trotzdem importieren?'))return;
    if(Object.keys(data.gear||{}).length && !confirm('Die importierten Gegenstände ersetzen deine bisherigen Gear-Einträge. Fortfahren?'))return;
    loading=true;listNode.querySelectorAll('button').forEach(b=>b.disabled=true);
    notice('Lade öffentliche Ausrüstung von '+ref.name+' ('+ref.server+') …');
    try{
      const result=await getProfileAndEquipment(ref);
      const liveName=first(result.profile,'profile.characterName','characterName','profile.name','name');
      if(typeof liveName==='string' && liveName.trim())ref={...ref,name:liveName.trim()};
      notice('Ausrüstung geladen. Prüfe, ob die Seelenbindungswerte abrufbar sind …');
      const detailResult=await addSoulBindings(ref,result.equipment);
      const mapped=equipmentToGear(result.equipment);
      if(!Object.keys(mapped.gear).length)throw Error('Ausrüstung erhalten, aber keine Gear-Slots konnten eindeutig erkannt werden. Bestehende Eingaben bleiben erhalten.');
      isDemo=false;data={name:ref.name,mode:el('mode').value||'hybrid',gear:mapped.gear,sourceRef:ref,source:result.source,importedAt:new Date().toISOString()};
      el('dash').classList.remove('hidden');el('charname').value=ref.name;el('current').textContent=ref.name;
      el('type').textContent='LIVE-IMPORT · '+result.source;render();store();
      el('import-summary').innerHTML='<span><b>'+Object.keys(mapped.gear).length+'</b> Gear-Slots</span><span><b>'+mapped.withRolls+'</b> Slots mit Zusatzwerten</span><span><b>'+mapped.extra.length+'</b> unbekannte Plätze</span>';
      notice('Import erfolgreich: '+ref.name+' · '+ref.server+' ('+result.source+'). '+(mapped.withRolls===0?'Die Datenquelle hat keine Soul-Binding-Würfe geliefert. Diese musst du ggf. noch ergänzen; ohne diese werden keine falschen S-Bewertungen vorgetäuscht. ':'')+(mapped.extra.length?'Nicht zugeordnete Slots: '+mapped.extra.join(', ').slice(0,350):''),'success');
      el('dash').scrollIntoView({behavior:'smooth'});
    }catch(e){notice('Import nicht möglich: '+e.message+'. Deine bisherigen Gear-Daten bleiben erhalten.','error');}
    finally{loading=false;listNode.querySelectorAll('button').forEach(b=>b.disabled=false);}
  }
  function parseOfficialProfileLink(raw){
    let url;
    try{url=new URL(raw.trim());}catch{throw Error('Bitte einen vollständigen offiziellen Link einfügen.');}
    if(url.protocol!=='https:' || url.hostname!=='aion2.plaync.com')
      throw Error('Bitte einen offiziellen Link von aion2.plaync.com verwenden.');
    if(url.searchParams.get('region')!=='eu')
      throw Error('Dieser Gear Checker ist für die EU-Version. Der Link muss region=eu enthalten.');
    const match=url.pathname.match(/^\/[a-z]{2}-[a-z]{2}\/characters\/(\d+)\/([^/]+)\/?$/i);
    if(!match)throw Error('Der Link enthält keine gültige Server-ID und Charakter-ID.');
    const server=match[1];
    let id;
    try{id=decodeURIComponent(match[2]);}catch{throw Error('Charakter-ID ist ungültig codiert.');}
    if(!/^\d{1,8}$/.test(server) || !/^[a-zA-Z0-9_+\/=\-]{8,256}$/.test(id))
      throw Error('Server-ID oder Charakter-ID ist ungültig.');
    return {id,sid:server,name:'Charakter (Server '+server+')',server:'Server '+server,cls:''};
  }

  if(new URLSearchParams(location.search).get('receive')==='1'){
    const officialOrigin='https://aion2.plaync.com';
    const parent=window.opener;
    notice('Bereit, Gear direkt von der offiziellen AION-2-Seite zu empfangen …');
    let finished=false;
    window.addEventListener('message',event=>{
      if(finished||event.origin!==officialOrigin||event.source!==parent||!event.data)return;
      const msg=event.data;
      if(msg.type==='AION2_GEAR_ERROR'){
        finished=true;
        notice('Die offizielle AION-2-Seite konnte das Gear nicht laden: '+String(msg.error||'Unbekannter Fehler').slice(0,300)+'. Die öffentliche NCSOFT-API ist möglicherweise derzeit nicht verfügbar.','error');
        return;
      }
      if(msg.type!=='AION2_GEAR_TRANSFER'||msg.version!==1)return;
      if(!/^\d{1,8}$/.test(String(msg.serverId))||
         !/^[a-zA-Z0-9_+\/=\-]{8,256}$/.test(String(msg.characterId))||
         !msg.equipment||typeof msg.equipment!=='object')return;
      const equipped=normalizeEquipment(msg.equipment);
      if(equipped.length>100)return;
      const mapped=equipmentToGear(msg.equipment);
      const count=Object.keys(mapped.gear).length;
      if(!count){notice('NCSOFT hat Daten geliefert, aber keine Ausrüstung konnte zugeordnet werden. Deine bisherigen Eingaben bleiben unverändert.','error');return;}
      if(Object.keys(data.gear||{}).length && !confirm('Offizielle Gear-Daten übernehmen und bisherige Gear-Einträge ersetzen?'))return;
      finished=true;
      const profile=unwrap(msg.profile||{});
      const charName=first(profile,'profile.characterName','characterName','profile.name','name')||'EU-Charakter';
      const ref={id:String(msg.characterId),sid:String(msg.serverId),name:String(charName),server:'EU '+msg.serverId};
      isDemo=false;
      data={name:ref.name,mode:el('mode').value||'hybrid',gear:mapped.gear,
        sourceRef:ref,source:'NCSOFT Profil-Lesezeichen',importedAt:new Date().toISOString()};
      el('dash').classList.remove('hidden');
      el('charname').value=ref.name;
      el('type').textContent='OFFIZIELLE PROFILDATEN';
      render();store();
      el('import-summary').innerHTML='<span><b>'+count+'</b> Gear-Slots</span><span><b>'+mapped.withRolls+'</b> Slots mit Zusatzwerten</span>';
      notice(count+' Gear-Slots direkt von der offiziellen AION-2-Seite übernommen. '+(mapped.withRolls===0?'Die offizielle Übersicht enthält keine Seelenbindungswerte; diese kannst du manuell ergänzen.':''),'success');
      el('dash').scrollIntoView({behavior:'smooth'});
    });
    if(parent){
      const ready=()=>{if(!finished)try{parent.postMessage({type:'AION2_GEAR_READY'},officialOrigin);}catch{}};
      [0,500,1500,3000,5000].forEach(ms=>setTimeout(ready,ms));
    } else notice('Keine Verbindung zur offiziellen Profilseite. Öffne den Gear Checker über das Lesezeichen im offiziellen Profil.','error');
  }

  el('profile-link-form').addEventListener('submit',async event=>{
    event.preventDefault();
    if(loading)return;
    let ref;
    try{ref=parseOfficialProfileLink(el('profile-link').value);}catch(e){notice(e.message,'error');return;}
    notice('EU-Profil-Link erkannt (Server '+ref.sid+'). Versuche öffentliche Gear-Daten direkt zu laden …');
    await importRef(ref);
  });
  el('import-search-form').addEventListener('submit',search);
  listNode.addEventListener('click',e=>{const b=e.target.closest('.import-pick');if(b && found[Number(b.dataset.index)])importRef(found[Number(b.dataset.index)]);});
  el('import-json-button').addEventListener('click',async()=>{
    const file=el('import-json-file').files?.[0];if(!file){notice('Wähle zuerst eine JSON-Datei aus.','error');return;}
    if(file.size>3_000_000){notice('Datei zu groß (maximal 3 MB).','error');return;}
    try{
      const j=JSON.parse(await file.text());const x=unwrap(j);const candidate=normalizeEquipment(x).length?x:first(x,'equipment','character','profile')||x;
      const mapped=equipmentToGear(candidate);
      if(!Object.keys(mapped.gear).length)throw Error('Es wurde kein bekanntes Ausrüstungsformat erkannt.');
      if(Object.keys(data.gear||{}).length && !confirm('Gespeicherte Gear-Daten ersetzen?'))return;
      const name=first(x,'profile.characterName','characterName','name','profile.name')||'JSON-Import';
      isDemo=false;data={name:String(name),mode:el('mode').value||'hybrid',gear:mapped.gear,source:'JSON-Datei',importedAt:new Date().toISOString()};
      el('dash').classList.remove('hidden');el('type').textContent='IMPORTIERTE JSON-DATEN';render();store();
      notice(Object.keys(mapped.gear).length+' Gear-Slots aus JSON-Datei importiert.','success');el('dash').scrollIntoView({behavior:'smooth'});
    }catch(e){notice('JSON-Import fehlgeschlagen: '+e.message,'error');}
  });
function importAion2FromOfficialSite() {
  const checker = 'https://kai-022.github.io/Remote-Einmannrevi/aion2-gear-checker/';
  const targetOrigin = 'https://kai-022.github.io';
  if (location.protocol !== 'https:' || location.hostname !== 'aion2.plaync.com') {
    alert('Bitte diesen Favoriten auf der offiziellen AION-2-Charakterseite benutzen.');
    return;
  }
  const m = location.pathname.match(/\/characters\/(\d+)\/([^/?#]+)/);
  const region = new URLSearchParams(location.search).get('region');
  if (!m || region !== 'eu') {
    alert('Öffne zuerst das offizielle Charakterprofil für die Region EU.');
    return;
  }
  const server = m[1];
  let characterId;
  try { characterId = decodeURIComponent(m[2]); }
  catch { alert('Charakter-ID konnte nicht gelesen werden.'); return; }
  if (!/^[a-zA-Z0-9_+\/=\-]{8,256}$/.test(characterId)) {
    alert('Unbekanntes Charakter-ID-Format.');
    return;
  }
  let dest;
  let sent = false;
  const receiver = async event => {
    if (sent || event.origin !== targetOrigin || event.source !== dest ||
        event.data?.type !== 'AION2_GEAR_READY') return;
    sent = true;
    const send = payload => dest.postMessage(payload, targetOrigin);
    const base = '/api/character/';
    const args = new URLSearchParams({
      region: 'eu', lang: 'en', characterId, serverId: server
    }).toString();
    try {
      const equipResp = await fetch(base+'equipment?'+args,{credentials:'same-origin',headers:{Accept:'application/json'}});
      if (!equipResp.ok) throw new Error('NCSOFT HTTP '+equipResp.status);
      const equipment = await equipResp.json();
      if (!equipment || typeof equipment !== 'object' || !Array.isArray(equipment.equipment?.equipmentList)) {
        throw new Error('Ausrüstungsliste fehlt in der Antwort.');
      }
      let profile = {};
      try {
        const profileResp = await fetch(base+'info?'+args,{credentials:'same-origin',headers:{Accept:'application/json'}});
        if (profileResp.ok) profile = await profileResp.json();
      } catch {}
      send({type:'AION2_GEAR_TRANSFER',version:1,serverId:server,characterId,
        profile,equipment});
    } catch (error) {
      send({type:'AION2_GEAR_ERROR',error:String(error?.message||error).slice(0,280)});
    } finally {
      window.removeEventListener('message',receiver);
    }
  };
  window.addEventListener('message',receiver);
  dest = window.open(checker+'?receive=1','aion2GearCheckerImport');
  if (!dest) {
    window.removeEventListener('message',receiver);
    alert('Das Fenster wurde blockiert. Erlaube Pop-ups für aion2.plaync.com und versuche es erneut.');
  }
}
})();