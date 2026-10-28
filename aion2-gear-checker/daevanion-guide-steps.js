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
