/* Source-specific, curated guide targets. These are not scraped from the
 * browser or guessed from board images. Source article last updated 2026-10-17:
 * https://mobalytics.gg/gamebase/guides/aion-2-cleric-condemnation-pve-build */
(()=>{
'use strict';
const sourceUrl='https://mobalytics.gg/gamebase/guides/aion-2-cleric-condemnation-pve-build';
const source={
 id:'mobalytics-cleric-condemnation-pve',
 title:'Mobalytics · Kleriker Condemnation PvE',
 sourceUrl,
 sourceUpdated:'2026-10-17',
 author:'Ulvier',
 className:'Cleric',
 role:'Condemnation PvE / Schaden mit Gruppenheilung',
 description:'Condemnation-Schaden mit Chain of Torment, Earth Punishment und begleitender Heilung.',
 active:[
  {name:'Condemnation',minLevel:12,rank:1,why:'Level 12 schaltet eine wichtige Spezialität zum Cooldown-Reset bei kritischen Treffern frei.'},
  {name:'Judgment Thunder',rank:2},
  {name:'Radiant Recovery',rank:3,optionalLevel:20,why:'Für die im Guide genannte 1/3/5-Spezialitätskombination wird Level 20 empfohlen.'},
  {name:'Chain of Torment',rank:4,why:'Voraussetzung für die Condemnation-Kombo.'},
  {name:'Healing Light',rank:5,optionalLevel:16,why:'Ab Level 16 kann die im Guide genannte Cooldown-Option gewählt werden.'},
  {name:'Debilitating Mark',rank:6},
  {name:"Earth's Retribution",rank:7},
  {name:'Bolt',rank:8},
  {name:'Divine Aura',rank:9},
  {name:'Light of Regeneration',rank:10}
 ],
 passives:[
  {name:"Empyrean Lord's Grace",rank:1},
  {name:"Earth's Grace",rank:2},
  {name:'Immortal Veil',rank:3},
  {name:'Healing Enhancement',rank:4},
  {name:'Survival Willpower',rank:5},
  {name:'Warm Benediction',rank:6},
  {name:'Radiant Benediction',rank:7}
 ],
 stigmas:[
  {name:'Noble Aura',rank:1},
  {name:'Earth Punishment',rank:2,minLevel:5,why:'Der Guide nennt Stufe 5 als entscheidenden Baustein für die Condemnation-Kombo.'},
  {name:'Prayer of Amplification',rank:3},
  {name:'Light of Protection',rank:4}
 ],
 specialties:[
  {name:'Condemnation',choices:[2,4,5]},
  {name:'Judgment Thunder',choices:[2,5]},
  {name:'Radiant Recovery',choices:[1,3,5]},
  {name:'Chain of Torment',choices:[2,4]},
  {name:'Healing Light',choices:[1,5]},
  {name:'Debilitating Mark',choices:[2,4]},
  {name:"Earth's Retribution",choices:[2,3,4],note:'Option 3 oder 4 je nach Bolt-Spielweise'},
  {name:'Bolt',choices:[2,3,4]},
  {name:'Divine Aura',choices:[3,5]},
  {name:'Light of Regeneration',choices:[4,5]}
 ],
 daevanion:{
  type:'images-only',
  note:'Der Guide enthält Bilder für Nezekan, Zikel, Vaizel und Triniel, aber keinen maschinenlesbaren Knoten-Code. Boardfortschritt nur nach separater Übernahme der Knoten vergleichen.',
  prioritizedSkills:['Condemnation','Chain of Torment']
 }
};
function match(urlText){
 let url;
 try{url=new URL(String(urlText||''))}catch{return null}
 if(url.protocol!=='https:'||url.hostname.toLowerCase()!=='mobalytics.gg'||
  url.pathname.replace(/\/$/,'')!=='/gamebase/guides/aion-2-cleric-condemnation-pve-build')return null;
 return {boards:{},format:'Mobalytics-Guide',sourceUrl,templateId:source.id,
  title:source.title};
}
window.AionGuidePresets={match,get:id=>id===source.id?source:null,knownUrls:[sourceUrl]};
})();
