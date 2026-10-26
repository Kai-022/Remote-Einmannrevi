import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const src=await readFile(new URL('../pet-vision.js',import.meta.url),'utf8');
assert.doesNotThrow(()=>new vm.Script(src));
const w=1000,h=430,rgba=new Uint8ClampedArray(w*h*4);
const pixel=(x,y,r,g,b)=>{const p=(y*w+x)*4;rgba[p]=r;rgba[p+1]=g;rgba[p+2]=b;rgba[p+3]=255};
for(let y=108;y<=110;y++)for(let x=828;x<=990;x++)pixel(x,y,17,197,214);
// Synthetic selected fifth icon: bright outer rim; other icons unselected.
const cx=130,cy=349;
for(let d=0;d<360;d+=2){const a=d*Math.PI/180;pixel(Math.round(cx+Math.cos(a)*20),Math.round(cy+Math.sin(a)*20),245,239,244)}
class Canvas{
 constructor(){this.width=0;this.height=0;}
 getContext(){return {getImageData:()=>({data:rgba}),drawImage(){},fillRect(){},fillText(){},set filter(v){},set fillStyle(v){},set font(v){},set textBaseline(v){}}}
}
const window={};
vm.runInNewContext(src,{window,document:{createElement:()=>new Canvas()}},{timeout:5000});
const api=window.aionPetVision;
assert(api);
const scene=api.findPanel({width:w,height:h});
assert(scene,'cyan progress header and slot grid found');
assert.equal(scene.slots,9);
assert.equal(scene.active,5,'fifth sidebar icon selected');
assert(scene.barLeft>=820&&scene.barLeft<=840);
assert(scene.textLeft<=scene.barLeft-6,
  'the OCR crop must include short left-aligned labels and full first letters');
assert(scene.textRight>=scene.barLeft+150,
  'the OCR crop must retain numerical values at the far right');
assert(scene.barY>=107&&scene.barY<=110);
const out=api.readComposite({lines:[
 {text:'1: Zusatzangriffskraft 15',bbox:{y0:5},confidence:90},
 {text:'3: Zusatzpräzision 27',bbox:{y0:scene.rowHeight*2+8},confidence:90},
 {text:'9: Zusatzpräzision 9',bbox:{y0:scene.rowHeight*8+5},confidence:90}
]},scene.rowHeight);
assert.equal(out.length,3);
assert.deepEqual([...out].map(r=>r.slot),[1,3,9]);
const fallback=api.readComposite({text:'1: Zusatzangriffskraft 15\n3: Zusatzpräzision 27\n9: Zusatzpräzision 9'},scene.rowHeight);
assert.deepEqual([...fallback].map(r=>r.slot),[1,3,9]);
assert.equal(api.findPanel({width:100,height:100}),null,'too small');
console.log('Pet HUD vision: cyan panel, nine aligned slots, selected icon, partial OCR slots PASS');