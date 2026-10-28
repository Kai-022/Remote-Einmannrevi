/* Guide-linked character progress: no manual "skilled" checkboxes. All green
 * progress originates from imported NCSOFT data and is separated from guide
 * targets not exposed by those public profile records. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const board=$('aion-board-content');
const library=window.aionGuideLibrary,logic=window.AionGuideCharacterProgress,
 boardCore=window.AionGuideProgress,presets=window.AionGuidePresets;
if(!board||!library||!logic)return;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nameFor={active:'Aktive Skills',passive:'Passive Skills',stigma:'Stigmen'};
const section=document.createElement('section');
section.id='dg-character-tracker';board.before(section);
let selected='all',lastIdentity='',lastResults=null,notice='';
const DB='aion2-guide-track-v2:';
const signatureFor=g=>{
 const basis=String(g.templateId||'')+'|'+String(boardCore?.signature?.(g)||JSON.stringify(g.boards||{}));
 let hash=2166136261;
 for(let i=0;i<basis.length;i++){hash^=basis.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(36);
};
const dbKey=g=>DB+library.characterKey()+':'+g.id;
function read(g){
 try{
  const v=JSON.parse(localStorage.getItem(dbKey(g))||'{}');
  return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 }catch{return {}}
}
function recordHistory(g,result){
 if(!g||!data?.sourceRef?.sid||!data?.sourceRef?.id||!data?.importedAt||
  !String(data?.source||'').startsWith('NCSOFT'))return {history:[],recorded:false};
 const signature=signatureFor(g),prior=read(g);
 let history=prior.signature===signature&&Array.isArray(prior.history)?prior.history.filter(x=>x&&typeof x==='object'):[];
 const timestamp=Date.parse(data.importedAt);
 if(!Number.isFinite(timestamp))return {history,recorded:false};
 const last=history[history.length-1];
 const latest=last?Date.parse(last.sourceTime):NaN;
 let recorded=false;
 if(!last||timestamp>latest){
  const next=logic.snapshot(result,data.importedAt);
  const delta=last?logic.gains(last,next):{newly:[],removed:[]};
  next.newly=delta.newly;
  next.removed=delta.removed;
  next.first=!last;
  history=[...history,next].slice(-15);
  try{localStorage.setItem(dbKey(g),JSON.stringify({signature,history}));recorded=true}catch{}
 }
 return {history,recorded};
}
function dateTime(value){
 const d=new Date(String(value||''));
 return Number.isFinite(d.getTime())?d.toLocaleString('de-DE',{dateStyle:'medium',timeStyle:'short'}):'Unbekannt';
}
function line(item){
 const good=item.state==='done',missing=item.state==='missing';
 const state=good?'✓ erkannt':missing?'○ offen':'? nicht auslesbar';
 const num=item.level===null?'keine Stufe im Import':'Stufe '+item.level;
 const target=item.minimum?' · Guide-Ziel ab Stufe '+item.minimum:'';
 const boost=item.upgrade?' · weiteres Guide-Ziel: Stufe '+item.upgrade.target:'';
 return '<div class="gt-skill '+(good?'done':missing?'missing':'unknown')+'">'+
 '<span class="gt-state">'+state+'</span>'+
 '<div class="gt-skill-main"><strong>'+esc(item.name)+'</strong>'+
 '<small>Priorität '+item.rank+' · '+esc(num+target+boost)+'</small>'+
 (item.state!=='done'?'<small>'+esc(item.reason)+'</small>':'')+
 (item.why?'<small>'+esc(item.why)+'</small>':'')+
 '</div></div>';
}
function category(title,arr){
 if(!arr?.length)return '';
 const done=arr.filter(x=>x.state==='done').length,unknown=arr.filter(x=>x.state==='unknown').length;
 return '<details class="gt-category" open><summary>'+esc(title)+' · '+done+'/'+arr.length+
 (unknown?' · '+unknown+' nicht prüfbar':'')+'</summary>'+
 '<div class="gt-category-items">'+arr.map(line).join('')+'</div></details>';
}
function boardCategory(result){
 const x=result.board;
 if(!x?.total)return '';
 return '<details class="gt-category" open><summary>Daevanion-Ziele · '+x.confirmed+'/'+x.total+' erkannt</summary>'+
 '<div class="gt-category-items">'+x.boards.map(b=>{
  const pct=b.total?Math.round(b.confirmed/b.total*100):0;
  return '<div class="gt-board"><div><strong>'+esc(b.name)+'</strong><small>'+
   b.confirmed+'/'+b.total+' · '+b.missing+' noch offen'+(b.unknown?' · '+b.unknown+' nicht prüfbar':'')+
   '</small></div><span>'+pct+' %</span>'+
   '<div class="gt-mini-bar"><span style="width:'+pct+'%"></span></div></div>';
 }).join('')+'</div></details>';
}
function nextActions(result){
 const pending=result.all.filter(x=>x.state==='missing');
 const optional=result.improvements||[];
 const boardMiss=result.board?.boards?.filter(x=>x.missing>0)||[];
 const first=pending[0],optionalFirst=optional[0],firstBoard=boardMiss[0];
 let options=[];
 if(first){
  const more=first.minimum?' auf mindestens Stufe '+first.minimum:
   first.category==='stigma'?' ausrüsten':' lernen bzw. aktivieren';
  options.push('<div class="gt-action"><b>1. '+esc(first.name)+esc(more)+'</b>'+
   '<small>Aus der Prioritätenliste des Guides · '+esc(nameFor[first.category])+'</small></div>');
 }
 if(optionalFirst){
  options.push('<div class="gt-action"><b>'+esc(first?'2. ':'1. ')+esc(optionalFirst.name)+
   ' weiter auf Stufe '+optionalFirst.upgrade.target+' bringen</b>'+
   '<small>Weiterführende Ausbaustufe aus dem Guide · aktuell Stufe '+optionalFirst.level+'</small></div>');
 }
 if(firstBoard){
  options.push('<div class="gt-action"><b>'+esc(options.length+1)+'. '+esc(firstBoard.name)+
   ': '+firstBoard.missing+' Guide-Knoten fehlen</b><small>Siehe die farbigen Markierungen auf der Tafel.</small></div>');
 }
 return options.length?'<div class="gt-next"><h4>Deine nächsten Guide-Ziele</h4>'+options.join('')+'</div>':
 '<div class="gt-next"><h4>Nächster Schritt</h4><p>Die automatisch prüfbaren Grundziele stimmen mit dem Guide überein. Prüfe noch die unten genannten Spezialitäten, höheren Ausbaustufen und Board-Bilder. Das ist kein Beweis, dass dein kompletter Build fertig ist.</p></div>';
}
function recent(history){
 if(!history.length)return '<p class="gt-muted">Noch keine verifizierbare NCSOFT-Importhistorie vorhanden.</p>';
 const first=history[0],last=history[history.length-1];
 let records=history.slice(-5).reverse();
 return '<details class="gt-history"><summary>Import-Verlauf · '+history.length+' Datenstand'+(history.length===1?'':'e')+' ▾</summary>'+
 '<div class="gt-history-body"><p>Start: '+esc(dateTime(first.sourceTime))+' · Letzter Import: '+
 esc(dateTime(last.sourceTime))+'</p>'+
 records.map(x=>{
  const changes=(x.newly||[]).length;
  const removals=(x.removed||[]).length;
  return '<div class="gt-history-row"><strong>'+esc(dateTime(x.sourceTime))+'</strong>'+
   '<small>'+x.done+'/'+x.total+' Ziele bestätigt'+(x.first?' · erster Vergleich':
    ' · +'+changes+' neue erfüllte Ziele'+(removals?' · '+removals+' nicht mehr nachweisbar':''))+'</small></div>';
 }).join('')+'</div></details>';
}
function render(){
 const guide=library.current();
 if(!guide){section.style.display='none';lastIdentity='';lastResults=null;return}
 section.style.display='';
 const preset=presets?.get?.(guide.templateId)||null;
 const identity=library.characterKey()+':'+guide.id;
 if(identity!==lastIdentity){lastIdentity=identity;selected='all';notice=''}
 const result=logic.evaluate(data,preset,guide,boardCore);
 lastResults=result;
 const {history}=recordHistory(guide,result);
 const confirmed=result.confirmed,unknown=result.unknown,denominator=result.available;
 const percent=denominator?Math.round(100*confirmed/denominator):0;
 const original=guide.source&&/^https:\/\//.test(guide.source)?
  '<a href="'+esc(guide.source)+'" target="_blank" rel="noopener noreferrer">Guide-Quelle öffnen</a>':'';
 const sourceDate=preset?.sourceUpdated?' · Guide-Stand '+esc(preset.sourceUpdated):'';
 const profileDate=data?.importedAt?'Charakterdaten vom '+esc(dateTime(data.importedAt)):
  'Kein verifizierter Importzeitpunkt vorhanden';
 const ratio=denominator?confirmed+' / '+denominator:'0 / 0';
 const unknownText=unknown?' · '+unknown+' weitere Ziele nicht prüfbar':'';
 const sourceHelp=preset?.daevanion?.type==='images-only'?
  '<div class="gt-info"><strong>Daevanion-Tafeln im Guide</strong><p>Dieser Mobalytics-Guide zeigt vier Board-Beispiele als Bilder. Daraus gibt es keinen eindeutigen importierbaren Knoten-Code. Die Tafeln werden deshalb nicht künstlich als erledigt oder fehlend gewertet. Du kannst sie bei Bedarf oben einzeln in eine eigene Board-Vorlage übertragen.</p></div>':'';
 const specialties=preset?.specialties?.length?
  '<details class="gt-specialties"><summary>Skill-Spezialitäten aus dem Guide – nicht automatisch prüfbar ('+
  preset.specialties.length+') ▾</summary><p>Die öffentlichen Profilangaben enthalten nicht zuverlässig deine gewählten Spezialitäts-Optionen. Deshalb zählen diese hier weder als richtig noch als falsch.</p>'+
  preset.specialties.map(x=>'<div class="gt-specialty"><strong>'+esc(x.name)+'</strong>'+
   '<span>Guide-Optionen: '+x.choices.join(' / ')+'</span>'+
   (x.note?'<small>'+esc(x.note)+'</small>':'')+'</div>').join('')+'</details>':'';
 const sourceComplete=String(data?.source||'').startsWith('NCSOFT')&&!!data?.importedAt;
 section.innerHTML='<div class="eyebrow">CHARAKTER-FORTSCHRITT IM GUIDE</div>'+
 '<div class="gt-head"><div><h3>'+esc(guide.title)+'</h3>'+
 '<p>'+esc(data?.name||'Dein Charakter')+' · '+profileDate+sourceDate+'</p>'+
 (preset?'<p>Build: '+esc(preset.role)+' · '+esc(preset.author)+'</p>':'')+
 '</div><div class="gt-percent"><strong>'+percent+' %</strong><small>prüfbare Ziele</small></div></div>'+
 '<div class="gt-progress"><span style="width:'+percent+'%"></span></div>'+
 '<div class="gt-summary"><span><b>'+confirmed+'</b> Ziele erkannt</span>'+
 '<span><b>'+result.needed+'</b> offen</span>'+
 (unknown?'<span><b>'+unknown+'</b> nicht prüfbar</span>':'')+
 '<span><b>'+result.improvements.length+'</b> weitere Ausbaustufen</span></div>'+
 '<p class="gt-muted">Fortschritt: '+ratio+' aus den verfügbaren Charakterdaten überprüfbar'+unknownText+
 '. Keine manuellen Erledigt-Häkchen; die Anzeige wird bei einem neuen Charakterimport aktualisiert.</p>'+
 '<div class="gt-toolbar"><button type="button" data-gt-refresh>Jetzt mit Charakterdaten abgleichen</button>'+
 (original?'<span>'+original+'</span>':'')+'</div>'+
 (!sourceComplete?'<p class="gt-alert">Dieser Charakterstand wurde nicht mit einem bestätigten NCSOFT-Importzeitpunkt gespeichert. Für eine automatische Verlaufskontrolle importiere bitte deinen Charakter neu.</p>':'')+
 nextActions(result)+
 category('Aktive Fertigkeiten',result.groups?.active)+
 category('Passive Fertigkeiten',result.groups?.passive)+
 category('Stigmen – ausgerüstet',result.groups?.stigma)+
 boardCategory(result)+sourceHelp+specialties+
 recent(history)+
 '<p class="gt-note">Wichtig: Dieser Tracker bewertet nur die vom Guide belegten und öffentlich auslesbaren Ziele. Eine Fähigkeit gilt als vorhanden, sobald sie im Profil erlernt ist; ihre optimale Stufe ist nur geprüft, wenn der Guide eine konkrete Mindeststufe nennt. Spezialitäten und reine Board-Bilder erfordern einen separaten Vergleich. Neue Spielfortschritte erscheinen erst nach einem aktualisierten Profilimport.</p>'+
 '<p class="gt-notice" role="status">'+esc(notice)+'</p>';
}
section.addEventListener('click',e=>{
 if(!e.target.closest('[data-gt-refresh]'))return;
 notice='Daten erneut geprüft. Falls du im Spiel geskillt hast, importiere den aktuellen Charakterstand erneut, damit Änderungen sichtbar werden.';
 render();
});
window.addEventListener('aion2:character-imported',()=>{
 notice='Neue Charakterdaten geladen – Guide-Fortschritt neu verglichen.';
 render();
});
window.aionGuideTracker={render,getResults:()=>lastResults,getHistory:()=>{const guide=library.current();return guide?read(guide).history||[]:[]}};
render();
})();