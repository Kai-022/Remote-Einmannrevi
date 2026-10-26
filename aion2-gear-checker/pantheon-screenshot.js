(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const host=$('tab-pantheon');if(!host)return;
const box=document.createElement('section');box.id='pan-screenshot';box.className='panel';
box.innerHTML='<div class="eyebrow">BETA · LOKALE BILDERKENNUNG</div><h2>📷 Pantheon-Screenshot einlesen</h2>'+
'<p>Screenshot hochladen, Raster ausschneiden und Items zuordnen. Die Verarbeitung erfolgt lokal im Browser. Weil viele Original-Icons noch fehlen, musst du unsichere Treffer auswählen und bestätigen.</p>'+
'<input type="file" id="psc-upload" accept="image/png,image/jpeg,image/webp">'+
'<div class="grid" style="margin:12px 0">'+
'<div class="field"><label>Start X (Pixel)</label><input id="psc-x" type="number" value="83"></div>'+
'<div class="field"><label>Start Y (Pixel)</label><input id="psc-y" type="number" value="104"></div>'+
'<div class="field"><label>Kachelgröße</label><input id="psc-size" type="number" value="86"></div>'+
'<div class="field"><label>Abstand</label><input id="psc-gap" type="number" value="6"></div>'+
'<div class="field"><label>Spalten</label><input id="psc-cols" type="number" value="4"></div>'+
'<div class="field"><label>Reihen</label><input id="psc-rows" type="number" value="6"></div></div>'+
'<p class="tip">Für dein Beispielbild sind Position und Raster vorbelegt. Wenn du einen anderen Ausschnitt hochlädst, kannst du sie anpassen.</p>'+
'<div class="actions"><button id="psc-scan" type="button" class="primary">Screenshot auswerten</button>'+
'<button id="psc-save" type="button" disabled>Bestätigte Items übernehmen</button></div>'+
'<p id="psc-note" role="status" aria-live="polite"></p>'+
'<div id="psc-result" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:10px"></div>'+
'<p class="tip">„E“-Markierungen sind aktuell nicht zuverlässig automatisch erkennbar. Markiere „aufgestellt“ nur bei Items, bei denen du es im Spiel bestätigen kannst.</p>';
const anchor=$('pan-summary');if(anchor)anchor.before(box);else host.append(box);
let picture=null,imageUrl='',catalog=[],references=[];
const val=id=>Number($(id).value);
const load=src=>new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;
});
function feature(image){
 const c=document.createElement('canvas');c.width=c.height=12;
 const ctx=c.getContext('2d');ctx.drawImage(image,0,0,12,12);
 const data=ctx.getImageData(0,0,12,12).data,result=[];
 for(let i=0;i<data.length;i+=4)result.push((data[i]*.3+data[i+1]*.59+data[i+2]*.11)*(data[i+3]/255));
 const mean=result.reduce((a,b)=>a+b,0)/result.length;return result.map(x=>x-mean);
}
function compare(a,b){
 let ab=0,aa=0,bb=0;for(let i=0;i<a.length;i++){ab+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}
 return aa&&bb?ab/Math.sqrt(aa*bb):0;
}
async function getCatalog(){
 if(catalog.length)return;
 const r=await fetch('./pantheon-catalog.json?v=2');if(!r.ok)throw Error('Pantheon-Katalog nicht geladen');
 catalog=(await r.json()).items.filter(i=>i&&i.id&&i.name);
 const icons=new Map();
 for(const item of catalog){
  const path=String(item.icon||'');
  if(!/^\.\/pantheon-icons\/[a-z0-9-]+\.(png|webp)$/.test(path)||/\/(artwork|statue)\.webp$/.test(path))continue;
  if(!icons.has(path))icons.set(path,[]);
  icons.get(path).push(item);
 }
 references=[];
 for(const [path,items] of icons){
  if(items.length!==1)continue;
  try{const img=await load(path);references.push({item:items[0],data:feature(img)});}catch{}
 }
}
$('psc-upload').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>16e6){
  $('psc-note').textContent='Bitte PNG/JPEG/WebP kleiner als 16 MB auswählen.';return;
 }
 if(imageUrl)URL.revokeObjectURL(imageUrl);
 imageUrl=URL.createObjectURL(file);
 try{picture=await load(imageUrl);$('psc-note').textContent='Bild geladen: '+picture.naturalWidth+' × '+picture.naturalHeight+' Pixel.'}
 catch{picture=null;$('psc-note').textContent='Bild nicht lesbar.'}
});
$('psc-scan').addEventListener('click',async()=>{
 if(!picture){$('psc-note').textContent='Bitte zuerst Screenshot hochladen.';return}
 const x=val('psc-x'),y=val('psc-y'),size=val('psc-size'),gap=val('psc-gap'),cols=val('psc-cols'),rows=val('psc-rows');
 if(![x,y,size,gap,cols,rows].every(Number.isInteger)||x<0||y<0||size<20||size>300||gap<0||gap>150||cols<1||cols>8||rows<1||rows>18||
 x+cols*size+(cols-1)*gap>picture.naturalWidth||
 y+rows*size+(rows-1)*gap>picture.naturalHeight){
  $('psc-note').textContent='Raster passt nicht auf Screenshot. Größe, Anzahl oder Startpunkt anpassen.';return;
 }
 $('psc-note').textContent='Vergleiche Kacheln mit vorhandenen Originalbildern …';
 try{await getCatalog()}catch(e){$('psc-note').textContent=e.message;return}
 const items=catalog.slice().sort((a,b)=>String(a.nameDe||a.name).localeCompare(String(b.nameDe||b.name),'de'));
 const options='<option value="">Nicht erkannt / auswählen</option>'+items.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.nameDe||item.name)+'</option>').join('');
 let html='',n=0;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  canvas.getContext('2d').drawImage(picture,x+col*(size+gap),y+row*(size+gap),size,size,0,0,size,size);
  const sig=feature(canvas);
  const best=references.map(ref=>({item:ref.item,score:compare(sig,ref.data)})).sort((a,b)=>b.score-a.score)[0];
  const suggestion=best&&best.score>.8?'Ähnlich: '+(best.item.nameDe||best.item.name):'Kein eindeutiger Bildvergleich';
  html+='<article class="card" style="padding:10px"><img style="width:85px;height:85px;object-fit:contain;display:block;margin:auto" src="'+canvas.toDataURL()+'" alt="Item '+(n+1)+'">'+
  '<small>Kachel '+(++n)+' · '+esc(suggestion)+'</small>'+
  '<label style="display:block;font-size:12px;margin-top:7px">Bestätigtes Item</label>'+
  '<select data-psc-item style="font-size:12px;padding:8px">'+options+'</select>'+
  '<label style="display:block;font-size:12px;margin-top:9px"><input style="width:auto" type="checkbox" data-psc-placed> Aufgestellt</label></article>';
 }
 $('psc-result').innerHTML=html;$('psc-save').disabled=false;
 $('psc-note').textContent=n+' Bildkacheln ausgeschnitten. '+references.length+' eindeutige Vorlagen verfügbar. Itemnamen bitte bestätigen.';
});
$('psc-save').addEventListener('click',()=>{
 const key='aion2-pantheon-v1:'+String(data?.sourceRef?.sid||'lokal')+':'+String(data?.sourceRef?.id||data?.name||'EU-Charakter').normalize('NFKC');
 let old={};try{old=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 const owned=new Set(Array.isArray(old.owned)?old.owned:[]);
 const placed=new Set(Array.isArray(old.placed)?old.placed:[]);
 let selected=0;
 for(const node of $('psc-result').querySelectorAll('article')){
  const id=node.querySelector('[data-psc-item]')?.value;
  if(!catalog.some(i=>i.id===id))continue;
  owned.add(id);selected++;
  if(node.querySelector('[data-psc-placed]')?.checked)placed.add(id);
 }
 if(!selected){$('psc-note').textContent='Bitte zuerst mindestens einen Gegenstand auswählen.';return}
 const limits={artwork:12,statue:4,colossus:1},counts={artwork:0,statue:0,colossus:0};
 for(const id of placed){const found=catalog.find(i=>i.id===id);if(found&&found.kind in counts)counts[found.kind]++}
 if(Object.keys(counts).some(k=>counts[k]>limits[k])){
  $('psc-note').textContent='Zu viele aufgestellte Stücke: maximal 12 Gemälde, 4 Statuen und 1 Koloss.';return;
 }
 if(!confirm(selected+' ausgewählte Gegenstände lokal in deiner Pantheon-Sammlung speichern?'))return;
 try{localStorage.setItem(key,JSON.stringify({...old,owned:[...owned],placed:[...placed]}));
 $('psc-note').textContent='Gespeichert – aktualisiere die Seite, um deine Pantheon-Liste zu sehen.';
 window.location.reload();
 }catch{$('psc-note').textContent='Speichern fehlgeschlagen.'}
});
})();
