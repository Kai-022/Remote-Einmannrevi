/* Step-by-step plan for a chosen Daevanion guide vs imported character boards.
 * Distinguishes imported-open from user-confirmed actions; never changes game data. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const boardEl=$('aion-board-content');
const library=window.aionGuideLibrary,core=window.AionGuideRoutePlanner;
if(!boardEl||!library||!core)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=document.createElement('section');page.id='dg-step-plan';boardEl.before(page);
const stylesheet=document.createElement('style');
stylesheet.textContent=[
 '#dg-step-plan{background:linear-gradient(145deg,#172a40,#132133);border:1px solid #8b774c;border-radius:13px;padding:15px;margin:12px 0 16px;color:#edf3fb}',
 '#dg-step-plan .dg-plan-head{display:flex;justify-content:space-between;align-items:start;gap:12px;flex-wrap:wrap}',
 '#dg-step-plan h3{margin:5px 0 7px;font-size:19px;color:#efd19f;overflow-wrap:anywhere}',
 '#dg-step-plan .dg-plan-head p{margin:0;color:#c4cfdd;font-size:12px}',
 '#dg-step-plan .dg-plan-complete{font-size:13px;font-weight:800;color:#f2d197;border:1px solid #85714e;border-radius:8px;padding:7px 9px;white-space:nowrap}',
 '#dg-step-plan .dg-plan-progress{height:9px;border-radius:9px;background:#101a27;overflow:hidden;border:1px solid #495971;margin:13px 0 10px}',
 '#dg-step-plan .dg-plan-progress span{display:block;height:100%;background:#67c89b;transition:width .2s}',
 '#dg-step-plan .dg-plan-metrics{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0 14px}',
 '#dg-step-plan .dg-plan-metrics span{background:#22354a;border:1px solid #516880;border-radius:7px;padding:7px;font-size:11px;color:#cbd8e7}',
 '#dg-step-plan .dg-plan-metrics b{color:#f2ddac;font-size:13px}',
 '#dg-step-plan .dg-plan-choices{display:grid;gap:6px;margin-bottom:12px}',
 '#dg-step-plan .dg-plan-choices label{font-size:12px;color:#e5cca0;font-weight:700}',
 '#dg-step-plan .dg-plan-choices select{width:100%;background:#132135;border:1px solid #69788d;color:#f4f6fa;border-radius:8px;padding:11px;font-size:13px}',
 '#dg-step-plan .dg-next-label{font-size:11px;letter-spacing:.04em;font-weight:850;color:#f0d499;margin:13px 0 7px}',
 '#dg-step-plan .dg-step-card{border:1px solid #536b85;background:#1c2e43;border-radius:10px;padding:11px;display:flex;align-items:flex-start;gap:10px;margin:8px 0;flex-wrap:wrap}',
 '#dg-step-plan .dg-step-card.current{border:2px solid #caa45e;background:#25303c;padding:13px}',
 '#dg-step-plan .dg-step-number{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;background:#645033;color:#ffe3a8;font-weight:850;border-radius:50%;font-size:14px}',
 '#dg-step-plan .dg-step-info{flex:1 1 190px;min-width:0}',
 '#dg-step-plan .dg-step-info strong{font-size:15px;line-height:1.35;color:#f9f5eb;display:block;overflow-wrap:anywhere}',
 '#dg-step-plan .dg-step-info small{display:block;margin-top:5px;font-size:11px;color:#c1cfdf;line-height:1.4}',
 '#dg-step-plan .dg-step-info p{font-size:12px;color:#edf0f4;line-height:1.6;margin:10px 0 0}',
 '#dg-step-plan .dg-step-actions{display:flex;flex-wrap:wrap;gap:7px;align-items:stretch}',
 '#dg-step-plan .dg-step-actions button{padding:9px 10px;border:1px solid #657e99;background:#2a415d;color:#f4f7fb;border-radius:8px;font-size:11px;font-weight:750;cursor:pointer}',
 '#dg-step-plan .dg-step-actions button.dg-done{background:#264a3c;border-color:#65ab81;color:#c9f0d3}',
 '#dg-step-plan .dg-plan-alert{padding:11px;border-radius:9px;background:#372d25;border:1px solid #947044;color:#f4dab0;font-size:12px;margin:10px 0}',
 '#dg-step-plan .dg-plan-finished{border:1px solid #528369;background:#193b30;border-radius:9px;padding:13px;color:#c2f0d5}',
 '#dg-step-plan .dg-plan-finished p{font-size:12px;color:#cde0d5}',
 '#dg-step-plan details{border:1px solid #4f637c;border-radius:9px;margin:12px 0;overflow:hidden}',
 '#dg-step-plan details>summary{cursor:pointer;list-style-position:inside;padding:12px;background:#21324a;color:#eed1a1;font-size:13px;font-weight:750}',
 '#dg-step-plan .dg-plan-list{padding:9px}',
 '#dg-step-plan .dg-confirmed{padding:10px;border-top:1px solid #465771;display:flex;justify-content:space-between;gap:7px;align-items:center;font-size:12px}',
 '#dg-step-plan .dg-confirmed button{background:#324154;color:#dde7f1;border:1px solid #71839c;padding:7px;border-radius:7px;font-size:11px}',
 '#dg-step-plan details>p{font-size:12px;color:#c5d0de;padding:0 12px}',
 '#dg-step-plan .dg-plan-disclaimer{font-size:11px;color:#b3c3d5;line-height:1.65;margin:12px 0 5px}',
 '#dg-step-plan #dg-plan-notice{color:#a9e8c5;font-size:12px;margin:7px 0 0}',
 '.aion-node.plan-next{outline:3px solid #77baff!important;outline-offset:1px!important;box-shadow:0 0 0 2px #1d2c3b,0 0 14px #61b6ffa8!important;position:relative;z-index:3}',
 '@media(max-width:650px){#dg-step-plan{padding:11px}#dg-step-plan .dg-step-actions{width:100%}#dg-step-plan .dg-step-actions button{flex:1}#dg-step-plan .dg-step-card.current{padding:10px}#dg-step-plan .dg-plan-complete{font-size:12px}}'
].join('\n');
document.head.append(stylesheet);

const prefix='aion2-daevanion-step-checks-v1:';
let selectedBoard='all',identity='',currentPlan=null,notice='',highlight=null;
function getGuide(){return library.current()}
function storageKey(g){return prefix+library.characterKey()+':'+g.id}
function read(g){
 let saved={};
 try{saved=JSON.parse(localStorage.getItem(storageKey(g))||'{}')||{}}catch{}
 const confirmed={};
 for(const [id,values] of Object.entries(saved.confirmed||{})){
  if(!core.BOARD_NAMES[id]||!Array.isArray(values))continue;
  confirmed[id]=[...new Set(values.filter(n=>Number.isInteger(n)&&n>=0&&n<225))];
 }
 return confirmed;
}
function write(g,confirmed){
 try{
  localStorage.setItem(storageKey(g),JSON.stringify({confirmed,updatedAt:new Date().toISOString()}));
  return true;
 }catch{notice='Konnte deinen Fortschritt nicht speichern. Bitte Browserspeicher prüfen.';return false;}
}
function getNode(boardId,pos){
 const nodes=library.ownBoards()?.[boardId]?.nodes||[];
 return nodes.find(n=>n&&Number(n.row)>=1&&Number(n.col)>=1&&core.cell(n)===pos);
}
function card(step,i,featured=false){
 const action=step.target?'Guide-Ziel':'Benötigter Verbindungsknoten';
 const marker=step.target?'✓':'↳';
 return '<div class="dg-step-card'+(featured?' current':'')+'">'+
 '<span class="dg-step-number">'+(i+1)+'</span>'+
 '<div class="dg-step-info"><strong>'+esc(step.boardName)+' · '+esc(step.name)+'</strong>'+
 '<small>'+esc(action)+' · Reihe '+step.row+', Spalte '+step.col+
 (step.grade?' · '+esc(step.grade):'')+'</small>'+
 '<small>'+marker+' '+esc(step.reason)+'</small>'+
 (featured?'<p>Öffne die Tafel <b>'+esc(step.boardName)+'</b>, gehe zu <b>Reihe '+step.row+', Spalte '+step.col+
 '</b> und schalte diesen Knoten frei. '+(step.target?
 'Das ist ein Punkt aus deinem importierten Guide.':'Dieser Punkt verbindet deinen bisherigen Weg mit dem Guide-Ziel <b>'+esc(step.goal)+'</b>.')+'</p>':'')+
 '</div><div class="dg-step-actions"><button type="button" data-dg-step-show="'+step.boardId+'" data-dg-step-index="'+step.index+'">Auf Tafel zeigen</button>'+
 '<button type="button" data-dg-step-done="'+step.boardId+'" data-dg-step-cell="'+step.cell+'" class="dg-done">Im Spiel geskillt ✓</button></div></div>';
}
function render(){
 const guide=getGuide();
 if(!guide){
  identity='';currentPlan=null;highlight=null;page.style.display='none';return;
 }
 page.style.display='';
 const nextIdentity=library.characterKey()+':'+guide.id;
 if(identity!==nextIdentity){identity=nextIdentity;selectedBoard='all';notice='';}
 const confirmed=read(guide);
 const plan=core.plan(library.ownBoards(),guide,confirmed);
 currentPlan=plan;
 const boardOptions=plan.boards.map(b=>'<option value="'+b.id+'"'+(selectedBoard===b.id?' selected':'')+'>'+
 esc(b.name)+' ('+(b.steps.length?'noch '+b.steps.length+' Schritte':b.unavailable?'Daten fehlen':'fertig')+')</option>').join('');
 const filtered=selectedBoard==='all'?plan.steps:plan.steps.filter(s=>s.boardId===selectedBoard);
 highlight=filtered[0]||null;
 const tally=plan.totals;
 const progress=tally.open+tally.confirmed;
 const percent=tally.target?Math.round(100*progress/tally.target):100;
 const missingBoards=plan.boards.filter(b=>b.unavailable);
 const warnings=plan.warnings.length?'<details class="dg-plan-notes"><summary>Hinweise zu nicht berechenbaren Wegen und fehlenden Tafeln ('+
 plan.warnings.length+')</summary><ul>'+plan.warnings.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></details>':'';
 const checked=[];
 for(const [id,ids] of Object.entries(confirmed)){
  for(const pos of ids){
   const n=getNode(id,pos);
   if(n?.open)continue;
   checked.push({id,pos,name:n?core.label(n):'Knoten '+pos});
  }
 }
 const previousAll=$('dg-plan-all')?.open||false,previousDone=$('dg-plan-checks')?.open||false;
 const list=filtered.length?filtered.map((x,i)=>card(x,i,false)).join(''):
  '<p>Auf diesem Board sind keine weiteren Schritte nötig'+(missingBoards.some(b=>b.id===selectedBoard)?' – zunächst muss die Charakter-Tafel importiert werden':'')+'.</p>';
 page.innerHTML='<div class="dg-plan-head"><div><div class="eyebrow">DEIN PERSÖNLICHER SKILLFAHRPLAN</div>'+
 '<h3>Schritt für Schritt: '+esc(guide.title)+'</h3>'+
 '<p>Automatisch mit '+esc(data?.name||'deinem Charakter')+' und seinen aktuell importierten Knoten verglichen.</p></div>'+
 '<span class="dg-plan-complete">'+progress+' / '+tally.target+' Guide-Knoten</span></div>'+
 '<div class="dg-plan-progress" role="progressbar" aria-label="Guide-Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><span style="width:'+percent+'%"></span></div>'+
 '<div class="dg-plan-metrics"><span><b>'+tally.open+'</b> aus Charakter erkannt</span>'+
 '<span><b>'+tally.confirmed+'</b> manuell bestätigt</span>'+
 '<span><b>'+tally.pending+'</b> Guide-Ziele offen</span>'+
 (tally.unavailable?'<span><b>'+tally.unavailable+'</b> noch nicht vergleichbar</span>':'')+'</div>'+
 '<div class="dg-plan-choices"><label for="dg-plan-board">Für welches Board möchtest du die Schritte sehen?</label>'+
 '<select id="dg-plan-board"><option value="all"'+(selectedBoard==='all'?' selected':'')+'>Alle importierten Boards nacheinander</option>'+boardOptions+'</select></div>'+
 (library.isEditing()?'<div class="dg-plan-alert">Du bearbeitest gerade die Guide-Vorlage. Beende „Guide bearbeiten“, bevor du Schritte als im Spiel geskillt markierst.</div>':'')+
 (missingBoards.length?'<div class="dg-plan-alert">Es fehlen Charakterdaten für '+missingBoards.map(b=>esc(b.name)).join(', ')+
 '. Diese Guide-Knoten werden nicht als erledigt gewertet. Bitte den Charakter bzw. seine Daevanion-Boards erneut importieren.</div>':'')+
 (filtered.length?'<div class="dg-next-label">DEIN NÄCHSTER SCHRITT · '+filtered.length+' offene Aktionen'+
 (selectedBoard==='all'?' insgesamt':' auf '+esc(core.BOARD_NAMES[selectedBoard]))+'</div>'+
 card(filtered[0],0,true):
 '<div class="dg-plan-finished"><strong>✓ Keine weiteren Schritte auf dieser Auswahl.</strong>'+
 '<p>Wenn du Punkte gerade im Spiel gesetzt hast, kannst du für einen verifizierten Stand den Charakter erneut importieren.</p></div>')+
 '<details id="dg-plan-all"'+(previousAll?' open':'')+'><summary>Alle '+filtered.length+' Schritte in Reihenfolge anzeigen ▾</summary>'+
 '<div class="dg-plan-list">'+list+'</div></details>'+
 (checked.length?'<details id="dg-plan-checks"'+(previousDone?' open':'')+'><summary>Manuell bestätigte Schritte ('+checked.length+') ▾</summary>'+
 '<p>Diese Häkchen stammen von dir, nicht aus dem offiziellen Charakterimport. Du kannst eine Bestätigung zurücknehmen.</p>'+
 checked.map(x=>'<div class="dg-confirmed"><span>'+esc(core.BOARD_NAMES[x.id])+' · '+esc(x.name)+'</span>'+
 '<button type="button" data-dg-step-undo="'+x.id+'" data-dg-step-cell="'+x.pos+'">Zurücknehmen</button></div>').join('')+
 '</details>':'')+
 warnings+
 '<p class="dg-plan-disclaimer">Der Ablauf folgt den Knoten aus deinem Guide und sucht kurze Wege über benachbarte Felder. Die Verbindungen sind eine <b>Planungshilfe</b>, keine bestätigte Freischaltregel oder Kostenberechnung des Spiels. „Im Spiel geskillt“ ist eine manuelle Notiz und ändert keine Charakterdaten. Erst ein neuer NCSOFT-Import bestätigt deinen tatsächlichen Stand.</p>'+
 '<p id="dg-plan-notice" role="status">'+esc(notice)+'</p>';
}
page.addEventListener('change',e=>{
 if(e.target.id==='dg-plan-board'){
  selectedBoard=e.target.value;notice='';render();window.aionBoardsRefresh?.();
 }
});
page.addEventListener('click',e=>{
 const shown=e.target.closest('[data-dg-step-show]');
 if(shown){
  if(library.isEditing()){notice='Guide-Bearbeitung erst abschließen, um den Schritt im Board zu öffnen.';render();return;}
  library.showNode(shown.dataset.dgStepShow,Number(shown.dataset.dgStepIndex));return;
 }
 const done=e.target.closest('[data-dg-step-done]'),undo=e.target.closest('[data-dg-step-undo]');
 const button=done||undo;
 if(!button)return;
 const guide=getGuide();
 if(!guide)return;
 if(library.isEditing()){notice='Guide-Bearbeitung bitte vorher beenden.';render();return;}
 const board=String(button.dataset.dgStepDone||button.dataset.dgStepUndo);
 const pos=Number(button.dataset.dgStepCell);
 const confirmed=read(guide),set=new Set(confirmed[board]||[]);
 if(done)set.add(pos);else set.delete(pos);
 confirmed[board]=[...set].sort((a,b)=>a-b);
 if(write(guide,confirmed)){
  notice=done?'✓ Als im Spiel erledigt notiert. Der nächste Schritt wurde berechnet.':
   'Die manuelle Bestätigung wurde zurückgenommen.';
 }
 render();window.aionBoardsRefresh?.();
});
window.aionGuideSteps={
 render,
 isNext:(id,node)=>!!highlight&&String(id)===highlight.boardId&&core.cell(node)===highlight.cell,
 getPlan:()=>currentPlan
};
render();
})();
