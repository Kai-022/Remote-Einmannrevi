/* Aion 2 Pet HUD extractor. Detects the cyan Species Insight header,
 * creates a readable composite of the nine aligned talent rows, and
 * estimates which of the five LEFT-HAND icons is highlighted.
 * This does not assign icon positions to named species without calibration.
 */
(()=>{
'use strict';
const cv=document.createElement('canvas');
function toCanvas(source,max=1800){
 const w=source.videoWidth||source.naturalWidth||source.width||0;
 const h=source.videoHeight||source.naturalHeight||source.height||0;
 if(!w||!h)return null;
 const factor=Math.min(1,max/w);
 cv.width=Math.round(w*factor);cv.height=Math.round(h*factor);
 const ctx=cv.getContext('2d',{willReadFrequently:true});
 if(!ctx)return null;
 ctx.drawImage(source,0,0,cv.width,cv.height);
 return cv;
}
function findPanel(source){
 const scene=toCanvas(source);
 if(!scene||scene.width<420||scene.height<240)return null;
 const w=scene.width,h=scene.height;
 const bytes=scene.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 const cyan=(x,y)=>{
  const n=(y*w+x)*4,r=bytes[n],g=bytes[n+1],b=bytes[n+2];
  return g>125&&b>105&&g>r*1.46&&b>r*1.22;
 };
 let best={score:0,y:0};
 const xlo=Math.floor(w*.74),xhi=Math.floor(w*.996);
 const ymax=Math.floor(h*.61);
 for(let y=6;y<ymax;y++){
  let hit=0;
  for(let x=xlo;x<xhi;x+=2)if(cyan(x,y))hit++;
  if(hit>best.score)best={score:hit,y};
 }
 if(best.score<Math.max(16,Math.round(w*.012)))return null;
 const xs=[];for(let x=xlo;x<xhi;x++)if(cyan(x,best.y))xs.push(x);
 if(xs.length<50)return null;
 // Find the contiguous cyan progress bar rather than disjoint UI icons.
 let runs=[],start=xs[0],prev=xs[0];
 for(let i=1;i<xs.length;i++){
  if(xs[i]>prev+2){runs.push([start,prev]);start=xs[i]}
  prev=xs[i];
 }
 runs.push([start,prev]);runs.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]));
 const [barLeft,barRight]=runs[0],bw=barRight-barLeft+1;
 if(bw<Math.max(50,w*.024)||bw>w*.40)return null;
 const pitch=bw*.125,first=best.y+bw*.166;
 // Start before the cyan bar: icon column, short labels (e.g. LP +) and the first letters must remain visible.
 const x0=Math.max(0,Math.round(barLeft-bw*.052));
 const x1=Math.min(w,Math.round(barRight+bw*.075));
 if(x1-x0<100||first+8*pitch>h-8)return null;
 const active=detectSelectedIcon(bytes,w,h,best.y,bw);
 const crop=document.createElement('canvas');
 const scale=Math.min(6,Math.max(3,1000/(x1-x0)));
 const rowHeight=Math.round(pitch*scale*1.06);
 crop.width=Math.round((x1-x0)*scale)+60;
 crop.height=rowHeight*9;
 const ctx=crop.getContext('2d');
 ctx.fillStyle='#000';ctx.fillRect(0,0,crop.width,crop.height);
 ctx.font='bold '+Math.round(rowHeight*.38)+'px Arial, sans-serif';
 ctx.textBaseline='middle';
 for(let i=0;i<9;i++){
  const cy=first+i*pitch;
  const y0=Math.max(0,Math.round(cy-pitch*.47));
  const height=Math.min(h-y0,Math.round(pitch*.94));
  ctx.filter='contrast(1.25) brightness(1.15)';
  ctx.drawImage(scene,x0,y0,x1-x0,height,55,i*rowHeight+3,crop.width-60,rowHeight-6);
  ctx.filter='none';
  ctx.fillStyle='white';
  ctx.fillText(String(i+1)+':',5,i*rowHeight+rowHeight*.52);
 }
 return {canvas:crop,active,barLeft,barY:best.y,barWidth:bw,textLeft:x0,textRight:x1,rowHeight,slots:9,sourceWidth:w,sourceHeight:h};
}
function detectSelectedIcon(px,w,h,barY,bw){
 // HUD left has five round icons following a gentle curve.
 // An active icon has a substantially brighter outer white ring.
 const xs=[.80,.69,.62,.69,.80],scores=[];
 for(let i=0;i<5;i++){
  const cx=Math.round(bw*xs[i]),cy=Math.round(barY+bw*(.15+i*.33));
  let score=0;
  for(let r=bw*.108;r<=bw*.16;r+=Math.max(1,bw*.011)){
   for(let a=0;a<360;a+=10){
    const theta=a*Math.PI/180,x=Math.round(cx+r*Math.cos(theta)),y=Math.round(cy+r*Math.sin(theta));
    if(x<0||x>=w||y<0||y>=h)continue;
    const p=(y*w+x)*4;
    if(Math.min(px[p],px[p+1],px[p+2])>152)score++;
   }
  }
  scores.push(score);
 }
 const sorted=scores.map((score,i)=>({score,index:i+1})).sort((a,b)=>b.score-a.score);
 return sorted[0].score>Math.max(8,sorted[1].score*2.0)?sorted[0].index:null;
}
function readComposite(ocr,rowHeight){
 const chunks=[];
 if(Array.isArray(ocr?.lines)&&ocr.lines.length){
  for(const l of ocr.lines){
   const slot=Number(String(l.text||'').match(/^\s*([1-9])\s*[:.]/)?.[1])||Math.floor((l.bbox?.y0??0)/rowHeight)+1;
   chunks.push({slot,text:l.text||'',confidence:l.confidence??ocr.confidence??0});
  }
 }else if(Array.isArray(ocr?.blocks)&&ocr.blocks.length){
  const collect=items=>{for(const item of items||[]){
   if(item.paragraphs)collect(item.paragraphs);
   else if(item.lines)collect(item.lines);
   else if(item.text){const slot=Number(String(item.text).match(/^\s*([1-9])\s*[:.]/)?.[1])||Math.floor((item.bbox?.y0??0)/rowHeight)+1;chunks.push({slot,text:item.text,confidence:item.confidence??ocr.confidence??0})}
  }};
  collect(ocr.blocks);
 }
 if(!chunks.length){
  const rows=String(ocr?.text||'').split(/\n/).map(s=>s.trim()).filter(Boolean);
  for(const line of rows){
   const match=line.match(/^\s*([1-9])\s*[:.)-]\s*(.*)$/);
   // A non-indexed OCR line is not safe to assign when a row is missing.
   if(match)chunks.push({slot:Number(match[1]),text:match[2],confidence:ocr?.confidence||0});
  }
  if(!chunks.length&&rows.length===9)rows.forEach((text,i)=>chunks.push({slot:i+1,text,confidence:ocr?.confidence||0}));
 }
 return chunks.filter(r=>Number.isInteger(r.slot)&&r.slot>=1&&r.slot<=9);
}
window.aionPetVision={findPanel,readComposite};
})();