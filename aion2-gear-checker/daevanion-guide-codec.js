/* Offline parser for AION2 Daevanion guide builds (no cross-origin requests).
 * Aion2Data share param b: six URL-safe base64 chunks, each is a little-endian
 * 15x15 board bitset; board order Nezekan/Zikel/Vaizel/Triniel/Azphel/Ariel.
 * Also accepts manually exported row/column or 0-based cell-index JSON. */
(()=>{
'use strict';
const ORDER=['71','72','73','74','76','75'];
const LABELS={'71':'Nezekan','72':'Zikel','73':'Vaizel','74':'Triniel','75':'Ariel','76':'Azphel'};
const MAX_CELL=225;
function boardId(value){
 const name=String(value||'').trim().toLowerCase();
 return ORDER.find(id=>id===name||LABELS[id].toLowerCase()===name)||null;
}
function decodeBits(value){
 if(typeof value!=='string'||value.length<2||value.length>48||!/^[A-Za-z0-9_-]+={0,2}$/.test(value))
  throw Error('Der Board-Code enthält ungültige Zeichen.');
 const normal=value.replace(/-/g,'+').replace(/_/g,'/').replace(/=+$/,'');
 const bytes=atob(normal.padEnd(Math.ceil(normal.length/4)*4,'='));
 if(bytes.length>29)throw Error('Ein Board darf maximal 225 Zellen enthalten.');
 const result=[];
 for(let i=0;i<bytes.length;i++){
  const byte=bytes.charCodeAt(i);
  for(let bit=0;bit<8;bit++){
   const cell=i*8+bit;
   if(byte&(1<<bit)){
    if(cell>=MAX_CELL)throw Error('Der Board-Code enthält Knoten außerhalb der 15×15-Tafel.');
    result.push(cell);
   }
  }
 }
 return result;
}
function parseAion2Data(value){
 const raw=String(value||'').trim();
 let code='',sourceUrl='';
 if(/^https?:\/\//i.test(raw)){
  let url;
  try{url=new URL(raw)}catch{throw Error('Der Guide-Link ist ungültig.')}
  const host=url.hostname.toLowerCase();
  if(host!=='aion2data.com'&&host!=='www.aion2data.com')
   throw Error('Dieser Guide-Link wird noch nicht direkt unterstützt. Nutze einen Aion2Data-Freigabelink oder trage die Knoten manuell ein.');
  if(!/^\/daevanion\/cleric\/?$/i.test(url.pathname))
   throw Error('Bitte einen Daevanion-Freigabelink für die Klasse Kleriker verwenden.');
  code=url.searchParams.get('b')||'';
  sourceUrl=url.href.slice(0,1500);
 }else if(/^[?]?b=/i.test(raw)){
  code=new URLSearchParams(raw.replace(/^\?/, '')).get('b')||'';
 }else if(/^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){4,5}$/.test(raw)){
  code=raw;
 }else throw Error('Bitte einen Aion2Data-Freigabelink mit ?b=… einfügen.');
 if(!code)throw Error('Der Link enthält keinen Daevanion-Build (Parameter b fehlt).');
 const parts=code.split('.');
 if(parts.length!==5&&parts.length!==6)throw Error('Der Freigabelink hat nicht die erwarteten fünf oder sechs Boards.');
 const boards={};
 parts.forEach((part,i)=>{boards[ORDER[i]]=decodeBits(part)});
 if(!Object.values(boards).some(x=>x.length))throw Error('In diesem Link sind keine Knoten ausgewählt.');
 return {boards,format:'Aion2Data',sourceUrl};
}
function normalizeCell(v){
 let n;
 if(Number.isInteger(v))n=v;
 else if(v&&typeof v==='object'&&Number.isInteger(v.row)&&Number.isInteger(v.col)&&v.row>=1&&v.row<=15&&v.col>=1&&v.col<=15)
  n=(v.row-1)*15+(v.col-1);
 else if(v&&typeof v==='object'&&Number.isInteger(v.cell))n=v.cell;
 else throw Error('Ein Knoten muss eine Zahl von 0 bis 224 oder {row, col} sein.');
 if(n<0||n>=MAX_CELL)throw Error('Der Knoten liegt außerhalb der 15×15-Tafel.');
 return n;
}
function parseJSON(value){
 let o;
 try{o=typeof value==='string'?JSON.parse(value):value}catch{throw Error('Ungültiges JSON.')}
 if(!o||typeof o!=='object'||Array.isArray(o))throw Error('JSON erwartet ein Objekt mit Boards.');
 const src=o.boards&&typeof o.boards==='object'&&!Array.isArray(o.boards)?o.boards:o;
 const boards={};
 for(const [name,raw] of Object.entries(src)){
  const id=boardId(name);
  if(!id)continue;
  const cells=Array.isArray(raw)?raw:raw?.cells;
  if(!Array.isArray(cells))throw Error('Für '+LABELS[id]+' wird eine Knotenliste erwartet.');
  boards[id]=[...new Set(cells.map(normalizeCell))].sort((a,b)=>a-b);
 }
 if(!Object.keys(boards).length)throw Error('Keine gültigen Daevanion-Boardnamen im JSON gefunden.');
 return {boards,format:'JSON',sourceUrl:''};
}
function parse(value){
 const s=String(value||'').trim();
 const known=window.AionGuidePresets?.match?.(s);
 if(known)return known;
 if(s.length>35000)throw Error('Die Eingabe ist zu lang.');
 if(!s)throw Error('Bitte einen Guide-Link oder Board-Code einfügen.');
 if(s.startsWith('{'))return parseJSON(s);
 return parseAion2Data(s);
}
if(typeof window!=='undefined')window.AionGuideBoardCodec={parse,parseJSON,parseAion2Data,decodeBits,boardId,ORDER,LABELS};
})();
