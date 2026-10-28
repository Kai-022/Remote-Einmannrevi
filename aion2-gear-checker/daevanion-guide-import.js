/* Guide-board library for AION 2 Cleric. Local per-character storage.
 * Import Aion2Data link/JSON or mark guide screenshot nodes on the own boards.
 * Reference templates NEVER alter in-game or imported character unlocks. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const grid=$('aion-board-content');
if(!grid||!window.AionGuideBoardCodec||!window.aionDaevanion)return;
const codec=window.AionGuideBoardCodec;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='aion2-daevanion-guides-v1:';
const key=()=>KEY+String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'Charakter').normalize('NFKC');
const boardNames=codec.LABELS;
let lastKey='',guideList=[],chosenId='',editing=false,manualBoard='71',message='',previewURL='',clearForm=false;
const native=window.aionDaevanion;

const sheet=document.createElement('style');
sheet.textContent=[
 '#daeva-guide-library{margin:12px 0 15px;color:#ecf1f8}',
 '#daeva-guide-library details{border:1px solid #8d744c;border-radius:10px;background:#1b293b;margin-bottom:11px;overflow:hidden}',
 '#daeva-guide-library details>summary{cursor:pointer;color:#eecf99;background:#29313c;padding:13px;font-weight:800;font-size:14px}',
 '#daeva-guide-library .dg-form{padding:13px;display:grid;gap:9px}',
 '#daeva-guide-library label{font-size:12px;font-weight:700;color:#e1c596}',
 '#daeva-guide-library textarea,#daeva-guide-library input:not([type=file]),#daeva-guide-library select{width:100%;min-width:0;background:#121e2f;border:1px solid #5e6f87;border-radius:8px;color:#eaf1f9;padding:10px;font-size:13px}',
 '#daeva-guide-library input[type=file]{width:100%;color:#dce5ef;font-size:12px}',
 '#daeva-guide-library p{color:#bfcbd9;line-height:1.5;font-size:11px;margin:3px 0}',
 '#daeva-guide-library button{border:1px solid #7d8ea5;background:#293d55;color:#f0f3fa;border-radius:8px;padding:9px 12px;cursor:pointer;font-size:12px;font-weight:700}',
 '#daeva-guide-library #dg-import-button{background:#614b2e;border-color:#d2ac72;color:#fff0cb}',
 '#daeva-guide-library .dg-toolbar{display:flex;align-items:end;flex-wrap:wrap;gap:9px;border:1px solid #52657c;background:#1a2839;border-radius:11px;padding:12px}',
 '#daeva-guide-library .dg-select{min-width:180px;flex:1;display:grid;gap:5px}',
 '#daeva-guide-library .dg-manual{padding:11px;background:#152438;border:1px solid #405b71;border-radius:10px;display:grid;gap:8px}',
 '#daeva-guide-library .dg-preview{display:grid;justify-items:start;gap:7px}',
 '#daeva-guide-library .dg-preview img{display:block;max-width:100%;max-height:340px;border:1px solid #62758a;border-radius:9px;object-fit:contain}',
 '#daeva-guide-library .dg-preview a{font-size:12px;color:#b9dcff}',
 '#daeva-guide-library .dg-edit-banner{border:1px solid #bf985b;background:#332b22;border-radius:8px;padding:11px;font-size:12px;line-height:1.5;margin:9px 0;display:flex;align-items:center;flex-wrap:wrap;gap:8px}',
 '#daeva-guide-library .dg-edit-banner button{background:#60412f;border-color:#cd967e}',
 '#daeva-guide-library #dg-message{color:#e3d7b1;min-height:17px;margin:7px 0}',
 '#daeva-guide-comparison{background:#16263a;border:1px solid #7e724f;border-radius:10px;margin:13px 0;overflow:hidden}',
 '#daeva-guide-comparison>summary{padding:14px;color:#eecf99;font-size:14px;font-weight:800;cursor:pointer;background:#29313c}',
 '#daeva-guide-comparison .dg-compare-inner{padding:13px}',
 '#daeva-guide-comparison h4{font-size:15px;color:#efd2a1;margin:15px 0 8px}',
 '#daeva-guide-comparison p{font-size:12px;color:#c4ccdb;line-height:1.5}',
 '#daeva-guide-comparison a{color:#bcdafc}',
 '#daeva-guide-comparison .dg-counters{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}',
 '#daeva-guide-comparison .dg-counters span{font-size:12px;padding:7px;border-radius:7px;background:#203a4c;border:1px solid #4d7185}',
 '#daeva-guide-comparison .dg-warning{color:#f1d89d;border:1px solid #87704a;padding:9px;border-radius:8px}',
 '#daeva-guide-comparison .dg-compare-row{display:flex;align-items:center;gap:10px;padding:10px;background:#1d3047;border:1px solid #4c5d73;border-left:4px solid #e4bf72;border-radius:8px;margin:7px 0}',
 '#daeva-guide-comparison .dg-compare-row.other{border-left-color:#d7838a}',
 '#daeva-guide-comparison .dg-compare-row>div{flex:1;min-width:0}',
 '#daeva-guide-comparison .dg-compare-row b{display:block;font-size:12px}',
 '#daeva-guide-comparison .dg-compare-row small{display:block;font-size:11px;color:#b9c9d9;margin-top:4px}',
 '#daeva-guide-comparison button{padding:7px;font-size:11px;border-radius:7px;flex-shrink:0}',
 '@media(max-width:600px){#daeva-guide-library .dg-toolbar{align-items:stretch}#daeva-guide-library .dg-select{flex-basis:100%}#daeva-guide-comparison .dg-compare-row{flex-wrap:wrap}#daeva-guide-comparison button{margin-left:auto}}'
].join('\n');
document.head.append(sheet);

function current(){return guideList.find(g=>g.id===chosenId)||null}
function sanitize(){
 guideList=guideList.filter(g=>g&&typeof g.id==='string'&&typeof g.title==='string'&&g.boards&&typeof g.boards==='object')
 .slice(0,20).map(g=>{
  const boards={};
  for(const [name,cells] of Object.entries(g.boards)){
   const id=codec.boardId(name);
   if(id&&Array.isArray(cells))boards[id]=[...new Set(cells.filter(x=>Number.isInteger(x)&&x>=0&&x<225))].sort((a,b)=>a-b);
  }
  return {id:g.id.slice(0,75),title:g.title.slice(0,90),source:String(g.source||'').slice(0,1500),format:String(g.format||'Manuell').slice(0,35),boards};
 });
}
function load(){
 const k=key();if(k===lastKey)return false;
 lastKey=k;
 clearForm=true;
 if(previewURL){try{URL.revokeObjectURL(previewURL)}catch{}previewURL='';}
 let saved={};try{saved=JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{}
 guideList=Array.isArray(saved.guides)?saved.guides:[];sanitize();
 chosenId=guideList.some(g=>g.id===saved.activeId)?saved.activeId:'';
 editing=false;message='';
 return true;
}
function persist(){
 sanitize();
 try{
  localStorage.setItem(key(),JSON.stringify({guides:guideList,activeId:chosenId}));
  return true;
 }catch{
  message='Speichern fehlgeschlagen. Prüfe den verfügbaren Browserspeicher.';
  return false;
 }
}
function newId(){return 'guide-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function put(parsed,title,source){
 load();
 if(guideList.length>=20)throw Error('Maximal 20 eigene Guides pro Charakter.');
 const g={id:newId(),title:(title||'Guide '+(guideList.length+1)).slice(0,90),source:(source||parsed.sourceUrl||'').slice(0,1500),
  format:parsed.format,boards:parsed.boards};
 guideList.push(g);chosenId=g.id;editing=false;
 if(!persist())throw Error('Der Guide konnte nicht gespeichert werden.');
 message='✓ '+g.title+' importiert. Wähle ein Board, um die Knoten zu vergleichen.';
 renderAll();redraw();
 return g;
}
function selectedPosition(node){return (Number(node.row)-1)*15+(Number(node.col)-1)}
function guideState(id,node){
 const guide=current();
 if(!guide||!node||node.type==='None'||node.type==='Start')return '';
 const cells=guide.boards[String(id)];
 if(!Array.isArray(cells)||cells.length===0)return '';
 const included=cells.includes(selectedPosition(node));
 if(included)return node.open?'good':'missing';
 return !editing&&node.open?'caution':'';
}
const toolbar=document.createElement('section');
toolbar.id='daeva-guide-library';
grid.before(toolbar);
const comparison=document.createElement('details');
comparison.id='daeva-guide-comparison';
grid.after(comparison);
function ownBoards(){return data?.characterExtras?.boards||{}}
function compare(){
 load();
 const guide=current();
 const out={good:0,missing:[],different:[],unavailable:[]};
 if(!guide)return out;
 for(const [id,cells] of Object.entries(guide.boards)){
  if(!cells.length)continue;
  const board=ownBoards()[id];
  if(!Array.isArray(board?.nodes)||board.nodes.length<50){
   out.unavailable.push(boardNames[id]+' ('+cells.length+' Knoten in der Vorlage)');continue;
  }
  const cellIndex=new Map();
  board.nodes.forEach((node,i)=>{if(node?.row&&node?.col)cellIndex.set(selectedPosition(node),i)});
  const wanted=new Set(cells);
  for(const cell of wanted){
   const idx=cellIndex.get(cell);
   if(idx===undefined||board.nodes[idx]?.type==='None'||board.nodes[idx]?.type==='Start')continue;
   const node=board.nodes[idx];
   if(node.open)out.good++;
   else out.missing.push({id,index:idx,name:node.name||node.type});
  }
  for(const [i,n] of board.nodes.entries()){
   if(!editing&&n?.open&&n.type!=='None'&&n.type!=='Start'&&!wanted.has(selectedPosition(n)))
    out.different.push({id,index:i,name:n.name||n.type});
  }
 }
 return out;
}
function renderComparison(){
 load();
 const guide=current(),eu=$('daeva-eu-fold');
 if(eu)eu.style.display=guide?'none':'';
 comparison.style.display=guide?'':'none';
 if(!guide)return;
 const stats=compare();
 const source=guide.source.startsWith('https://')?'<a target="_blank" rel="noopener noreferrer" href="'+esc(guide.source)+'">Original-Guide öffnen</a>':'';
 const textRow=(x,i,other)=>'<div class="dg-compare-row '+(other?'other':'wanted')+'">'+
  '<div><b>'+(i+1)+'. '+esc(boardNames[x.id]||x.id)+' · '+esc(x.name)+'</b>'+
  '<small>'+(other?'In deiner Skillung, aber nicht in dieser Guide-Vorlage. Kann ein sinnvoller Verbindungsweg sein.':
   'In der Guide-Vorlage markiert, bei dir noch nicht freigeschaltet.')+'</small></div>'+
  '<button type="button" data-dg-show="'+esc(x.id)+'" data-dg-index="'+x.index+'">Anzeigen</button></div>';
 const list=(xs,other)=>xs.length?
  xs.slice(0,10).map((x,i)=>textRow(x,i,other)).join('')+
  (xs.length>10?'<details><summary>Weitere '+(xs.length-10)+' anzeigen</summary>'+
   xs.slice(10).map((x,i)=>textRow(x,i+10,other)).join('')+'</details>':''):
  '<p>Keine entsprechenden Knoten in den vergleichbaren Boards.</p>';
 const title='Guide-Vergleich: '+guide.title+' · '+stats.missing.length+' fehlen';
 comparison.innerHTML='<summary>▤ '+esc(title)+' (aufklappen)</summary>'+
  '<div class="dg-compare-inner"><p><strong>Eigene Guide-Vorlage</strong> ('+esc(guide.format)+
  '). Nicht als verifiziertes EU-Top-Spielerprofil eingestuft. '+source+'</p>'+
  '<div class="dg-counters"><span>✓ '+stats.good+' Treffer</span><span>◌ '+stats.missing.length+' fehlen</span>'+
  '<span>! '+stats.different.length+' zusätzliche eigene Knoten</span></div>'+
  (stats.unavailable.length?'<p class="dg-warning">Noch nicht bei deinem Charakter importiert: '+esc(stats.unavailable.join(' · '))+'. Diese Boards werden nicht als falsch gewertet.</p>':'')+
  '<h4>In deinem Guide vorhanden, bei dir offen</h4>'+list(stats.missing,false)+
  '<h4>In deiner Skillung, aber nicht im Guide</h4>'+list(stats.different,true)+'</div>';
}
function renderToolbar(){
 load();
 const guide=current();
 const old=$('dg-import-panel'),open=!!old?.open;
 const priorName=clearForm?'':($('dg-guide-name')?.value||'');
 const priorText=clearForm?'':($('dg-guide-link')?.value||'');
 clearForm=false;
 const options=guideList.map(g=>'<option value="'+esc(g.id)+'"'+(g.id===chosenId?' selected':'')+'>'+esc(g.title)+'</option>').join('');
 const boards=codec.ORDER.map(id=>'<option value="'+id+'"'+(manualBoard===id?' selected':'')+'>'+esc(boardNames[id])+'</option>').join('');
 toolbar.innerHTML='<details id="dg-import-panel"'+(open?' open':'')+'><summary>＋ Guide-Board hinzufügen / importieren</summary>'+
 '<div class="dg-form"><label for="dg-guide-name">Name der Vorlage</label>'+
 '<input id="dg-guide-name" maxlength="90" placeholder="z. B. Kleriker PvE Guide" value="'+esc(priorName)+'">'+
 '<label for="dg-guide-link">Aion2Data-Freigabelink oder Board-JSON einfügen</label>'+
 '<textarea id="dg-guide-link" rows="3" spellcheck="false" placeholder="https://aion2data.com/daevanion/cleric?b=…">'+esc(priorText)+'</textarea>'+
 '<button type="button" id="dg-import-button">Link / Board-Daten importieren</button>'+
 '<p>Unterstützt Aion2Data-Kleriker-Freigabelinks (fünf oder sechs Tafeln) und eigene JSON-Boards mit Zellen 0–224 bzw. {row, col}. Andere Guide-Webseiten können nicht automatisch ausgelesen werden.</p>'+
 '<div class="dg-manual"><label for="dg-manual-board">Ein einzelnes Board manuell übertragen</label><select id="dg-manual-board">'+boards+'</select>'+
 '<button type="button" id="dg-manual-start">Gewähltes Board durch Antippen bearbeiten</button>'+
 '<button type="button" id="dg-import-one">Nur dieses Board aus dem Guide-Link übernehmen</button>'+
 '<p>Falls ein Guide nur ein Bild hat: Bild unten auswählen und dann die entsprechenden Knoten auf deiner Board-Grafik antippen.</p>'+
 '<label for="dg-image">Guide-Bild als Vorlage anzeigen (optional, nur auf diesem Gerät)</label>'+
 '<input id="dg-image" type="file" accept="image/png,image/jpeg,image/webp">'+
 '<div id="dg-preview" class="dg-preview">'+(previewURL?'<img alt="Deine Guide-Bildvorlage" src="'+esc(previewURL)+'"><a href="'+esc(previewURL)+'" target="_blank" rel="noopener noreferrer">Bild vergrößern</a>':'')+'</div></div></div></details>'+
 '<div class="dg-toolbar"><div class="dg-select"><label for="dg-pick">Auf dem Board anzeigen / vergleichen</label>'+
 '<select id="dg-pick"><option value="">EU-Top-Kleriker (96 Spieler)</option>'+options+'</select></div>'+
 (guide?'<button type="button" id="dg-edit-toggle">'+(editing?'✓ Bearbeitung beenden':'✎ Guide bearbeiten')+'</button>'+
 '<button type="button" id="dg-delete">Guide löschen</button>':'')+'</div>'+
 (editing?'<div class="dg-edit-banner"><b>Bearbeiten aktiv:</b> '+esc(guide?.title||'')+
  ' – Board '+esc(boardNames[manualBoard])+'. Tippe unten auf Knoten, um sie in deiner Guide-Vorlage an- oder abzuwählen. Deine echten Freischaltungen bleiben unverändert.'+
  '<button type="button" id="dg-clear-board">Dieses Guide-Board leeren</button></div>':'')+
 '<p id="dg-message" role="status">'+esc(message)+'</p>';
}
function renderAll(){renderToolbar();renderComparison()}
function redraw(){window.aionBoardsRefresh?.()}
function selectOwnBoard(id){
 const button=grid.querySelector('[data-board="'+id+'"]');
 if(button)button.click();
 else{message='Dieses eigene Board ist noch nicht importiert. Deine Guide-Vorlage ist trotzdem gespeichert.';renderToolbar();}
}
function startManual(id){
 let guide=current();
 if(!guide){
  if(guideList.length>=20){message='Maximal 20 Vorlagen pro Charakter.';renderToolbar();return}
  const title=($('dg-guide-name')?.value||'').trim()||'Eigene Board-Vorlage';
  guide={id:newId(),title,source:'',format:'Manuell',boards:{}};
  guideList.push(guide);chosenId=guide.id;
 }
 manualBoard=id;editing=true;
 if(!Array.isArray(guide.boards[id]))guide.boards[id]=[];
 persist();message='Bearbeiten aktiv. Tippe in der Tafel auf die gewünschten Knoten.';
 renderAll();selectOwnBoard(id);redraw();
}
toolbar.addEventListener('change',event=>{
 const t=event.target;
 if(t.id==='dg-pick'){
  load();chosenId=t.value;editing=false;
  persist();message=chosenId?'Guide als Vergleich ausgewählt.':'EU-Mehrheitsbuild wieder aktiv.';
  renderAll();redraw();
 }else if(t.id==='dg-manual-board'){
  manualBoard=t.value;
  if(editing&&current()){
   if(!Array.isArray(current().boards[manualBoard]))current().boards[manualBoard]=[];
   persist();renderAll();selectOwnBoard(manualBoard);redraw();
  }
 }else if(t.id==='dg-image'){
  const file=t.files?.[0];
  if(!file)return;
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)||file.size>12*1024*1024){
   message='Bitte ein PNG/JPG/WEBP bis maximal 12 MB wählen.';renderToolbar();return;
  }
  if(previewURL)URL.revokeObjectURL(previewURL);
  previewURL=URL.createObjectURL(file);
  message='Bild geöffnet. Knoten musst du über „Board bearbeiten“ selbst markieren.';
  renderToolbar();
  $('dg-import-panel').open=true;
 }
});
toolbar.addEventListener('click',event=>{
 const id=event.target.id;
 if(id==='dg-import-button'){
  const value=$('dg-guide-link')?.value||'',title=($('dg-guide-name')?.value||'').trim();
  try{const parsed=codec.parse(value);put(parsed,title);}catch(e){message=String(e.message||e);renderToolbar();$('dg-import-panel').open=true}
 }else if(id==='dg-import-one'){
  const value=$('dg-guide-link')?.value||'',boardId=$('dg-manual-board')?.value||'71';
  const title=($('dg-guide-name')?.value||'').trim()||'Guide '+boardNames[boardId];
  try{
   const parsed=codec.parse(value);
   if(!Array.isArray(parsed.boards[boardId]))throw Error('Im eingefügten Guide fehlt die Tafel '+boardNames[boardId]+'.');
   let guide=current();
   if(!guide){
    if(guideList.length>=20)throw Error('Maximal 20 eigene Guides.');
    guide={id:newId(),title,format:parsed.format,source:parsed.sourceUrl||'',boards:{}};
    guideList.push(guide);chosenId=guide.id;
   }
   guide.boards[boardId]=[...parsed.boards[boardId]];
   if(!persist())throw Error('Das Board konnte nicht gespeichert werden.');
   editing=false;manualBoard=boardId;
   message='✓ '+boardNames[boardId]+' in '+guide.title+' übernommen ('+guide.boards[boardId].length+' Knoten).';
   renderAll();selectOwnBoard(boardId);redraw();
  }catch(e){message=String(e.message||e);renderToolbar();$('dg-import-panel').open=true}
 }else if(id==='dg-manual-start'){
  startManual($('dg-manual-board')?.value||'71');
 }else if(id==='dg-edit-toggle'){
  editing=!editing;message=editing?'Knoten können jetzt direkt auf der Tafel angeklickt werden.':'Bearbeitung beendet.';
  if(editing){
   const board=$('dg-manual-board')?.value||manualBoard;manualBoard=board;
   const guide=current();if(guide&&!Array.isArray(guide.boards[board]))guide.boards[board]=[];
   persist();renderAll();selectOwnBoard(manualBoard);
  }else renderAll();
  redraw();
 }else if(id==='dg-delete'){
  const guide=current();
  if(guide&&confirm('Guide „'+guide.title+'“ aus deiner privaten Liste löschen?')){
   guideList=guideList.filter(x=>x.id!==chosenId);chosenId='';editing=false;
   persist();message='Guide gelöscht, EU-Mehrheitsbuild wieder aktiv.';renderAll();redraw();
  }
 }else if(id==='dg-clear-board'){
  const guide=current();
  if(guide&&confirm('Alle markierten Knoten von '+boardNames[manualBoard]+' aus dieser Guide-Vorlage entfernen?')){
   guide.boards[manualBoard]=[];persist();renderAll();redraw();
  }
 }
});
grid.addEventListener('click',event=>{
 if(!editing)return;
 const boardButton=event.target.closest('[data-board]');
 if(boardButton){
  manualBoard=String(boardButton.dataset.board);
  const guide=current();
  if(guide&&!Array.isArray(guide.boards[manualBoard]))guide.boards[manualBoard]=[];
  persist();renderToolbar();
  return;
 }
 const btn=event.target.closest('[data-node]');
 if(!btn)return;
 const guide=current(),board=ownBoards()[manualBoard];
 const nodes=board?.nodes;
 const node=nodes?.[Number(btn.dataset.node)];
 if(!guide||!node||node.type==='None'||node.type==='Start')return;
 event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();
 const pos=selectedPosition(node);
 if(pos<0||pos>=225)return;
 const set=new Set(guide.boards[manualBoard]||[]);
 if(set.has(pos))set.delete(pos);else set.add(pos);
 guide.boards[manualBoard]=[...set].sort((a,b)=>a-b);
 const done=persist();
 message=done?'✓ '+guide.boards[manualBoard].length+' Guide-Knoten auf '+boardNames[manualBoard]+' markiert.':'Speichern fehlgeschlagen.';
 renderAll();redraw();
},true);
comparison.addEventListener('click',event=>{
 const btn=event.target.closest('[data-dg-show]');
 if(!btn)return;
 // Switching boards is intentionally not a guide-node edit.
 const prev=editing;editing=false;
 window.aionBoardSelect?.(btn.dataset.dgShow,Number(btn.dataset.dgIndex));
 editing=prev;
});
window.aionDaevanion={
 ...native,
 classify:(id,node)=>{
  load();
  return current()?guideState(id,node):native.classify(id,node);
 },
 render:()=>{
  native.render?.();
  if(load())renderToolbar();
  renderComparison();
 }
};
$('aion-board-button')?.addEventListener('click',()=>{if(load())renderAll();else renderComparison()});
load();renderAll();redraw();
})();
