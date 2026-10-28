/* Compare selected Daevanion guide to actual imported character nodes.
 * Visual overlay can be toggled; progress is never influenced by manual checkmarks.
 * The guide/character selection is shared with the existing Guide Tracker. */
(()=>{
'use strict';
const root=document.getElementById('aion-board-content');
const library=window.aionGuideLibrary,progress=window.AionGuideProgress,api=window.aionDaevanion;
if(!root||!library||!progress||!api)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const settingsPrefix='aion2-guide-board-overlay-v1:';
let priorIdentity='',mode='compare',lastProgress=null;
function currentGuide(){return library.current()}
function identity(){const guide=currentGuide();return guide?library.characterKey()+':'+guide.id:''}
function read(){
 const id=identity();
 if(id===priorIdentity)return;
 priorIdentity=id;mode='compare';
 if(!id)return;
 try{if(localStorage.getItem(settingsPrefix+id)==='character')mode='character'}catch{}
}
function persist(){
 const id=identity();if(!id)return;
 try{localStorage.setItem(settingsPrefix+id,mode)}catch{}
}
function measure(){
 const guide=currentGuide();
 return guide?progress.measure(library.ownBoards(),guide):null;
}
const style=document.createElement('style');
style.textContent=[
 '#dg-guide-overlay{border:1px solid #8e7953;border-radius:11px;background:#17273b;padding:13px;margin:12px 0 15px}',
 '#dg-guide-overlay h3{font-size:16px;color:#efd59f;margin:4px 0 8px}',
 '#dg-guide-overlay p{font-size:12px;color:#bdcbdc;line-height:1.5;margin:6px 0}',
 '#dg-guide-overlay .ov-heading{display:flex;align-items:center;flex-wrap:wrap;justify-content:space-between;gap:8px}',
 '#dg-guide-overlay .ov-heading strong{color:#aaf0c7;font-size:18px}',
 '#dg-guide-overlay .ov-buttons{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}',
 '#dg-guide-overlay button{cursor:pointer;background:#273a54;border:1px solid #677b92;border-radius:8px;color:#eaf0f7;font-size:12px;padding:10px 11px;font-weight:700}',
 '#dg-guide-overlay .ov-buttons button{flex:1;min-width:145px}',
 '#dg-guide-overlay .ov-buttons button[aria-pressed=true]{background:#55442a;border-color:#dfbb7d;color:#fff0ce}',
 '#dg-guide-overlay .ov-counters{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}',
 '#dg-guide-overlay .ov-counters span{border:1px solid #506880;border-radius:7px;background:#223449;padding:7px;font-size:11px;color:#c9d5e3}',
 '#dg-guide-overlay .ov-counters b{color:#f5ddae}',
 '#dg-guide-overlay .ov-bar{height:9px;border-radius:8px;background:#0e192a;border:1px solid #49627b;overflow:hidden}',
 '#dg-guide-overlay .ov-bar span{background:#60c08e;display:block;height:100%}',
 '#dg-guide-overlay .ov-boards{display:grid;grid-template-columns:repeat(auto-fit,minmax(125px,1fr));gap:7px;margin:12px 0}',
 '#dg-guide-overlay .ov-boards button{display:grid;gap:5px;text-align:left;padding:9px;background:#1b3047}',
 '#dg-guide-overlay .ov-boards button strong{font-size:12px;color:#f3d5a4}',
 '#dg-guide-overlay .ov-boards button small{font-size:11px;color:#c3d0de}',
 '#dg-guide-overlay .ov-boards button .ov-mini{height:5px;overflow:hidden;background:#0e1929;border-radius:8px}',
 '#dg-guide-overlay .ov-boards button .ov-mini i{background:#69c999;height:100%;display:block}',
 '#dg-guide-overlay .ov-info{color:#e9d1a5!important}',
 '@media(max-width:560px){#dg-guide-overlay{padding:11px}#dg-guide-overlay .ov-buttons button{font-size:11px;padding:9px}}'
].join('\n');
document.head.append(style);
const panel=document.createElement('section');panel.id='dg-guide-overlay';
root.before(panel);
const rawClassify=api.classify.bind(api),rawRender=api.render?.bind(api);
api.classify=(id,node)=>{
 read();
 const guide=currentGuide();
 if(guide&&mode==='character')return '';
 return rawClassify(id,node);
};
function render(){
 read();
 const guide=currentGuide();
 if(!guide){panel.style.display='none';lastProgress=null;return}
 panel.style.display='';
 const info=measure();lastProgress=info;
 if(!info||!info.total){
  panel.innerHTML='<h3>Guide über deinen Charakter legen</h3><p>Guide: <strong>'+esc(guide.title)+
  '</strong>. Dieser Guide hat noch keine digital übernommenen Board-Knoten. Skills und Stigmen werden im Charakter-Fortschrittstracker verglichen, soweit sie auslesbar sind. Für eine Board-Überlagerung kannst du die Guide-Tafeln oben importieren oder per Bild manuell markieren.</p>';
  return;
 }
 const percent=Math.round(info.confirmed/info.total*100);
 const cards=info.boards.map(b=>{
  const pct=b.total?Math.round(b.confirmed/b.total*100):0;
  return '<button type="button" data-ov-board="'+esc(b.id)+'" title="Board '+esc(b.name)+' ansehen">'+
   '<strong>'+esc(b.name)+'</strong><span>'+b.confirmed+' / '+b.total+' Knoten</span>'+
   '<small>'+b.missing+' offen'+(b.unknown?' · '+b.unknown+' nicht prüfbar':'')+'</small>'+
   '<span class="ov-mini"><i style="width:'+pct+'%"></i></span></button>';
 }).join('');
 panel.innerHTML='<div class="ov-heading"><h3>Guide über deine Boards legen</h3>'+
 '<strong>'+percent+' % nachgewiesen · '+info.confirmed+' / '+info.total+' Guide-Knoten</strong></div>'+
 '<p><b>'+esc(guide.title)+'</b> gegen den importierten Charakter <b>'+esc(data?.name||'Charakter')+'</b>.</p>'+
 '<div class="ov-bar" role="progressbar" aria-label="Nachgewiesene Guide-Knoten" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><span style="width:'+percent+'%"></span></div>'+
 '<div class="ov-counters"><span><b>'+info.confirmed+'</b> übereinstimmend</span>'+
 '<span><b>'+info.missing+'</b> fehlen</span>'+
 (info.unknown?'<span><b>'+info.unknown+'</b> nicht prüfbar</span>':'')+'</div>'+
 '<div class="ov-buttons" role="group" aria-label="Ansicht der Daevanion-Tafeln">'+
 '<button type="button" data-ov-mode="compare" aria-pressed="'+(mode==='compare')+'">◉ Guide über meine Boards legen</button>'+
 '<button type="button" data-ov-mode="character" aria-pressed="'+(mode==='character')+'">Nur mein Charakter</button></div>'+
 '<p>Im Vergleich: <b style="color:#8fe8b4">Grün</b> = beide haben den Knoten, '+
 '<b style="color:#f2cd8f">Gelb</b> = Guide-Knoten fehlt dir, '+
 '<b style="color:#f5a3af">Rot</b> = eigener zusätzlicher Knoten (nicht automatisch falsch).</p>'+
 '<div class="ov-boards">'+cards+'</div>'+
 (info.unknown?'<p class="ov-info">'+info.unknown+' Guide-Knoten können erst nach Import ihrer Charakter-Tafeln oder mit passenden Boardversionen verglichen werden. Diese Punkte gelten nicht als falsch geskillt.</p>':'')+
 '<p>Der Fortschritt wird ausschließlich aus den gespeicherten NCSOFT-Freischaltungen berechnet, nicht aus manuell abgehakten Schritten. Nach einem neuen Charakterimport aktualisiert sich der Vergleich.</p>';
}
panel.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-ov-mode]');
 if(toggle){
  mode=toggle.dataset.ovMode==='character'?'character':'compare';
  persist();render();window.aionBoardsRefresh?.();return;
 }
 const b=e.target.closest('[data-ov-board]');
 if(b){
  const id=b.dataset.ovBoard;
  const select=root.querySelector('[data-board="'+id+'"]');
  if(select)select.click();
 }
});
api.render=()=>{rawRender?.();render()};
window.addEventListener('aion2:character-imported',render);
window.aionGuideOverlay={render,getMode:()=>mode,getProgress:()=>lastProgress};
render();
})();