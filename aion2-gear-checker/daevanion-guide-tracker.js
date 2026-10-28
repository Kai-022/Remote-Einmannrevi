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
const stylesheet=document.createElement('style');
stylesheet.textContent=[
 '#dg-character-tracker{background:#162539;border:1px solid #998154;border-radius:12px;padding:15px;margin:12px 0 17px}',
 '#dg-character-tracker .gt-head{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:start;margin:7px 0 12px}',
 '#dg-character-tracker h3{font-size:20px;color:#f2d49e;margin:4px 0 7px}',
 '#dg-character-tracker h4{font-size:15px;color:#efd19f;margin:15px 0 10px}',
 '#dg-character-tracker p{font-size:12px;color:#c2cfdf;line-height:1.6;margin:6px 0}',
 '#dg-character-tracker .gt-percent{min-width:95px;padding:9px 11px;background:#234336;border:1px solid #6aaa84;border-radius:10px;text-align:center}',
 '#dg-character-tracker .gt-percent strong{display:block;color:#afedc7;font-size:22px;font-weight:850}',
 '#dg-character-tracker .gt-percent small{display:block;font-size:10px;color:#d1e9db}',
 '#dg-character-tracker .gt-progress{height:10px;background:#0f1927;border:1px solid #465d6e;border-radius:9px;overflow:hidden;margin:9px 0}',
 '#dg-character-tracker .gt-progress span{height:100%;display:block;background:#5dbd8e}',
 '#dg-character-tracker .gt-summary{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}',
 '#dg-character-tracker .gt-summary span{border:1px solid #53677e;border-radius:7px;padding:7px;background:#1c3046;font-size:11px;color:#cbd6e5}',
 '#dg-character-tracker .gt-summary b{color:#f3dba5;font-size:13px}',
 '#dg-character-tracker .gt-muted{font-size:11px;color:#bac9db}',
 '#dg-character-tracker .gt-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:11px 0}',
 '#dg-character-tracker .gt-toolbar button{padding:9px 11px;background:#604a2c;color:#f8e2b0;border:1px solid #c5a46b;border-radius:7px;font-size:12px;font-weight:800;cursor:pointer}',
 '#dg-character-tracker .gt-toolbar a{color:#b9daff;font-size:12px}',
 '#dg-character-tracker .gt-next{border:1px solid #977848;background:#292b25;border-radius:10px;padding:12px;margin:14px 0}',
 '#dg-character-tracker .gt-next h4{margin:0 0 10px}',
 '#dg-character-tracker .gt-action{padding:9px;background:#202d3b;border:1px solid #586b80;border-left:3px solid #edc06c;border-radius:8px;margin:7px 0}',
 '#dg-character-tracker .gt-action b{display:block;font-size:13px;color:#f2f0e8}',
 '#dg-character-tracker .gt-action small{display:block;font-size:11px;color:#c8d5e1;margin-top:5px}',
 '#dg-character-tracker details{border:1px solid #485b73;border-radius:9px;overflow:hidden;margin:9px 0;background:#17273b}',
 '#dg-character-tracker details>summary{cursor:pointer;padding:11px;color:#f0d19a;background:#223449;font-size:13px;font-weight:850}',
 '#dg-character-tracker .gt-category-items{padding:8px}',
 '#dg-character-tracker .gt-skill{display:flex;gap:11px;align-items:start;padding:10px;border:1px solid #475f74;border-radius:8px;margin:6px 0;background:#1d3044}',
 '#dg-character-tracker .gt-skill.done{border-left:4px solid #5fba88}',
 '#dg-character-tracker .gt-skill.missing{border-left:4px solid #d8ad62}',
 '#dg-character-tracker .gt-skill.unknown{border-left:4px solid #96a4ba}',
 '#dg-character-tracker .gt-skill .gt-state{flex:0 0 105px;font-size:11px;font-weight:850;color:#a7e6c3}',
 '#dg-character-tracker .gt-skill.missing .gt-state{color:#f0d293}',
 '#dg-character-tracker .gt-skill.unknown .gt-state{color:#bac7dc}',
 '#dg-character-tracker .gt-skill-main{flex:1;min-width:0}',
 '#dg-character-tracker .gt-skill-main strong{display:block;font-size:13px;color:#f4f6fb}',
 '#dg-character-tracker .gt-skill-main small{display:block;font-size:11px;line-height:1.5;margin-top:4px;color:#bfccdc}',
 '#dg-character-tracker .gt-board{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;padding:10px;margin:7px 0;background:#1a3243;border:1px solid #466178;border-radius:8px}',
 '#dg-character-tracker .gt-board strong{font-size:13px;display:block}',
 '#dg-character-tracker .gt-board small{font-size:11px;color:#c0ccdc;display:block}',
 '#dg-character-tracker .gt-board>span{font-size:13px;color:#a8eac5;font-weight:800}',
 '#dg-character-tracker .gt-mini-bar{width:100%;height:6px;background:#0d1826;border-radius:9px;overflow:hidden}',
 '#dg-character-tracker .gt-mini-bar span{background:#64bc8e;height:100%;display:block}',
 '#dg-character-tracker .gt-info,.gt-alert{padding:11px;border:1px solid #83704a;background:#2d2a23;border-radius:9px;margin:12px 0;color:#efdbb6;font-size:12px}',
 '#dg-character-tracker .gt-info strong{color:#f6dba0}',
 '#dg-character-tracker .gt-specialty,.gt-history-row{padding:9px 11px;border-top:1px solid #455b72;display:flex;align-items:start;flex-wrap:wrap;justify-content:space-between;gap:7px}',
 '#dg-character-tracker .gt-specialty strong,#dg-character-tracker .gt-history-row strong{font-size:12px}',
 '#dg-character-tracker .gt-specialty span,#dg-character-tracker .gt-history-row small{font-size:11px;color:#c5d1de}',
 '#dg-character-tracker .gt-specialty small{flex-basis:100%;color:#baabbf}',
 '#dg-character-tracker .gt-history-body{padding:9px}',
 '#dg-character-tracker .gt-note{margin-top:13px;padding-top:10px;border-top:1px solid #44576c;color:#b2c0d2;font-size:11px}',
 '#dg-character-tracker .gt-notice{font-size:12px;color:#b2e8c9}',
 '@media(max-width:580px){#dg-character-tracker{padding:11px}#dg-character-tracker .gt-head{gap:7px}#dg-character-tracker .gt-skill{flex-wrap:wrap}#dg-character-tracker .gt-skill .gt-state{flex-basis:100%}#dg-character-tracker .gt-percent{min-width:80px}}'
].join('\n');
document.head.append(stylesheet);

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