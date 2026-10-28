/* EU top-Cleric evidence-only Daevanion comparison.
 * Ref: Aion2Data EU meta, 96 full NCSOFT board sets, 2026-10-28.
 * This is a majority consensus, NOT role-specific DPS proof. */
(()=>{
'use strict';
const el=id=>document.getElementById(id);
const container=el('aion-board-content');
if(!container)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const names={'71':'Nezekan','72':'Zikel','73':'Vaizel','74':'Triniel','75':'Ariel','76':'Azphel'};
const getBoards=()=>data?.characterExtras?.boards||{};
let reference=null,groups={},status='loading',failure='',audit=null;
function bitset(hex){
 if(typeof hex!=='string'||!/^(?:[a-f0-9]{2})+$/i.test(hex))throw Error('Ungültige Knotenreferenz');
 const out=new Set();
 for(let i=0;i<hex.length/2;i++){
  const byte=parseInt(hex.slice(i*2,i*2+2),16);
  for(let bit=0;bit<8;bit++)if(byte&(1<<bit))out.add(i*8+bit);
 }
 return out;
}
function validate(raw){
 if(raw?.region!=='eu'||raw?.className!=='Cleric'||raw.completeBoards<20||!raw.boards)
  throw Error('Kein verifizierter EU-Kleriker-Datensatz');
 const parsed={};
 for(const [id,board] of Object.entries(raw.boards)){
  if(!names[id])throw Error('Unbekannte Tafel');
  parsed[id]=bitset(board.bitsHex);
  if(parsed[id].size!==board.majorityCount)throw Error('Fehlerhafte Referenzknoten bei '+id);
 }
 if(Object.values(parsed).reduce((sum,s)=>sum+s.size,0)!==297)
  throw Error('Der Mehrheitsbuild ist unvollständig');
 return parsed;
}
function nameOf(n){
 return String((n.effects||[]).find(x=>/\+\s*\d+\s*$/.test(x))||n.name||n.type||'Knoten')
  .replace(/^Skill Level Up\s*-\s*/i,'').replace(/\s*\+\s*\d+\s*$/,'');
}
const cost=n=>({Common:1,Rare:2,Legend:3,Unique:4})[n?.grade]||1;
function shortest(nodes,target){
 const map=new Map();
 nodes.forEach((n,i)=>{if(n&&n.type!=='None'&&n.row>0&&n.col>0)map.set(n.row+':'+n.col,i)});
 const dist=nodes.map(n=>n?.open||n?.type==='Start'?0:Infinity),prev=nodes.map(()=>-1),visited=new Set();
 for(;;){
  let best=-1;
  for(let i=0;i<nodes.length;i++){
   if(nodes[i]?.type==='None'||visited.has(i)||!Number.isFinite(dist[i]))continue;
   if(best<0||dist[i]<dist[best])best=i;
  }
  if(best<0||best===target)break;
  visited.add(best);
  const n=nodes[best];
  for(const [dr,dc] of [[0,1],[0,-1],[1,0],[-1,0]]){
   const j=map.get((n.row+dr)+':'+(n.col+dc));
   if(j===undefined)continue;
   const d=dist[best]+(nodes[j].open?0:cost(nodes[j]));
   if(d<dist[j]){dist[j]=d;prev[j]=best;}
  }
 }
 if(!Number.isFinite(dist[target]))return null;
 let j=target,steps=0;
 while(j>=0&&!nodes[j].open&&nodes[j].type!=='Start'){steps++;j=prev[j];}
 return {points:dist[target],steps};
}
function inspect(){
 const out={matches:0,missing:[],different:[],unavailable:[],states:{},boardCounts:{},invalid:[]};
 if(!reference)return out;
 for(const [id,majority] of Object.entries(groups)){
  const list=getBoards()[id]?.nodes;
  if(!Array.isArray(list)||list.length<50){
   out.unavailable.push(names[id]+' ('+majority.size+' Mehrheitsknoten)');
   continue;
  }
  const positions=new Map();
  list.forEach((n,i)=>{if(n?.row>0&&n?.col>0)positions.set((n.row-1)*15+(n.col-1),i)});
  if([...majority].some(pos=>positions.get(pos)===undefined||list[positions.get(pos)]?.type==='None')){
   out.invalid.push(names[id]);continue;
  }
  out.states[id]={};
  const tally={good:0,missing:0,different:0,total:majority.size};
  list.forEach((n,i)=>{
   if(!n||n.type==='None'||n.type==='Start')return;
   const index=(n.row-1)*15+(n.col-1),isMajority=majority.has(index);
   const obj={board:id,index:i,name:nameOf(n),grade:n.grade};
   if(n.open&&isMajority){out.matches++;tally.good++;out.states[id][i]='good';}
   else if(!n.open&&isMajority){
    tally.missing++;out.states[id][i]='missing';
    out.missing.push({...obj,path:shortest(list,i)});
   }else if(n.open&&!isMajority){
    tally.different++;out.states[id][i]='caution';out.different.push(obj);
   }
  });
  out.boardCounts[id]=tally;
 }
 // The independent PvP board has its own currency: don't recommend it for PvE.
 const category=id=>id==='75'?0:id==='76'?2:1;
 out.missing.sort((a,b)=>category(a.board)-category(b.board)||
  (a.path?.points??Infinity)-(b.path?.points??Infinity));
 out.different.sort((a,b)=>category(a.board)-category(b.board)||a.name.localeCompare(b.name,'de'));
 return out;
}
const style=document.createElement('style');
style.textContent=[
 '#daeva-eu-compare{padding:15px;margin-bottom:16px;border:1px solid #957a4d;background:#15243a;border-radius:12px}',
 '#daeva-eu-compare h3{color:#efd19b;font-size:19px;margin:6px 0 9px}',
 '#daeva-eu-compare h4{color:#ead29f;font-size:15px;margin:18px 0 9px}',
 '#daeva-eu-compare p{color:#bfcbde;line-height:1.5;font-size:12px}',
 '#daeva-eu-compare .eu-facts{padding:12px;border-radius:9px;background:#2a2a23;border:1px solid #736342;font-size:12px;color:#f0dcb7;line-height:1.6;margin:13px 0}',
 '#daeva-eu-compare .eu-counters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0}',
 '#daeva-eu-compare .eu-counters div{padding:10px;background:#102035;border:1px solid #4a5b75;border-radius:9px}',
 '#daeva-eu-compare .eu-counters strong{font-size:22px;color:#e9ca8d;display:block}',
 '#daeva-eu-compare .eu-counters small{color:#bdcbdc;font-size:11px;display:block}',
 '#daeva-eu-compare .eu-legend{display:flex;gap:7px;flex-wrap:wrap;margin:11px 0}',
 '#daeva-eu-compare .eu-legend span{font-size:11px;border:1px solid #53647b;border-radius:7px;padding:6px}',
 '#daeva-eu-compare .eu-card{display:flex;align-items:center;gap:11px;padding:10px;background:#1c3044;border:1px solid #4c5b73;border-radius:8px;margin:7px 0}',
 '#daeva-eu-compare .eu-card>div{flex:1;min-width:0}',
 '#daeva-eu-compare .eu-card strong{display:block;font-size:13px}',
 '#daeva-eu-compare .eu-card small{display:block;font-size:11px;color:#bfcbdc;margin-top:4px}',
 '#daeva-eu-compare .eu-card button{font-size:11px;padding:8px;flex-shrink:0}',
 '#daeva-eu-compare .eu-card.difference{border-left:4px solid #e18591}',
 '#daeva-eu-compare .eu-card.need{border-left:4px solid #f0bd6b}',
 '#daeva-eu-compare details{border:1px solid #4b5d74;border-radius:8px;padding:8px;margin:8px 0}',
 '#daeva-eu-compare summary{cursor:pointer;color:#efd29c;font-size:12px;font-weight:bold}',
 '#daeva-eu-compare a{color:#bcdafa}',
 '.aion-node.audit-good{outline:2px solid #67dca6!important;outline-offset:-1px;box-shadow:inset 0 0 0 2px #39875a!important}',
 '.aion-node.audit-missing{outline:2px solid #edc36d!important;outline-offset:-1px;box-shadow:inset 0 0 0 2px #a57829!important}',
 '.aion-node.audit-caution{outline:2px solid #e98890!important;outline-offset:-1px;box-shadow:inset 0 0 0 2px #aa4a57!important}',
 '@media(max-width:600px){#daeva-eu-compare .eu-counters{gap:5px}#daeva-eu-compare .eu-counters div{padding:7px 6px}#daeva-eu-compare .eu-counters strong{font-size:19px}#daeva-eu-compare .eu-card{flex-wrap:wrap}#daeva-eu-compare .eu-card button{margin-left:auto}}'
].join('\n');
document.head.append(style);
const panel=document.createElement('section');panel.id='daeva-eu-compare';
// Render the selected board grid first; comparison details follow below.
container.after(panel);
const itemRow=(x,i,different)=>{
 const path=x.path;
 return '<div class="eu-card '+(different?'difference':'need')+'"><div><strong>'+(i+1)+'. '+
  esc(names[x.board])+' · '+esc(x.name)+'</strong><small>'+
  (different?'Von weniger als der Hälfte der Top-Spieler gewählt; kann als Verbindungs- oder Situationsknoten sinnvoll sein.':
  path?'Noch '+path.steps+' Knoten auf dem geschätzten kürzesten Pfad, ca. '+path.points+' Daevanion-Punkte.':
   'Kürzester Verbindungspfad nicht bekannt.')+
  '</small></div><button type="button" data-eu-board="'+x.board+'" data-eu-index="'+x.index+'">Auf Tafel zeigen</button></div>';
};
function render(){
 audit=inspect();
 if(status==='loading'){panel.innerHTML='<h3>EU-Top-Kleriker-Vergleich</h3><p>Lade echte Mehrheits-Knoten …</p>';return}
 if(status==='error'){panel.innerHTML='<h3>EU-Top-Kleriker-Vergleich</h3><div class="eu-facts">Kein verlässlicher Vergleich möglich: '+esc(failure)+
  '. Es werden keine Knoten nach Skillnamen eingefärbt.</div>';return}
 const when=new Date(reference.countedAt).toLocaleDateString('de-DE');
 const src='https://aion2data.com/rankings/meta/cleric/eu';
 const available=Object.keys(audit.boardCounts).length;
 const facts='<div class="eu-facts"><b>Datenquelle:</b> '+reference.completeBoards+' vollständig ausgelesene Daevanion-Tafelsätze '+
  'von EU-Top-Klerikern ('+reference.profiles+' vollständige Charakterprofile), Stand '+when+'. '+
  'Das Referenzmuster enthält 297 Knoten, die mindestens 50 % der Spieler freigeschaltet haben.'+
  '<p><b>Keine getrennte Damage-/Heiler-Statistik:</b> Das Ranking basiert auf Kampfkraft, nicht auf gemessenem PvE-Schaden.'+
  ' Daher werden keine erfundenen Damage-Empfehlungen angezeigt.</p>'+
  '<a href="'+src+'" target="_blank" rel="noopener noreferrer">Originalstatistik</a> · '+
  '<a href="'+esc(reference.sourcePlannerUrl)+'" target="_blank" rel="noopener noreferrer">Mehrheitsbuild im Planer öffnen</a></div>';
 const counts=available?'<div class="eu-counters"><div><strong>'+audit.matches+'</strong><small>Mehrheitsknoten aktiv</small></div>'+
  '<div><strong>'+audit.missing.length+'</strong><small>Mehrheitsknoten fehlen</small></div>'+
  '<div><strong>'+audit.different.length+'</strong><small>Abweichende Knoten</small></div></div>':'';
 const missingBoards=audit.unavailable.length?'<div class="eu-facts">Nicht importiert: '+esc(audit.unavailable.join(', '))+
  '. Bitte die offiziellen Boards erneut laden. Fehlende Tafeln gelten nicht als falsch geskillt.</div>':'';
 const incompatible=audit.invalid.length?'<div class="eu-facts">Unterschiedliche Boardversion bei: '+esc(audit.invalid.join(', '))+
  '. Für diese Tafeln ist der Vergleich deaktiviert.</div>':'';
 const selected=audit.missing.filter(x=>x.board!=='76');
 const details=(items,n,type)=>items.length>n?'<details><summary>Weitere '+(items.length-n)+' Knoten anzeigen</summary>'+
  items.slice(n).map((x,i)=>itemRow(x,i+n,type)).join('')+'</details>':'';
 const summary=Object.entries(audit.boardCounts).map(([id,c])=>'<span>'+esc(names[id])+': '+c.good+' / '+c.total+' aktiv</span>').join(' · ');
 panel.innerHTML='<div class="eyebrow">KLERIKER · EU-SPIELERDATEN</div>'+
  '<h3>Dein Skillbaum vs. echte Top-Spieler</h3>'+
  '<p>Jeder Punkt wird anhand seiner echten Tafelposition verglichen, nicht anhand seines Heil- oder Schadensskill-Namens.</p>'+
  facts+missingBoards+incompatible+counts+
  '<div class="eu-legend"><span style="color:#93eabb">Grün: Mehrheitsknoten aktiv</span>'+
  '<span style="color:#f7cf8e">Gelb: Mehrheitsknoten fehlt</span>'+
  '<span style="color:#f9a6ae">Rot: Abweichung (nicht automatisch falsch)</span></div>'+
  (available?'<p>'+summary+'</p>':'<p>Keine importierten Tafeln für den Vergleich verfügbar.</p>')+
  '<h4>Was dir vom Mehrheitsbuild noch fehlt</h4>'+
  '<p>Nach geschätztem kürzesten Verbindungspfad sortiert. Azphel-PvP-Knoten werden nicht als PvE-Ziele vorgeschlagen.</p>'+
  (selected.length?selected.slice(0,10).map((x,i)=>itemRow(x,i,false)).join(''):'<p>Keine fehlenden Mehrheitsknoten in den vorhandenen PvE-Tafeln.</p>')+
  details(selected,10,false)+
  '<h4>Welche deiner Punkte weichen ab?</h4>'+
  '<p><b>Abweichung bedeutet nicht Fehler.</b> Auch ein seltener Verbindungs- oder Spezialknoten kann notwendig sein. Der Mehrheitsbuild ist kein bewiesenes Optimum.</p>'+
  (audit.different.length?audit.different.slice(0,10).map((x,i)=>itemRow(x,i,true)).join(''):'<p>Keine Abweichungen in den vorhandenen Tafeln.</p>')+
  details(audit.different,10,true);
}
panel.addEventListener('click',e=>{
 const b=e.target.closest('[data-eu-board]');
 if(b)window.aionBoardSelect?.(b.dataset.euBoard,Number(b.dataset.euIndex));
});
window.aionDaevanion={
 render,
 classify:(id,node)=>{
  const nodes=getBoards()[String(id)]?.nodes;
  if(!nodes||!audit)return '';
  return audit.states[String(id)]?.[nodes.indexOf(node)]||'';
 },
 source:()=>reference?{region:reference.region,players:reference.completeBoards,countedAt:reference.countedAt}:null
};
el('aion-board-button')?.addEventListener('click',render);
fetch('./daevanion-eu-cleric-meta.json?v=1',{cache:'no-cache'})
 .then(async r=>{if(!r.ok)throw Error('HTTP '+r.status);
  const doc=await r.json(),parsed=validate(doc);reference=doc;groups=parsed;status='ready';})
 .catch(e=>{status='error';failure=String(e?.message||e);})
 .finally(()=>{render();window.aionBoardsRefresh?.();});
render();
})();