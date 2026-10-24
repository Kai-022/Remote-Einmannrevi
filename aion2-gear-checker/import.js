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
  '<p>Charakternamen eingeben, passenden Server auswählen und dein Gear laden – ohne Login. Es werden ausschließlich öffentlich sichtbare Charakterdaten abgefragt.</p>'+
  '<form id="import-search-form" class="grid" style="align-items:end"><div class="field"><label for="import-name">Charaktername (mindestens 2 Zeichen)</label><input id="import-name" placeholder="Dein Charaktername" required minlength="2" maxlength="40" autocomplete="off"></div><button type="submit" class="primary" id="import-search-button">🔎 EU-Charakter suchen</button></form>'+
  '<div class="import-msg" id="import-message" role="status" aria-live="polite">Bereit für die Suche.</div>'+
  '<div id="import-results" aria-label="Gefundene Charaktere"></div>'+
  '<div id="import-summary" class="import-stats"></div>'+
  '<p class="import-quiet" style="margin-top:15px">Daten: <a href="https://aion2.plaync.com/en-us/characters/index?region=eu" target="_blank" rel="noopener noreferrer">NCSOFT</a> über die <a href="https://vi.ki/docs" target="_blank" rel="noopener noreferrer">öffentliche Vi.ki-API</a>. Wenn die API Anfragen anderer Webseiten blockiert, ist ein eigener Online-Proxy nötig.</p>'+
  '<details class="import-manual"><summary>Alternative: Charakterdaten als JSON importieren</summary><p class="import-quiet">Falls du eine JSON-Datei der öffentlichen Charakter-/Equipment-Daten hast, kannst du sie hier öffnen. Keine Logins oder Zugangsdaten verwenden.</p><input type="file" id="import-json-file" accept=".json,application/json"><button id="import-json-button" type="button" style="margin-top:10px">JSON-Daten prüfen und importieren</button></details>';
  const proxyConfig = document.createElement('div');
  proxyConfig.className='import-manual';
  proxyConfig.style.margin='14px 0';
  proxyConfig.innerHTML='<strong style="color:#e8c687">Einmalige Verbindung zum EU-Datenserver</strong>'+
   '<p class="import-quiet">Damit die Charaktersuche nicht durch Browser-Sperren blockiert wird, verbinde hier deinen eigenen Cloudflare Worker. Ein kostenloses Cloudflare-Konto genügt, auf deinem PC ist keine Installation erforderlich.</p>'+
   '<div class="grid"><div class="field"><label for="proxy-url">Worker-Adresse (https://...workers.dev)</label><input type="url" id="proxy-url" placeholder="https://aion2-gear-eu-proxy.DEIN-NAME.workers.dev" autocomplete="url"></div><div class="field" style="justify-content:end"><button type="button" id="proxy-test">Verbindung testen & speichern</button></div></div>'+
   '<details style="margin-top:10px"><summary>Cloudflare Worker ohne Installation einrichten</summary><ol class="import-quiet"><li>Öffne <a href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">Cloudflare</a> und erstelle ggf. ein kostenloses Konto.</li><li>Gehe zu <b>Workers & Pages → Create application → GitHub</b> und verbinde das Repository <b>Kai-022/Remote-Einmannrevi</b>.</li><li>Wähle <b>main</b> und als <b>Root directory</b> den Ordner <code>aion2-gear-checker</code>. Worker-Name: <code>aion2-gear-eu-proxy</code>. Deploy.</li><li>Kopiere die <code>https://...workers.dev</code>-Adresse hier hinein und klicke <b>Verbindung testen & speichern</b>.</li></ol><p class="import-quiet">Alternativ kann die Datei <a href="https://github.com/Kai-022/Remote-Einmannrevi/blob/main/aion2-gear-checker/cloudflare-worker.js" target="_blank" rel="noopener noreferrer">cloudflare-worker.js</a> im Cloudflare-Code-Editor eingefügt werden.</p></details>';
  box.insertBefore(proxyConfig,el('import-search-form')||box.querySelector('#import-search-form'));
  const currentPanel = el('charname').closest('.panel');
  currentPanel.parentNode.insertBefore(box,currentPanel);
  // Correction: label the older section as optional manual editor.
  const h = currentPanel.querySelector('h2');
  if(h)h.textContent='Manuelle Eingabe / Bearbeitung';
  const info = currentPanel.querySelector('.info');
  if(info)info.textContent='Optional: Du kannst Gear jederzeit von Hand ergänzen oder korrigieren. Der automatische EU-Import steht oben.';
  const notice = (s,kind='')=>{const p=el('import-message');p.textContent=s;p.className='import-msg '+kind;};
  const listNode=el('import-results');
  const proxyInput=el('proxy-url');
  proxyInput.value=localStorage.getItem('aion2_proxy_url')||'';
  function proxyBase() {
    let u;
    try{u=new URL(proxyInput.value.trim());}catch{throw Error('Trage zuerst die Adresse deines Cloudflare Workers ein.');}
    if(u.protocol!=='https:'||(!u.hostname.endsWith('.workers.dev')&&u.hostname!=='workers.dev'))
      throw Error('Bitte eine gültige HTTPS-Worker-Adresse (…workers.dev) eingeben.');
    if(u.pathname!=='/'&&u.pathname!=='')throw Error('Bitte die Worker-Grundadresse ohne Pfad einfügen.');
    return u.origin;
  }
  function proxyUrl(path,params={}) {
    const u=new URL(path,proxyBase());
    u.search=new URLSearchParams(params).toString();
    return u.toString();
  }
  el('proxy-test').addEventListener('click',async()=>{
    const b=el('proxy-test');b.disabled=true;
    try{
      notice('Prüfe Worker-Verbindung …');
      const response=await get(proxyUrl('/health'),12000);
      if(!response.ok)throw Error('Worker antwortet nicht korrekt.');
      const normalized=proxyBase();
      localStorage.setItem('aion2_proxy_url',normalized);proxyInput.value=normalized;
      notice('Worker verbunden und gespeichert! Du kannst jetzt EU-Charaktere suchen.','success');
    }catch(e){notice('Verbindung fehlgeschlagen: '+e.message+' – Überprüfe, ob Cloudflare den Worker veröffentlicht hat.','error');}
    finally{b.disabled=false;}
  });
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
    const name=el('import-name').value.trim();if(name.length<2){notice('Mindestens zwei Zeichen eingeben.','error');return;}
    found=[];notice('Suche EU-Charaktere …');listNode.innerHTML='';el('import-summary').innerHTML='';loading=true;el('import-search-button').disabled=true;
    try{
      try{
        const result=await get(proxyUrl('/search',{name}));
        const objects=rawMatches(result);
        if(!objects.length){notice('Keine Charaktere gefunden. Prüfe die Schreibweise und den EU-Server.','error');return;}
        found=objects.map(normalizeMatch).filter(Boolean);
        if(!found.length){notice('Die Datenquelle antwortet, aber das Suchformat ist unbekannt. Bitte die Fehlermeldung melden.','error');return;}
        activeSource='Cloudflare / Vi.ki';
      }catch(err){
        notice('Import-Suche nicht möglich: '+err.message+'. Der Worker umgeht die Browser-CORS-Sperre, aber wenn NCSOFT selbst offline ist, hilft auch der Worker nicht.','error');
        return;
      }
      listNode.innerHTML='<div class="import-quiet">'+found.length+' Treffer gefunden. Wähle deinen Charakter auf dem richtigen EU-Server:</div>'+
        found.slice(0,50).map((x,i)=>'<div class="import-result"><div><strong>'+esc(x.name)+'</strong><span>'+esc(x.server)+' · '+esc(x.cls||'Klasse nicht angegeben')+(x.level?' · Level '+esc(x.level):'')+'</span></div><button type="button" class="import-pick" data-index="'+i+'">Importieren</button></div>').join('');
      notice('Suche erfolgreich über '+activeSource+'. Wähle jetzt deinen Charakter.','success');
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
    const d=unwrap(await get(proxyUrl('/character',{server:ref.sid,id:ref.id}),22000));
    const equipment=normalizeEquipment(d).length?d:first(d,'equipment','character','profile','characterData')||d;
    if(!normalizeEquipment(equipment).length)throw Error('Die Datenquelle lieferte keine erkennbaren Ausrüstungsplätze. Möglicherweise ist das Profil derzeit nicht verfügbar.');
    return {profile:d,equipment,source:'Cloudflare / Vi.ki'};
  }

  async function addSoulBindings(ref, sourceData){
    const raw=normalizeEquipment(sourceData);
    const candidate=raw.find(x=>!parseRolls(x).length && first(x,'id','itemId')!==null && first(x,'slotPos')!==null);
    if(!candidate)return {count:0,checked:0};
    // Only query the public equipment detail; never touch client/game or account.
    const makeUrls=item=>{
      const itemId=String(first(item,'id','itemId'));
      const slotPos=String(first(item,'slotPos'));
      const ench=String(first(item,'enchantLevel')||0);
      return [['Cloudflare / Vi.ki',proxyUrl('/item',{server:ref.sid,id:ref.id,item:itemId,slot:slotPos,enchant:ench})]];
    };
    const takeDetails=rawResponse=>{
      const o=unwrap(rawResponse);
      const candidates=[o,first(o,'item'),first(o,'equipment'),first(o,'equipmentItem'),first(o,'details')].filter(Boolean);
      for(const d of candidates){const rolls=parseRolls(d);if(rolls.length)return rolls;}
      return[];
    };
    let selectedService=null,works=null;
    for(const [service,url] of makeUrls(candidate)){
      try{const r=takeDetails(await get(url,7000));if(r.length){selectedService=service;works=r;break;}}catch{}
    }
    if(!selectedService)return {count:0,checked:0};
    candidate.subStats=works;
    const remaining=raw.filter(x=>x!==candidate && !parseRolls(x).length && first(x,'id','itemId')!==null && first(x,'slotPos')!==null).slice(0,22);
    let done=1,success=1,cursor=0;
    const worker=async()=>{
      while(cursor<remaining.length){
        const item=remaining[cursor++];
        const entry=makeUrls(item).find(x=>x[0]===selectedService);
        if(!entry)continue;
        try{const r=takeDetails(await get(entry[1],7000));if(r.length){item.subStats=r;success++;}}catch{}
        done++;
      }
    };
    await Promise.all(Array.from({length:Math.min(3,remaining.length)},()=>worker()));
    return {count:success,checked:done};
  }
  async function importRef(ref) {
    if(loading)return;
    if(ref.cls && !/cleric|kleriker|치유성|治癒星/i.test(ref.cls) && !confirm('Achtung: Der ausgewählte Charakter ist laut Suche '+ref.cls+'. Die Gear-Empfehlungen dieser Webseite sind für Kleriker. Trotzdem importieren?'))return;
    if(Object.keys(data.gear||{}).length && !confirm('Die importierten Gegenstände ersetzen deine bisherigen Gear-Einträge. Fortfahren?'))return;
    loading=true;listNode.querySelectorAll('button').forEach(b=>b.disabled=true);
    notice('Lade öffentliche Ausrüstung von '+ref.name+' ('+ref.server+') …');
    try{
      const result=await getProfileAndEquipment(ref);
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
})();