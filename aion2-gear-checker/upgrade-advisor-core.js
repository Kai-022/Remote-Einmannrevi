/* AION 2 Upgrade Advisor: deterministic suggestions from public character data.
 * No prices, drop odds, or ownership are invented. No game-client access.
 */
(function(root){
'use strict';
const REROLL={
 common:{kina:15000,reset:1},rare:{kina:45000,reset:1},
 epic:{kina:150000,reset:2},unique:{kina:300000,reset:3},
 heroic:{kina:450000,reset:5},mythic:{kina:750000,reset:10}
};
const gradeAliases={
 common:'common',normal:'common',ordinary:'common',gewöhnlich:'common',
 rare:'rare',selten:'rare',
 epic:'epic',legend:'epic',legendary:'epic',episch:'epic',
 unique:'unique',einzigartig:'unique',
 heroic:'heroic',heldenhaft:'heroic',mythic:'mythic',mythisch:'mythic'
};
const pool={
 waffe:['Damage Boost','Combat Speed','Weapon Damage Boost','Multi-hit Chance','Might','Precision','Attack','Critical Hit','Accuracy','Block','HP','MP'],
 nebenhand:['Damage Boost','Combat Speed','Weapon Damage Boost','Multi-hit Chance','Might','Precision','Attack','Critical Hit','Accuracy','Block','HP','MP'],
 helm:['Double Chance','Attack Increase','Incoming Heal','Critical Hit','Attack','HP','MP','Block','Defense','Accuracy'],
 schultern:['Critical Damage Boost','Double Chance','Defense Increase','Endurance Penetration','Critical Hit','Attack','HP','MP','Block','Defense'],
 brust:['Damage Boost','Perfect Chance','Defense Increase','Regeneration','Critical Hit','Attack','HP','MP','Block','Defense'],
 hose:['Attack Increase','Perfect Chance','Damage Tolerance','Critical Hit','Attack','HP','MP','Block','Defense'],
 handschuhe:['Combat Speed','Perfect Chance','Defense Increase','Regeneration','Critical Hit','Attack','HP','MP','Block','Defense'],
 schuhe:['Perfect Chance','Defense Increase','Regeneration','Critical Hit','Attack','HP','MP','Block','Defense','Move Speed'],
 umhang:['Double Chance','Attack Increase','Critical Hit','Attack','HP','MP','Block','Defense'],
 halskette:['Combat Speed','Might','Precision','Critical Hit','Attack','HP','MP','Block','Defense','Move Speed'],
 ohrring:['Might','Precision','Critical Hit','Attack','HP','MP','Block','Defense','Move Speed'],
 ring:['Might','Precision','Critical Hit','Attack','HP','MP','Block','Defense']
};
const preferences={
 dps:{
 waffe:['Damage Boost','Combat Speed','Weapon Damage Boost','Multi-hit Chance','Might','Precision'],
 nebenhand:['Damage Boost','Combat Speed','Weapon Damage Boost','Multi-hit Chance','Might'],
 helm:['Double Chance','Attack Increase','Critical Hit'],
 schultern:['Critical Damage Boost','Double Chance','Critical Hit'],
 brust:['Damage Boost','Perfect Chance','Attack'],
 hose:['Attack Increase','Perfect Chance','Attack'],
 handschuhe:['Combat Speed','Perfect Chance','Attack'],
 schuhe:['Perfect Chance','Attack','Move Speed'],
 umhang:['Double Chance','Attack Increase','Critical Hit'],
 halskette:['Combat Speed','Might','Precision'],
 ohrring:['Might','Precision','Critical Hit'],
 ring:['Might','Precision','Critical Hit']
 },
 heal:{
 waffe:['Combat Speed','Damage Boost','Might','Precision'],
 nebenhand:['Combat Speed','Damage Boost','Might','Precision'],
 helm:['Incoming Heal','Attack Increase','HP'],
 schultern:['Defense Increase','Double Chance','Critical Hit'],
 brust:['Defense Increase','Regeneration','Perfect Chance'],
 hose:['Damage Tolerance','Perfect Chance','HP'],
 handschuhe:['Combat Speed','Regeneration','Perfect Chance'],
 schuhe:['Defense Increase','Regeneration','Perfect Chance'],
 umhang:['Attack Increase','HP','Defense'],
 halskette:['Combat Speed','Might','Precision'],
 ohrring:['Might','Precision','HP'],
 ring:['Might','Precision','HP']
 }
};
const links={
 items:'https://aion2.gg/database/items',
 drops:'https://aion2.gg/database/drop-rates?type=Equip',
 reroll:'https://aion2.gg/tools/soul-imprint',
 costs:'https://aion2.gg/database/tables/soul-binding-costs',
 enhance:'https://aion2.gg/tools/enchant-planner',
 order:'https://aion2.gg/tools/upgrade-order',
 boards:'https://aion2.gg/database/daevanion',
 pantheon:'https://wikily.gg/aion-2/pantheon-decor'
};
const sourceHints=[
 [/ludra/i,'Abyssal Forge: Ludra'],
 [/bakarma/i,'Draupnir (Bakarma)'],
 [/vakron/i,'Vakron Sky Island'],
 [/krao/i,'Krao Cave'],
 [/kromede|fire temple/i,'Fire Temple'],
 [/urugugu/i,'Urugugu Canyon'],
 [/ferocious horn/i,'Ferocious Horn Den'],
 [/draupnir/i,'Draupnir']
];
const pantheonWeights={
 dps:{Destruction:5,Time:4,Death:3.2,Wisdom:3,Illusion:3,Freedom:2,Destiny:1.3,Justice:1,Life:1,Space:.8},
 heal:{Life:5,Time:4,Illusion:3.5,Wisdom:2.5,Freedom:2.5,Death:1.8,Destruction:1.8,Justice:1.5,Destiny:1.3,Space:1}
};
function slotGroup(value){
 const x=String(value||'').toLowerCase();
 if(x.startsWith('ohrring'))return 'ohrring';
 if(x.startsWith('ring'))return 'ring';
 for(const name of Object.keys(pool))if(x.startsWith(name))return name;
 return '';
}
function grade(value){
 const x=String(value||'').trim().toLowerCase().replace(/[^a-zäöü]/g,'');
 return gradeAliases[x]||'';
}
function statKind(raw){
 let x=String(raw||'').normalize('NFKC').toLowerCase().trim();
 x=x.replace(/(?:\s+[+]?\s*\d+(?:[.,]\d+)?\s*%?\s*)$/,'').trim();
 if(/weapon.*damage.*boost|waffenschaden/.test(x))return 'Weapon Damage Boost';
 if(/critical.*damage.*boost|kritisch.*schadensverst/.test(x))return 'Critical Damage Boost';
 if(/damage.*boost|schadensverst|damage amplification/.test(x))return 'Damage Boost';
 if(/combat.*speed|kampftempo|angriffsgeschwindigkeit/.test(x))return 'Combat Speed';
 if(/double.*chance|wucht/.test(x))return 'Double Chance';
 if(/perfect.*chance|perfektion/.test(x))return 'Perfect Chance';
 if(/multi.?hit.*chance|mehrfachtreffer/.test(x))return 'Multi-hit Chance';
 if(/incoming.*heal|erhaltene.*heilung/.test(x))return 'Incoming Heal';
 if(/damage.*tolerance|schadensresistenz/.test(x))return 'Damage Tolerance';
 if(/attack.*increase|angriffserh/.test(x))return 'Attack Increase';
 if(/defense.*increase|verteidigungserh/.test(x))return 'Defense Increase';
 if(/critical.*attack|kritischer.*angriff/.test(x))return 'Critical Attack';
 if(/critical.*hit|kritisch.*treffer/.test(x))return 'Critical Hit';
 if(/move.*speed|bewegungstempo/.test(x))return 'Move Speed';
 if(/regeneration|regenerierung/.test(x))return 'Regeneration';
 if(/endurance.*penetration|ausdauer.*durchdring/.test(x))return 'Endurance Penetration';
 if(/^might$|^macht$/.test(x))return 'Might';
 if(/^precision$|^präzision$/.test(x))return 'Precision';
 if(/^accuracy$|^genauigkeit$/.test(x))return 'Accuracy';
 if(/^attack$|^angriff$/.test(x))return 'Attack';
 if(/^defen[cs]e$|^verteidigung$/.test(x))return 'Defense';
 if(/^block$|^blocken$/.test(x))return 'Block';
 if(/^hp$|^lebenspunkte$|^lp$/.test(x))return 'HP';
 if(/^mp$|^mana$/.test(x))return 'MP';
 if(/^flight.*power$|^flugwerte$/.test(x))return 'Flight Power';
 return '';
}
function costForGrade(raw,resetPrice){
 const g=grade(raw),row=REROLL[g];
 if(!row)return null;
 const hasPrice=resetPrice!==null&&resetPrice!==undefined&&String(resetPrice).trim()!==''&&
 Number.isFinite(Number(resetPrice))&&Number(resetPrice)>=0;
 return {grade:g,kina:row.kina,reset:row.reset,
  total:hasPrice?row.kina+row.reset*Number(resetPrice):null,
  materialKnown:hasPrice};
}
function sourceHint(itemName){
 const found=sourceHints.find(x=>x[0].test(String(itemName||'')));
 return found?{name:found[1],verified:false,
  note:'Suchhinweis aus dem Gegenstandsnamen – exakte Dropquelle in der EU-Datenbank prüfen.'}:null;
}
function rollCandidate(slot,item,role,options){
 const group=slotGroup(slot);
 if(!group||!Array.isArray(item?.rolls)||!item.rolls.length)return null;
 const list=(preferences[role==='heal'?'heal':'dps'][group]||[]);
 const available=pool[group]||[];
 const existing=item.rolls.map(raw=>({raw:String(raw),kind:statKind(raw)}));
 const bad=existing.filter(x=>x.kind&&available.includes(x.kind)&&!list.slice(0,3).includes(x.kind));
 if(!bad.length)return null;
 const weak=role==='heal'?['Block','Flight Power','MP']:['Block','MP','HP','Defense','Flight Power'];
 bad.sort((a,b)=>Number(weak.includes(b.kind))-Number(weak.includes(a.kind)));
 const target=list.find(x=>available.includes(x)&&!existing.some(r=>r.kind===x))||list.find(x=>available.includes(x));
 if(!target)return null;
 const itemGrade=grade(item.importDetail?.grade);
 const lowGear=['common','rare'].includes(itemGrade);
 const cost=costForGrade(item.importDetail?.grade,options.resetPrice);
 const hint=sourceHint(item.name);
 const weakValue=bad[0];
 const priority=(group==='waffe'?80:group==='nebenhand'?70:60)+
  (weak.includes(weakValue.kind)?10:0)-(lowGear?20:0);
 const stamp=[slot,item.name,weakValue.raw,item.plus||0,item.importDetail?.grade||''].join('|');
 const action={
  id:'reroll|'+stamp,category:'gear',type:'reroll',slot,itemName:String(item.name||slot),
  title:slot+': „'+weakValue.raw+'“ überprüfen',
  summary:'Möglicher Tausch: '+weakValue.kind+' → '+target+' (sofern für dieses Item und dessen Level im Pool).',
  why:'Dieser Wert ist im gewählten '+(role==='heal'?'Heilungs-':'PvE-DPS-')+
   'Profil niedriger priorisiert. Empfehlung aus den bekannten Slot-Pools, keine garantierte Verbesserung.',
  priority,impact:group==='waffe'?'hoch':'mittel',effort:'Zufall / Materialeinsatz',
  confidence:'heuristic',cost,sourceHint:hint,
  links:[{label:'Reroll-Chancen und mögliche Werte',url:links.reroll},
   {label:'Gebühren und Materialien',url:links.costs},
   {label:'Item in EU-Datenbank suchen',url:links.items}],
  steps:[
   'Im Spiel die Seelenbindungs-Zusatzwerte dieses Gegenstands öffnen und den angezeigten Pool prüfen.',
   'Vorhandene gute Werte schützen bzw. nicht unnötig neu würfeln. Genau den schwachen Wert auswählen.',
   'Materialien, Kina und die Chance auf '+target+' prüfen – nur dann neu würfeln.'
  ],
  evidence:'Wert aus '+(options.imported?'öffentlichem Charakterprofil':'manueller Eingabe'),
  warning:lowGear?'Niedrige Seltenheit: Vor einem Reroll erst prüfen, ob du das Item bald ersetzt.':'',
  targets:list.filter(x=>available.includes(x)).slice(0,5)
 };
 return action;
}
function pantheonScore(item,role){
 const weights=pantheonWeights[role==='heal'?'heal':'dps'];
 return Object.entries(item.stats||{}).reduce((sum,[stat,val])=>sum+(weights[stat]||0)*Number(val||0),0);
}
function analyze(data,opts={}){
 const profile=data&&typeof data==='object'?data:{};
 const role=opts.role==='heal'?'heal':'dps';
 const imported=!!profile.sourceRef?.id;
 const gear=profile.gear&&typeof profile.gear==='object'?profile.gear:{};
 const level=Number(profile.characterExtras?.profile?.level||0);
 const className=String(profile.characterExtras?.profile?.className||'');
 const actions=[];
 const slots=Object.entries(gear).filter(([,v])=>v&&typeof v==='object');
 const replacementPrices=opts.replacementPrices||{};
 for(const [slot,item] of slots){
  const group=slotGroup(slot);
  if(!group)continue;
  const cand=rollCandidate(slot,item,role,{resetPrice:opts.resetPrice,imported});
  if(cand){
   const replacement=Number(replacementPrices[slot]);
   if(String(replacementPrices[slot]??'').trim()!==''&&Number.isFinite(replacement)&&replacement>0)
    cand.replacementPrice=replacement;
   actions.push(cand);
  }else if(imported&&(!Array.isArray(item.rolls)||!item.rolls.length)){
   actions.push({
    id:'check|'+slot+'|'+item.name,category:'check',type:'check',slot,
    itemName:String(item.name||slot),title:slot+': Zusatzwerte fehlen',
    summary:'Die öffentlichen Gegenstandsdetails enthalten keine auswertbaren Seelenbindungs-Zeilen.',
    why:'Ohne echte Zusatzwerte wäre jede Reroll-Empfehlung geraten.',
    priority:35,impact:'unbekannt',effort:'prüfen',confidence:'missing',cost:null,
    links:[{label:'Item in der EU-Datenbank suchen',url:links.items}],
    steps:['Profil erneut importieren.','Falls die Daten fehlen: Werte im Spiel nachsehen und manuell eintragen.'],
    evidence:'Import ohne vollständige Werte'
   });
  }
  const itemGrade=grade(item.importDetail?.grade);
  if(group==='waffe'&&['unique','heroic'].includes(itemGrade)&&
   Number.isFinite(Number(item.plus))&&Number(item.plus)<10){
   actions.push({
    id:'enhance|'+slot+'|'+item.name+'|'+item.plus,category:'gear',type:'enhance',slot,
    itemName:String(item.name||slot),title:'Waffe +'+Number(item.plus)+': Verstärkung prüfen',
    summary:'Prüfe die Kosten für den nächsten Verbesserungs-Schritt im EU-Verstärkungsrechner.',
    why:'Waffenverstärkung kann sich lohnen, aber der günstigste Schritt hängt von Erfolgschance, Materialien und deinem nächsten Gear-Wechsel ab.',
    priority:50,impact:'mittel',effort:'Kosten offen',confidence:'heuristic',cost:null,
    links:[{label:'Verstärkungsrechner öffnen',url:links.enhance},
     {label:'Upgrade-Reihenfolge vergleichen',url:links.order}],
    steps:['Prüfen, ob diese Waffe langfristig bleibt.','Im Rechner den aktuellen +'+Number(item.plus)+'-Stand und das Ziel eintragen.','Erwartete Kosten und Erfolgswahrscheinlichkeit vor dem Verstärken vergleichen.'],
    evidence:'Ausrüstung +'+Number(item.plus)+' · '+String(item.importDetail?.grade||'')
   });
  }
  if(group==='waffe'&&level>=45&&['common','rare'].includes(itemGrade)){
   const hint=sourceHint(item.name);
   actions.push({
    id:'replace|'+slot+'|'+item.name,category:'farm',type:'replace',slot,
    itemName:String(item.name||slot),title:'Waffe ersetzen statt teuer umrollen?',
    summary:'Deine aktuelle Waffe hat eine niedrige Seltenheit. Vergleiche eine verfügbare EU-Waffe für deine Klasse.',
    why:'Große Investitionen in Übergangsgear können sich gegenüber einem neuen Item weniger lohnen. Kein automatischer BiS-Nachweis.',
    priority:78,impact:'hoch',effort:'Farmzeit / Preis unbekannt',confidence:'heuristic',cost:null,
    sourceHint:hint,links:[{label:'EU-Waffen und Fundorte vergleichen',url:links.items},
      {label:'Dungeon-Drops prüfen',url:links.drops}],
    steps:['Für deine Klasse verfügbare Waffen und Item-Level vergleichen.',
     'Dropquelle oder Herstellungsrezept des Kandidaten prüfen.',
     'Erst danach entscheiden, ob ein Reroll der alten Waffe sinnvoll ist.'],
    evidence:'Waffe '+String(item.importDetail?.grade||'')+' · Charakterstufe '+level
   });
  }
 }
 const pantheon=opts.pantheon||{};
 const pieces=Array.isArray(pantheon.items)?pantheon.items:[];
 const owned=new Set(Array.isArray(pantheon.owned)?pantheon.owned:[]);
 const placed=new Set(Array.isArray(pantheon.placed)?pantheon.placed:[]);
 const hasProgress=!!pantheon.hasProgress;
 if(pieces.length){
  if(!hasProgress){
   actions.push({
    id:'pantheon|start',category:'pantheon',type:'pantheon',title:'Pantheon-Sammlung erfassen',
    summary:'Wir können deinen Besitz nicht automatisch aus dem öffentlichen Charakterprofil lesen.',
    why:'Erst nach dem Abhaken können fehlende Gemälde, Statuen und Kolosse sinnvoll empfohlen werden.',
    priority:67,impact:'unbekannt',effort:'einmalig',confidence:'manual',cost:null,
    links:[{label:'Pantheon-Katalog und Fundorte',url:links.pantheon}],
    steps:['Pantheon öffnen.','Vorhandene Dekorationen als gesammelt markieren.','Aufgestellte Stücke markieren – danach werden konkrete Lücken angezeigt.'],
    jump:'pantheon',evidence:'Sammlung bisher nicht bestätigt'
   });
  }else{
   for(const [kind,max] of [['colossus',1],['statue',4],['artwork',12]]){
    const current=pieces.filter(x=>x.kind===kind&&placed.has(x.id));
    const best=pieces.filter(x=>x.kind===kind&&!owned.has(x.id)&&!placed.has(x.id)&&x.stats&&
      x.where&&!/nicht verfügbar|removed|global.*removed|verfügbarkeit.*prüfen/i.test(x.where+' '+x.name))
      .sort((a,b)=>pantheonScore(b,role)-pantheonScore(a,role))[0];
    if(!best)continue;
    const hasRoom=current.length<max;
    const lowest=current.length?Math.min(...current.map(x=>pantheonScore(x,role))):0;
    const improvement=pantheonScore(best,role)>lowest;
    if(!hasRoom&&!improvement)continue;
    actions.push({
     id:'pantheon|'+best.id,category:'pantheon',type:'pantheon',title:(hasRoom?'Pantheon-Platz füllen: ':'Pantheon-Alternative prüfen: ')+best.name,
     summary:best.where,
     why:hasRoom?'In deiner manuell erfassten Aufstellung ist ein Platz frei.':
      'Dieses Stück hat nach der gewählten Attributgewichtung einen höheren Richtwert als eines deiner aufgestellten Stücke.',
     priority:hasRoom?65:42,impact:hasRoom?'mittel':'gering',effort:'Farmaufwand unbekannt',
     confidence:'manual',cost:null,
     links:[{label:'Pantheon-Fundorte nachschlagen',url:links.pantheon}],
     steps:['Im Pantheon-Reiter die angezeigte Quelle nachsehen.','Verfügbarkeit auf deinem EU-Server prüfen.',
      'Stück sammeln und anschließend Besitz sowie Aufstellung markieren.'],
     jump:'pantheon',evidence:'Manuell erfasste Pantheon-Aufstellung',
     itemName:best.name
    });
   }
  }
 }
 const boards=Array.isArray(profile.characterExtras?.daevanion)?profile.characterExtras.daevanion:[];
 const unfinished=boards.filter(x=>Number(x.total)>0&&Number(x.opened)<Number(x.total));
 if(unfinished.length){
  const board=unfinished.sort((a,b)=>(Number(b.total)-Number(b.opened))-(Number(a.total)-Number(a.opened)))[0];
  actions.push({
   id:'board|'+String(board.id||board.name)+'|'+String(board.opened),category:'skills',type:'board',
   title:'Daevanion: '+String(board.name||'Tafel')+' prüfen',
   summary:String(board.opened)+' / '+String(board.total)+' Knoten freigeschaltet.',
   why:'Die offizielle Profilübersicht zeigt noch gesperrte Knoten. Welche davon BiS sind, hängt von deiner Klasse und deinem Build ab.',
   priority:45,impact:'unbekannt',effort:'Kristalle / Fortschritt',confidence:'profile',cost:null,
   links:[{label:'EU-Daevanion-Datenbank',url:links.boards}],
   steps:['Daevanion-Tafel öffnen und gesperrte Knoten ansehen.','Relevante Skills für die gewählte Rolle priorisieren.',
    'Kosten und Voraussetzungen im Spiel prüfen.'],
   jump:'daevanion',evidence:'Öffentliche Profilübersicht'
  });
 }
 if(imported&&slots.length<10){
  actions.push({
   id:'import|incomplete',category:'check',type:'check',title:'Import auf Vollständigkeit prüfen',
   summary:'Nur '+slots.length+' Gear-Slots wurden geladen. Fehlende Daten bedeuten nicht, dass die Slots im Spiel leer sind.',
   why:'Ein unvollständiger Import kann falsche Empfehlungen verursachen.',
   priority:90,impact:'unbekannt',effort:'prüfen',confidence:'missing',cost:null,
   links:[],steps:['Charakter neu importieren.','Wenn weiterhin Slots fehlen, den offiziellen Charakterlink prüfen.'],
   evidence:'Öffentlicher Import'
  });
 }
 actions.sort((a,b)=>b.priority-a.priority||String(a.title).localeCompare(String(b.title),'de'));
 return {
  role,className,level,imported,importedAt:profile.importedAt||null,
  characterName:String(profile.name||'Charakter'),
  slotCount:slots.length,
  actions,links,
  meta:{costs:'EU-Clientdaten · Stand 24.10.2026',rerollMeans:'Gebühr für EINEN Versuch; Zufallserfolg nicht eingerechnet.',
   limitations:'Keine Live-Auktionspreise, keine automatische Inventar-/Pantheon-Erkennung und keine garantierte BiS-Berechnung.'}
 };
}
root.AionAdvisorCore={analyze,slotGroup,grade,statKind,costForGrade,sourceHint,links,rollCandidate,pantheonScore};
})(typeof window!=='undefined'?window:globalThis);
