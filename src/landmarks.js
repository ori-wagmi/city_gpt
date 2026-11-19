import { bounds, box, door, face, fade, front, iso, masonry, path, polygon, pot, right, window } from "./art.js";

const pavement = ["#d7c9a4","#a09578","#726f60"];
const coping = ["#e1dbc2","#b9b39c","#838d82"];
const grounds = ["#a2a272","#768156","#5d6d50"];

function ellipse(c,x,y,rx,ry,color) {
  c.beginPath();
  c.ellipse(x,y,rx,ry,0,0,2*Math.PI);
  c.fillStyle=color;
  c.fill();
}

function apron(c,x,y,w,d) {
  const [sx,sy] = iso([x+w/2,y+d/2,0]);
  const shadow = c.createRadialGradient(sx+8,sy+15,4,sx+8,sy+15,(w+d)*0.66);
  shadow.addColorStop(0,"#233d396e");
  shadow.addColorStop(1,"#233d3900");
  c.save();
  c.scale(1,0.58);
  c.fillStyle=shadow;
  c.fillRect(sx-w-d,sy-d,w*2+d*2,d*3+w);
  c.restore();
  box(c,x,y,w,d,0,2.4,grounds);
  box(c,x+2,y+2,w-4,d-4,2.4,1.2,pavement);
  for (let u=x+6;u<x+w-4;u+=5) {
    path(c,[[u,y+3,3.65],[u,y+d-3,3.65]],"#9c91744a",0.55);
  }
  for (let v=y+6;v<y+d-4;v+=5) {
    path(c,[[x+3,v,3.65],[x+w-3,v,3.65]],"#9c91744a",0.55);
  }
}

function lamp(c,x,y,z,cap="#f3d295") {
  const [px,py]=iso([x,y,z]);
  ellipse(c,px+2,py+0.7,3.1,1.2,"#435c4761");
  path(c,[[x,y,z],[x,y,z+10]],"#57645b",1.4);
  box(c,x-1.15,y-1.15,2.3,2.3,z+8.5,2.3,[cap,cap,"#b8a876"]);
  path(c,[[x-1.7,y,z+11],[x+1.7,y,z+11]],"#415957",1.1);
}

function factory(c,variant) {
  const accents=[["#c4975f","#85603e","#674c3f"],["#78aeaa","#508680","#385f61"],["#c47f74","#9d6057","#704d4e"],["#a6a36c","#77794a","#535738"]][variant];
  const roof=["#526e73","#425962","#344b55"];
  apron(c,-35,-28,70,56);
  // Exhaust stacks stand behind the sawtooth production hall.
  for (const [x,y,h] of [[-20,-16,53],[-12,-16,46]]) {
    box(c,x-2.6,y-2.6,5.2,5.2,3.6,h,["#b2a58a","#9d6a51","#704c47"]);
    for (const z of [23,34,h-2]) box(c,x-3,y-3,6,6,z,1.8,coping);
    const [px,py]=iso([x,y,h+3.6]);
    ellipse(c,px,py,2.15,1.0,"#33464b");
  }
  const wall=["#c0a88a","#9c8069","#706253"];
  box(c,-29,-21,58,38,3.6,24,wall);
  masonry(c,front(17),-29,29,4,23,variant);
  masonry(c,right(29),-21,17,4,23,variant+2);
  for (const u of [-28,-10,10,27]) box(c,u,-21,2,39,3.6,24,accents);
  for (const [x,w] of [[-24,12],[-7,13],[12,12]]) {
    const a=front(17.3);
    face(c,[[x,17.3,3.8],[x+w,17.3,3.8],[x+w,17.3,16.5],[x,17.3,16.5]],"#39494f","#8e9a8c",1);
    for (let z=5;z<16;z+=1.6) path(c,[a(x+0.7,z),a(x+w-0.7,z)],"#83918b",0.54);
    path(c,[a(x-0.8,17),a(x+w+0.8,17)],accents[0],1.6);
    path(c,[a(x+1,2.9),a(x+w-1,2.9)],"#c29c58",1.2);
  }
  for (const y of [-16,-6,4]) window(c,right(29.2),y,13,6,8,{trim:"#9c9d89",lit:y!==4,glass:"#87a8a7"});
  for (const begin of [-21,-8,5]) {
    const end=begin+12.7;
    const peak=begin+7.8;
    face(c,[[-30,begin,27.6],[30,begin,27.6],[30,peak,39],[-30,peak,39]],
      fade(c,[-30,peak,39],[30,begin,27.6],"#718687",roof[0]));
    face(c,[[-30,peak,39],[30,peak,39],[30,end,27.6],[-30,end,27.6]],"#83aaa4","#3e5457",0.75);
    face(c,[[30,begin,27.6],[30,peak,39],[30,end,27.6]],roof[1]);
    for (let u=-28;u<=30;u+=4.4) {
      path(c,[[u,begin,27.7],[u,peak,39.1],[u,end,27.7]],"#344d56",0.75);
      path(c,[[u+0.9,begin,27.8],[u+0.9,peak,39.15],[u+0.9,end,27.8]],"#c3dcd08c",0.5);
    }
    path(c,[[-30,peak,39.2],[30,peak,39.2]],accents[0],1.4);
  }
  for (const x of [-17,-9,4,12]) {
    path(c,[[x,19,3.63],[x,25,3.63]],"#eee0ac",0.78);
  }
  for (const [x,y] of [[-30,21],[28,20],[33,-7]]) lamp(c,x,y,3.6);
  box(c,24,19,5,4,3.6,2.2,["#b78055","#986744","#754b39"]);
  box(c,24.3,19.25,4.3,3.45,5.8,2.1,["#cf9660","#a6734a","#754b39"]);
}

function ring(radiusX,radiusY,z,steps=36) {
  return Array.from({length:steps},(_,i) => {
    const angle=i*2*Math.PI/steps;
    return [Math.cos(angle)*radiusX,Math.sin(angle)*radiusY,z];
  });
}

function skyNeedle(c,variant) {
  const metals=[["#e0ded2","#a4b5aa","#5d7f80"],["#e6d3b0","#af9c83","#697e80"],["#d6d7e6","#9daac5","#64758e"],["#e1c4c7","#b397a1","#856f86"]][variant];
  const glow=["#55cabc","#f6c16f","#a7bfff","#f7a4ca"][variant];
  apron(c,-22,-22,44,44);
  face(c,ring(20,20,3.7),"#a3ac8a","#7f8c72",0.8);
  face(c,ring(16,16,3.8),"#d7cbb0","#a4937c",0.65);
  for (const [x,y] of [[-14,11],[10,14],[15,-10]]) pot(c,x,y,3.6,4.5,true);
  const mast=ring(4.6,4.6,111,12);
  const foot=ring(7.2,7.2,3.6,12);
  for (let i=0;i<12;i++) {
    const j=(i+1)%12;
    face(c,[foot[i],foot[j],mast[j],mast[i]],metals[(i<5?i:0)%3]);
  }
  // Swept steel legs leave clear gaps under the viewing deck.
  for (const [baseX,baseY] of [[-15,-14],[-15,13],[14,14],[15,-13]]) {
    const shadow=baseX>0?metals[2]:metals[1];
    const outer=[[baseX,baseY,4],[baseX*0.74,baseY*0.74,36],[baseX*0.42,baseY*0.42,76],[baseX*0.62,baseY*0.62,107]];
    const inner=outer.map(([x,y,z],i)=>[x*0.72,y*0.72,z+(i===0?3:0)]);
    face(c,[...outer,...inner.reverse()],shadow);
    path(c,outer,metals[0],1.45);
  }
  const dishBottom=ring(11,11,106);
  const floor=ring(27,27,115);
  for (let i=0;i<36;i++) {
    const j=(i+1)%36;
    face(c,[dishBottom[i],dishBottom[j],floor[j],floor[i]],metals[i>6 && i<24?1:2],null);
  }
  const visor=ring(26,26,123);
  face(c,floor,metals[2]);
  for (let i=0;i<36;i++) {
    const j=(i+1)%36;
    face(c,[floor[i],floor[j],visor[j],visor[i]],fade(c,visor[i],floor[j],
      i>6 && i<21?"#8bcbcb":"#4c7588","#223f54"),"#2e5363",0.4);
  }
  const canopy=ring(28,28,125);
  const crest=ring(11,11,132);
  face(c,canopy,metals[0],"#52666e",1.22);
  face(c,crest,metals[1],"#788c8d",0.6);
  for (let i=0;i<36;i+=3) path(c,[canopy[i],crest[i]],"#76938d",0.52);
  path(c,floor.slice(0,16),glow,1.65);
  box(c,-3,-3,6,6,131.7,4.6,metals);
  path(c,[[0,0,135],[0,0,155]],"#e4d5ad",1.45);
  path(c,[[-3,0,147],[3,0,147]],"#687f82",0.96);
  const [x,y]=iso([0,0,154]);
  ellipse(c,x,y,2.3,1.8,glow);
  door(c,front(5.5),-2.7,4,5.4,10,metals[1],"#385464");
}

function stadium(c,variant) {
  const colors=[["#c9925f","#8d5e60"],["#82b6ae","#507f86"],["#b99acf","#75688d"],["#bb7771","#8e5759"]][variant];
  const seats=["#bdac8a",colors[0],colors[1],"#e0d1a4"];
  apron(c,-31,-29,62,58);
  const levels = [[28,25,4],[29,26,17],[25,22,17],[23,20,13],[21,18,9],[19,16,5]]
    .map(([x,y,z])=>ring(x,y,z));
  function segment(c,i,from,to,fill,stroke) {
    const j=(i+1)%36;
    face(c,[from[i],from[j],to[j],to[i]],fill,stroke,0.55);
  }
  const sorted=Array.from({length:36},(_,i)=>i).sort((a,b)=>iso(levels[0][a])[1]-iso(levels[0][b])[1]);
  for (const i of sorted) segment(c,i,levels[0],levels[1],i>3 && i<18?"#969182":"#6d766f","#555e5e");
  face(c,bounds(-19,-17,38,34,4.2),"#567e49","#456e44");
  for (let i=0;i<8;i++) face(c,bounds(-16+i*4,-13,4.02,26,4.3),i%2?"#77a157":"#67924e",null);
  const field = [[-15,-12,4.45],[15,-12,4.45],[15,12,4.45],[-15,12,4.45],[-15,-12,4.45]];
  path(c,field,"#e3e7ba",0.8);
  path(c,[[0,-12,4.45],[0,12,4.45]],"#e3e7ba",0.7);
  const circle=ring(4,4,4.45,20);
  path(c,[...circle,circle[0]],"#e3e7ba",0.65);
  for(const sign of [-1,1]) {
    path(c,[[sign*15,-5,4.5],[sign*10,-5,4.5],[sign*10,5,4.5],[sign*15,5,4.5]],"#e5e8bf",0.68);
  }
  for (const i of sorted) {
    for (let tier=levels.length-1;tier>1;tier--) {
      segment(c,i,levels[tier],levels[tier-1],i%6===0?"#e4d9bb":seats[(tier+i%3)%seats.length],"#807e6a");
    }
    segment(c,i,levels[2],levels[1],"#dad0ab","#8e8f78");
  }
  const canopyOuter=ring(29.5,26,24);
  const canopyInner=ring(21,18,27);
  for (const i of [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]) {
    segment(c,i,canopyOuter,canopyInner,i%3 ? "#b4c1ae" : "#d8cfb3","#6c8780");
    if(i%3===0) path(c,[levels[1][i],canopyOuter[i]],"#708b89",1.16);
  }
  for (const [x,y] of [[-24,16],[24,-16]]) {
    path(c,[[x,y,4],[x,y,32]],"#576c6c",1.55);
    box(c,x-2.9,y-0.8,5.8,1.6,31,2.7,["#c6cac1","#dcdab8","#727c75"]);
    for(let i=0;i<3;i++) path(c,[[x-2+i*2,y+0.85,32],[x-1+i*2,y+0.85,32]],"#f7e8ba",0.7);
  }
  box(c,-7,23,14,4,3.6,4.4,pavement);
  for (const x of [-8,8]) lamp(c,x,25,3.6,colors[0]);
}

function steeple(c,x,y,w,d,base,h,colors) {
  const corners=bounds(x,y,w,d,base);
  const peak=[x+w/2,y+d/2,base+h];
  face(c,[corners[0],corners[1],peak],colors[2]);
  face(c,[corners[3],corners[2],peak],colors[0]);
  face(c,[corners[2],corners[1],peak],colors[1]);
  for(const side of [[corners[3],corners[2]],[corners[2],corners[1]]]) {
    for(let i=1;i<6;i++) {
      const t=i/6;
      const points=side.map((p)=>[p[0]+(peak[0]-p[0])*t,p[1]+(peak[1]-p[1])*t,base+h*t]);
      path(c,points,"#364f544d",0.65);
    }
  }
  path(c,[corners[2],peak],"#c2c4a9",0.9);
  path(c,[peak,[peak[0],peak[1],peak[2]+6]],"#cead77",1.35);
  path(c,[[peak[0]-2,peak[1],peak[2]+4],[peak[0]+2,peak[1],peak[2]+4]],"#cead77",1.15);
}

function basilica(c,variant) {
  const stone=[["#ddc697","#c4a979","#927f6c"],["#d3d0b1","#afa78b","#827f78"],["#e2bfaa","#c49c89","#937b75"],["#c5d0cb","#98afa5","#748c85"]][variant];
  const slate=[["#61837c","#46686d","#3a505d"],["#748493","#5a657d","#414f63"],["#827b68","#646956","#475951"],["#8c7170","#765e68","#543f57"]][variant];
  apron(c,-24,-29,48,58);
  box(c,-17,-24,34,44,3.6,4.4,pavement);
  box(c,-14,-23,28,42,8,26,stone);
  for (const x of [-11,10]) box(c,x-1.1,18,2.2,2,8,24,stone);
  for (const y of [-18,-7,4,14]) {
    const at=right(14);
    box(c,13.65,y-1.3,2.5,2.6,7.2,25,stone);
    window(c,at,y+1.7,15,4.8,11,{trim:"#d9c699",lit:false,glass:"#7693a6"});
  }
  for (const [edge,color] of [[-16,slate[1]],[16,slate[0]]]) {
    face(c,[[edge,-24,34],[edge,21,34],[0,21,49],[0,-24,49]],color);
    for(const f of [0.2,0.4,0.6,0.8]) {
      path(c,[[edge*(1-f),-24,34+15*f],[edge*(1-f),21,34+15*f]],"#3b5458",0.62);
    }
    for(let y=-20;y<21;y+=4.5) path(c,[[edge,y,34],[edge*0.4,y,43],[0,y,49]],"#b8c5aa73",0.58);
  }
  face(c,[[-16,21,34],[16,21,34],[0,21,49]],stone[1]);
  path(c,[[-16,21,34],[0,21,49],[16,21,34]],stone[0],1.5);
  for (const x of [-14,7]) {
    box(c,x,12,7,9,8,40,stone);
    window(c,front(21.15),x+1.4,32,4.2,9,{trim:"#d7bf97",lit:true,glass:"#8ca9aa",mullion:false});
    box(c,x-0.6,11.4,8.2,10.2,47,2.6,pavement);
    steeple(c,x-0.6,11.4,8.2,10.2,49.6,20,slate);
  }
  const a=front(21.2);
  const rose = (r) => Array.from({length:18},(_,i)=>a(Math.cos(i*Math.PI/9)*r,27+Math.sin(i*Math.PI/9)*r));
  face(c,rose(6.1),"#e5c895");
  face(c,rose(4.75),"#477783","#67756c");
  for (let i=0;i<8;i++) {
    const angle=i*Math.PI/4;
    path(c,[a(0,27),a(Math.cos(angle)*4.6,27+Math.sin(angle)*4.6)],"#dcc997",0.78);
  }
  face(c,rose(1.42),"#d28c69","#e9bd83");
  door(c,a,-4.7,8,9.4,10,"#e3c895","#6d6362");
  path(c,[a(-5,17),a(-3.5,20),a(0,22),a(3.5,20),a(5,17)],"#fff0c5",1.15);
  box(c,-6.4,20,12.8,6.5,3.6,2.2,pavement);
  box(c,-6,20,12,5,5.8,2.2,stone);
  for (const x of [-17,17]) {
    pot(c,x,24,3.6,4.4,true);
    lamp(c,x,18,3.6);
  }
}

const sprites = new Map();
const artwork = [factory,skyNeedle,stadium,basilica];
export const landmarkBounds = { width: 184, height: 213, x: 92, y: 164 };

export function landmarkSprite(type,variant) {
  const key=type*4+variant;
  if (!sprites.has(key)) {
    const canvas=document.createElement("canvas");
    const scale=2.5;
    canvas.width=Math.ceil(landmarkBounds.width*scale);
    canvas.height=Math.ceil(landmarkBounds.height*scale);
    const c=canvas.getContext("2d");
    c.scale(canvas.width/landmarkBounds.width,canvas.height/landmarkBounds.height);
    c.translate(landmarkBounds.x,landmarkBounds.y);
    artwork[type](c,variant);
    sprites.set(key,canvas);
  }
  return sprites.get(key);
}
