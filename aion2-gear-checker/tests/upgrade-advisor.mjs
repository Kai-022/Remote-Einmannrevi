// Offline tests: AION 2 EU Gear Advisor must not invent drops, ownership or prices.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const code=await readFile(new URL('../upgrade-advisor-core.js',import.meta.url),'utf8');
const context={};
vm.runInNewContext(code,context,{timeout:3000});
const core=context.AionAdvisorCore;
assert(core?.analyze,'core must expose analyze');
assert.equal(core.grade('Unique'),'unique');
assert.equal(core.grade('Epic'),'epic');
assert.equal(core.statKind('MP +92'),'MP');
assert.equal(core.statKind('Damage Boost 6.8%'),'Damage Boost');
assert.equal(core.statKind('Weapon Damage Boost 6.8%'),'Weapon Damage Boost');
assert.equal(core.statKind('Combat Speed 3,1 %'),'Combat Speed');
assert.equal(core.statKind('Critical Damage Boost +3.2%'),'Critical Damage Boost');
assert.equal(core.statKind('Back Attack +12'),'','unsupported substat must not be confused with Attack');
assert.equal(core.slotGroup('Ring 1'),'ring');
assert.equal(core.slotGroup('Arkana 3'),'');
assert.equal(core.costForGrade('Unique','').total,null,'unknown reset price must remain unknown');
assert.equal(core.costForGrade('Unique',20000).total,360000);
assert.equal(core.costForGrade('Unique',20000).reset,3);
assert.equal(core.costForGrade('Epic',10000).total,170000);
assert.equal(core.costForGrade('Mystery',0),null);

const profile={
 name:'EU-Beispiel',sourceRef:{sid:'1305',id:'test-profile'},
 importedAt:'2026-10-26T11:00:00Z',
 gear:{
  Waffe:{name:"Ludra's Fatal Mace",plus:5,rolls:['MP +92','Block +59','Damage Boost 6.8%'],
   importDetail:{grade:'Unique'}},
  Helm:{name:'Helm',plus:10,rolls:['Incoming Heal 5%','HP 100'],
   importDetail:{grade:'Epic'}},
  'Ring 1':{name:'Ring',plus:8,rolls:[],importDetail:{grade:'Unique'}},
  'Arkana 1':{name:'Arcana',plus:1,rolls:['MP +80'],importDetail:{grade:'Unique'}}
 },
 characterExtras:{profile:{className:'Cleric',level:45},
  daevanion:[{name:'Tafel der Heilung',id:'10',opened:40,total:225}]}
};
const pantheon=[
 {id:'p1',kind:'artwork',name:'Gartua',stats:{Wisdom:5,Illusion:5},where:'Gartua'},
 {id:'p2',kind:'statue',name:'Bakarma',stats:{Death:12},where:'Draupnir'},
 {id:'p3',kind:'colossus',name:'Nahma',stats:{Destruction:55},where:'Weltboss'},
 {id:'p4',kind:'artwork',name:'Unbekannt',stats:null,where:'?' }
];
let r=core.analyze(profile,{role:'dps',resetPrice:20000,
 replacementPrices:{Waffe:330000},pantheon:{items:pantheon,hasProgress:false}});
assert.equal(r.imported,true);
assert.equal(r.slotCount,4);
const weapon=r.actions.find(x=>x.type==='reroll'&&x.slot==='Waffe');
assert(weapon,'weak weapon roll should yield recommendation');
assert(weapon.title.includes('MP'),'bad roll should be identified');
assert(weapon.summary.includes('Combat Speed'),'possible better stat should be suggested');
assert.equal(weapon.cost.total,360000);
assert.equal(weapon.replacementPrice,330000);
assert(weapon.sourceHint&&!weapon.sourceHint.verified,'source name hint must not be marked verified');
assert(!r.actions.some(x=>x.type==='reroll'&&x.slot==='Arkana 1'),'no unsupported Arcana rerolls');
assert(r.actions.some(x=>x.type==='enhance'&&x.slot==='Waffe'));
assert(r.actions.some(x=>x.type==='check'&&x.slot==='Ring 1'));
assert(r.actions.some(x=>x.id==='pantheon|start'),'untracked collection must be marked as unknown');
assert(r.actions.some(x=>x.type==='board'),'incomplete boards should appear');
assert(r.actions.every(x=>x.links.every(l=>l.url.startsWith('https://'))));
assert(!r.actions.some(x=>/guaranteed|100% sicher/i.test(x.why||'')));
r=core.analyze(profile,{role:'dps',pantheon:{items:pantheon,hasProgress:true,owned:['p1'],placed:['p1']}});
assert(!r.actions.some(x=>x.id==='pantheon|start'));
assert(r.actions.some(x=>x.id==='pantheon|p2'),'known missing statue should be suggested');
assert(r.actions.some(x=>x.id==='pantheon|p3'),'known missing colossus should be suggested');
const heal=core.analyze(profile,{role:'heal',pantheon:{items:[]}});
assert.equal(heal.role,'heal');
const missing=core.analyze({name:'No profile',gear:{}},{pantheon:{items:[]}});
assert.equal(missing.actions.length,0,'no data should produce no fake upgrade claims');
const unknown=core.analyze({gear:{Waffe:{name:'Unbekannt',rolls:['Something new +5'],
 importDetail:{grade:'Unique'}}}},{pantheon:{items:[]}});
assert(!unknown.actions.some(x=>x.type==='reroll'),'unknown stats must not be called bad');
console.log('Gear Advisor tests passed: actual rolls, prices, unknowns, Pantheon, Daevanion, EU sources.');
