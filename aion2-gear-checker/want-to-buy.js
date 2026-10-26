/* AION 2 PvE Cleric – local Want to Buy list. No server connection. */
(()=>{
'use strict';
const DB='aion2.want-to-buy.v1';
const categories=[
{id:'all',label:'Alle Marken'}, {id:'shugo',label:'Shugo-Festival'}, {id:'nightmare',label:'Albtraum'},
{id:'season',label:'Saison'}, {id:'abyss',label:'Abgrund'}, {id:'pass',label:'Daeva-Pass'}, {id:'custom',label:'Eigene Wünsche'}
];
const base=[
{id:'sh1',cat:'shugo',item:'Daevanion-Kristalle',prio:1,why:'Dauerhafte Talent-/Daevanion-Fortschritte – hohe PvE-Priorität.',frequency:'Shop-Limits im Spiel prüfen'},
{id:'sh2',cat:'shugo',item:'Stigma-Scherben',prio:1,why:'Wichtige Stigma-Upgrades für den Kleriker.',frequency:'Shop-Limits im Spiel prüfen'},
{id:'sh3',cat:'shugo',item:'Weisheitssteine',prio:1,why:'Verbessern deine häufig genutzten Heil- und Schadensskills.',frequency:'Shop-Limits im Spiel prüfen'},
{id:'sh4',cat:'shugo',item:'Seelenkristalle / Pet-Fortschritt',prio:2,why:'Gut, wenn dir relevante Pet-Boni fehlen.',frequency:'Nach Bedarf'},
{id:'sh5',cat:'shugo',item:'Schwingen / besondere Haustiere',prio:3,why:'Sammlung oder langfristiges Ziel – erst nach wichtigen Upgrades.',frequency:'Einmalig / nach Bedarf'},
{id:'nm1',cat:'nightmare',item:'Daevanion-Kristalle',prio:1,why:'Bleibender Charakterfortschritt statt Übergangsgear.',frequency:'Shop-Limits im Spiel prüfen'},
{id:'nm2',cat:'nightmare',item:'Stigma-Scherben',prio:1,why:'Mehr Stärke für die verwendeten Stigmen.',frequency:'Nach Bedarf'},
{id:'nm3',cat:'nightmare',item:'Seelenkodex / Soul Codex',prio:2,why:'Dauerhafte Sammlungsfortschritte und Boni prüfen.',frequency:'Nach Bedarf'},
{id:'nm4',cat:'nightmare',item:'Arkana-Bücher / Runenmaterial',prio:2,why:'Je nach bestehendem Build zur nächsten Verbesserung.',frequency:'Nach Bedarf'},
{id:'nm5',cat:'nightmare',item:'Schwingen / Pantheon-Statue',prio:3,why:'Langfristiges Sammelziel nach den Kraft-Upgrades.',frequency:'Einmalig / langfristig'},
{id:'se1',cat:'season',item:'Arkana-Verbesserungsmaterial',prio:1,why:'Wenn es dein bestehendes Arkana sinnvoll verbessert.',frequency:'Saisonal / nach Bedarf'},
{id:'se2',cat:'season',item:'Seelenkodex / Soul Codex',prio:2,why:'Sammlungsfortschritt statt ersetzbarer Rüstung.',frequency:'Saisonal'},
{id:'se3',cat:'season',item:'Versteckte-Würfel-Schlüssel / Wachstumsmaterial',prio:2,why:'Gute Lückenfüller, wenn sie deiner aktuellen Progression helfen.',frequency:'Saisonal'},
{id:'se4',cat:'season',item:'Schwingen / Skins',prio:3,why:'Optional, außer ein Sammlungseffekt ist für deinen Build wichtig.',frequency:'Einmalig / saisonal'},
{id:'ab1',cat:'abyss',item:'Stigma-Scherben',prio:1,why:'PvE-relevant, auch wenn du Abgrundpunkte anderswo verdienst.',frequency:'Nach Bedarf'},
{id:'ab2',cat:'abyss',item:'Daevanion-Kristalle',prio:2,why:'Wenn das Angebot besser zu deinen verfügbaren Marken passt.',frequency:'Nach Bedarf'},
{id:'ab3',cat:'abyss',item:'Ringe / Ohrringe / Halskette',prio:2,why:'Nur bei klarem Upgrade gegenüber deinem aktuellen Gear.',frequency:'Langfristig'},
{id:'ab4',cat:'abyss',item:'PvP-Rüstung / Verbrauchsmaterial',prio:3,why:'Für reines PvE normalerweise nicht vor Stigmen und Progression.',frequency:'Optional'},
{id:'pa1',cat:'pass',item:'Besonderes Pet (z. B. Swift Lugi)',prio:2,why:'Nur wenn du dieses Pet haben möchtest oder den Sammlungsbonus brauchst.',frequency:'Einmalig'},
{id:'pa2',cat:'pass',item:'Skins / kosmetische Sets',prio:3,why:'Reine Optik – keine Priorität für PvE-Leistung.',frequency:'Einmalig'}
];
const weights={1:'Zuerst kaufen',2:'Danach',3:'Optional'};
let saved;
try{saved=JSON.parse(localStorage.getItem(DB)||'{}')}catch{saved={}}
let bought=Array.isArray(saved.bought)?saved.bought:[],custom=Array.isArray(saved.custom)?saved.custom:[],filter='all',hideBought=false;
const persist=()=>{try{localStorage.setItem(DB,JSON.stringify({bought,custom}))}catch{}};
const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[k]));
const shell=document.createElement('section');shell.id='wtb-panel';shell.className='panel';shell.style.display='none';
shell.innerHTML='<div class="eyebrow">AION 2 · EU · PVE</div>'+
 '<h2>🛒 Want to Buy – Was sollte ich kaufen?</h2>'+
 '<p>Deine Einkaufsliste für die Marken-Shops. Prioritäten für <b>Kleriker (PvE)</b>, nicht für einen PvP-Build. Du kannst Einkäufe abhaken und eigene Wünsche hinzufügen.</p>'+
 '<div class="stats" style="margin-top:12px"><div><small>Offen</small><strong id="wtb-open">0</strong></div><div><small>Gekauft</small><strong id="wtb-done">0</strong></div><div><small>Priorität 1 offen</small><strong id="wtb-top">0</strong></div></div>'+
 '<div class="grid" style="align-items:end"><div class="field"><label for="wtb-filter">Marken / Shop</label><select id="wtb-filter"></select></div>'+
 '<label style="font-size:13px;display:flex;align-items:center;gap:9px"><input id="wtb-hide" type="checkbox" style="width:auto"> Gekaufte ausblenden</label></div>'+
 '<div id="wtb-items" style="display:grid;gap:10px;margin-top:16px"></div>'+
 '<details style="margin-top:21px"><summary style="color:var(--gold);cursor:pointer;font-weight:700">+ Eigenen Wunsch hinzufügen</summary>'+
 '<div class="grid" style="margin:12px 0"><div class="field"><label for="wtb-new-name">Gegenstand</label><input id="wtb-new-name" maxlength="110" placeholder="z. B. Truhe"></div>'+
 '<div class="field"><label for="wtb-new-shop">Marken-Shop</label><select id="wtb-new-shop"></select></div>'+
 '<div class="field"><label for="wtb-new-priority">Priorität</label><select id="wtb-new-priority"><option value="1">Zuerst kaufen</option><option value="2" selected>Danach</option><option value="3">Optional</option></select></div></div>'+
 '<button type="button" class="primary" id="wtb-add">Hinzufügen</button></details>'+
 '<div class="actions" style="margin-top:20px"><button type="button" id="wtb-reset">Gekauft-Häkchen zurücksetzen</button><a class="button" target="_blank" rel="noopener noreferrer" href="https://metabot.gg/en/aion-2/shops">Shop-Angebote prüfen ↗</a></div>'+
 '<div class="tiny muted" style="margin-top:15px">Kaufpreise, verfügbare Mengen, Wochenlimits und aktuelle Shop-Bestände können sich mit Updates ändern und werden hier bewusst nicht erfunden. Prüfe sie im EU-Spielclient. Saison-Marken können verfallen. Die Liste speichert deine Häkchen nur im Browser; sie setzt sie nicht automatisch zurück.</div>';
const head=document.querySelector('header.top');
const nav=document.createElement('div');nav.className='actions';nav.style.margin='0 0 14px';
nav.innerHTML='<button type="button" id="wtb-toggle" class="primary">🛒 Want to Buy</button>';
if(head)head.insertAdjacentElement('afterend',nav);
(document.getElementById('dash')||document.getElementById('nc-official-import')||document.querySelector('.hero'))?.insertAdjacentElement('afterend',shell);
const $=id=>document.getElementById(id);
$('wtb-filter').innerHTML=categories.map(c=>'<option value="'+c.id+'">'+esc(c.label)+'</option>').join('');
$('wtb-new-shop').innerHTML=categories.filter(c=>!['all','custom'].includes(c.id)).map(c=>'<option value="'+c.id+'">'+esc(c.label)+'</option>').join('');
function render(){
 const all=[...base,...custom.filter(x=>x&&typeof x.id==='string'&&typeof x.item==='string')];
 const allDone=all.filter(x=>bought.includes(x.id));
 $('wtb-open').textContent=all.length-allDone.length;
 $('wtb-done').textContent=allDone.length;
 $('wtb-top').textContent=all.filter(x=>x.prio===1&&!bought.includes(x.id)).length;
 const visible=all.filter(x=>(filter==='all'||(filter==='custom' ? x.id.startsWith('own-') : x.cat===filter))&&(!hideBought||!bought.includes(x.id)));
 $('wtb-items').innerHTML=visible.length?visible.sort((a,b)=>a.prio-b.prio).map(x=>{
   const done=bought.includes(x.id),shop=categories.find(c=>c.id===x.cat)?.label||'Eigener Wunsch';
   return '<div class="card" style="'+(done?'opacity:.6;':'')+'"><div style="display:flex;gap:11px;align-items:flex-start">'+
    '<input type="checkbox" data-wtb-check="'+esc(x.id)+'" '+(done?'checked':'')+' aria-label="Gekauft: '+esc(x.item)+'" style="width:20px;height:20px;flex:0 0 20px;margin-top:5px">'+
    '<div style="flex:1;min-width:0"><strong style="'+(done?'text-decoration:line-through;':'')+'">'+esc(x.item)+'</strong>'+
    '<div class="tiny muted">'+esc(shop)+' · '+esc(weights[x.prio]||'Danach')+'</div>'+
    '<div class="tip">'+esc(x.why||'Eigener Wunsch')+'</div></div>'+
    (x.id.startsWith('own-')?'<button type="button" data-wtb-remove="'+esc(x.id)+'" aria-label="Wunsch löschen">✕</button>':'')+
    '</div></div>';
 }).join(''):'<div class="empty">Hier sind aktuell keine offenen Einträge.</div>';
}
$('wtb-toggle').addEventListener('click',()=>{
 const opening=shell.style.display==='none';
 shell.style.display=opening?'block':'none';
 $('wtb-toggle').textContent=opening?'✕ Want to Buy schließen':'🛒 Want to Buy';
 if(opening){render();shell.scrollIntoView({behavior:'smooth',block:'start'});}
});
$('wtb-filter').addEventListener('change',e=>{filter=e.target.value;render()});
$('wtb-hide').addEventListener('change',e=>{hideBought=e.target.checked;render()});
$('wtb-items').addEventListener('change',e=>{
 const id=e.target?.dataset?.wtbCheck;if(!id)return;
 bought=e.target.checked?[...new Set([...bought,id])]:bought.filter(x=>x!==id);
 persist();render();
});
$('wtb-items').addEventListener('click',e=>{
 const id=e.target?.closest('[data-wtb-remove]')?.dataset?.wtbRemove;
 if(!id||!confirm('Diesen eigenen Wunsch löschen?'))return;
 custom=custom.filter(x=>x.id!==id);bought=bought.filter(x=>x!==id);persist();render();
});
$('wtb-add').addEventListener('click',()=>{
 const name=$('wtb-new-name').value.trim();if(!name){$('wtb-new-name').focus();return;}
 if(custom.length>=120){alert('Maximal 120 eigene Einträge möglich.');return;}
 custom.push({id:'own-'+Date.now()+'-'+Math.round(Math.random()*100000),item:name,cat:$('wtb-new-shop').value,prio:Number($('wtb-new-priority').value),why:'Eigener Wunsch'});
 $('wtb-new-name').value='';persist();render();
});
$('wtb-reset').addEventListener('click',()=>{
 if(!confirm('Alle „Gekauft“-Häkchen zurücksetzen?'))return;bought=[];persist();render();
});
render();
})();
