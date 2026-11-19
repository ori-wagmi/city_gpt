export function polygon(c, points, fill, stroke, width = 1) {
  c.beginPath();
  points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}

export const iso = ([x,y,z]) => [x-y,(x+y)*0.5-z];
const seam = "#263637a6";

export function face(c, points, fill, edge = seam, width = 0.55) {
  polygon(c, points.map(iso), fill, edge, width);
}

export function path(c, points, color, width) {
  c.beginPath();
  points.map(iso).forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

export function fade(c, a, b, light, dark) {
  const gradient = c.createLinearGradient(...iso(a), ...iso(b));
  gradient.addColorStop(0,light);
  gradient.addColorStop(1,dark);
  return gradient;
}

export function bounds(x,y,w,d,z) {
  return [[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]];
}

export function box(c,x,y,w,d,z,h,[top,front,right]) {
  const a = bounds(x,y,w,d,z+h);
  const b = bounds(x,y,w,d,z);
  face(c,[a[3],a[2],b[2],b[3]],front);
  face(c,[a[2],a[1],b[1],b[2]],right);
  face(c,a,top);
}

// Project the exposed edges of a cornice without painting over the façade above it.
function cornice(c,w,d,z,h,overhang,[top,front,right]) {
  const x=w/2+overhang;
  const y=d/2+overhang;
  const lip=z+h;
  face(c,[[-x,y,z],[x,y,z],[x,y,lip],[-x,y,lip]],front);
  face(c,[[x,y,z],[x,-y,z],[x,-y,lip],[x,y,lip]],right);
  face(c,[[-x,y,lip],[x,y,lip],[w/2,d/2,lip],[-x,d/2,lip]],top);
  face(c,[[x,y,lip],[x,-y,lip],[w/2,-y,lip],[w/2,d/2,lip]],top);
}

// Façade details share the same projection as the walls, including horizontal trim.
export const front = (v) => (u,z) => [u,v,z];
export const right = (u) => (v,z) => [u,v,z];
function panel(c, at, x,z,w,h, color, edge = seam) {
  face(c,[at(x,z),at(x+w,z),at(x+w,z+h),at(x,z+h)],color,edge,0.45);
}

export function window(c, at, x,z,w,h, { trim, lit, glass, mirror = false, mullion = true }) {
  panel(c,at,x-0.85,z-0.5,w+1.7,h+1.25,trim);
  panel(c,at,x,z,w,h,"#182e33",null);
  const pane = fade(c,at(x+w,z+h),at(x,z),glass ?? "#598492",lit ? "#f4bc65" : "#263e4c");
  panel(c,at,x+0.5,z+0.65,w-1,h-1.1,pane,null);
  face(c,[at(x+w*0.54,z+0.8),at(x+w*0.92,z+0.8),at(x+w*0.9,z+h*0.6),at(x+w*0.61,z+h*0.92)],
    mirror ? "#b2f1f046" : "#f9ecbd38",null);
  path(c,[at(x,z+h*0.66),at(x+w,z+h*0.66)],trim,0.52);
  if (mullion) path(c,[at(x+w*0.5,z),at(x+w*0.5,z+h)],trim,0.55);
  path(c,[at(x-1,z-0.45),at(x+w+1,z-0.45)],trim,1);
}

export function door(c, at,x,z,w,h,trim,color) {
  panel(c,at,x-0.95,z,w+1.9,h+1,trim);
  panel(c,at,x,z,w,h,color);
  for (let i=1;i<=3;i++) path(c,[at(x+i*w/4,z+0.7),at(x+i*w/4,z+h-0.7)],"#293c3b96",0.33);
  panel(c,at,x+w*0.64,z+h*0.43,0.65,0.95,"#f8d68a",null);
}

export function masonry(c,at,min,max,z,h,seed) {
  for (let row=1;row<h/3;row++) {
    const level = z+row*3;
    path(c,[at(min,level),at(max,level)],row%3 === 0 ? "#39252958" : "#3e302638",0.38);
    for (let x=min+((row+seed)%2 ? 3 : 6);x<max;x+=6) {
      path(c,[at(x,level),at(x,level-3)],"#422e305d",0.4);
      if ((x*7+row*3+seed)%5<2) panel(c,at,x-2.5,level-1,2.3,0.6,"#f0bc8b53",null);
    }
  }
}

export function pot(c,x,y,z,size,flowers = false) {
  box(c,x-size/2,y-size/2,size,size,z,size*0.48,["#dfb78a","#af795f","#815845"]);
  const [cx,cy] = iso([x,y,z+size*0.77]);
  for (let i=0;i<9;i++) {
    const angle = i*2.4;
    const radius = size*(0.18+i%3*0.13);
    const px = cx+Math.cos(angle)*radius;
    const py = cy+Math.sin(angle)*radius*0.66;
    const r = size*(0.18+i%2*0.14);
    c.fillStyle = ["#344d38","#526c43","#789655","#a1ae68"][i%4];
    c.beginPath();
    c.ellipse(px,py,r,r*0.76,angle,0,2*Math.PI);
    c.fill();
    if (flowers && i%2 === 0) {
      c.fillStyle = i%4 ? "#efa59a" : "#f1d08a";
      c.fillRect(px-0.45,py-0.9,0.9,0.9);
    }
  }
}

const stone = ["#ddccab","#ab9981","#806f63"];
const darkTimber = ["#ac784e","#75503c","#4b3630"];
const ivory = ["#fce3b8","#c9af88","#8f8273"];

function yard(c) {
  const shadow = c.createRadialGradient(10,8,3,10,8,39);
  shadow.addColorStop(0,"#172f36a3");
  shadow.addColorStop(0.59,"#24393462");
  shadow.addColorStop(1,"#263d3200");
  c.save();
  c.scale(1,0.64);
  c.fillStyle = shadow;
  c.fillRect(-31,-29,82,72);
  c.restore();
  box(c,-17,-17,34,34,0,1.8,["#a0a269","#7e8257","#5d664a"]);
  for (const x of [-16,12]) {
    for (let y=-15;y<17;y+=4) {
      if (x===12 && y<7) continue;
      face(c,bounds(x,y,3.75,3.55,1.85), y%3 === 0 ? "#cbb388" : "#ded0a5","#9c946d",0.32);
    }
  }
  for (let x=-14;x<16;x+=4) face(c,bounds(x,13,3.55,3.5,1.85),x%3===0 ? "#c8af84" : "#d9c9a1","#9c946d",0.32);
  for (let i=0;i<13;i++) {
    const x = -14+(i*17%29);
    const y = -15+(i*23%29);
    path(c,[[x,y,2],[x+0.4,y+0.8,2.8]],i%2 ? "#637342" : "#aeb775",0.58);
  }
}

function stairs(c,x,y,w) {
  box(c,x,y,w,5,1.8,1.5,stone);
  box(c,x+0.3,y,w-0.6,3.2,3.3,1.5,ivory);
}

function townhouse(c, variant) {
  const brick = [["#ba704d","#8d493e"],["#b68e59","#876246"],["#ac6356","#78474d"]][variant];
  const tiles = [["#985742","#583331"],["#69715b","#3b4645"],["#786770","#453b50"]][variant];
  const a = front(10);
  const b = right(11);
  box(c,-12,-11,24,22,1.8,4.5,stone);
  box(c,-11,-10,22,20,6,49,[
    "#a77d64",
    fade(c,[-10,10,56],[11,10,6],brick[0],"#835343"),
    fade(c,[11,-10,56],[11,10,6],brick[1],"#54403c"),
  ]);
  masonry(c,a,-11,11,6,48,variant);
  masonry(c,b,-10,10,6,48,variant+1);
  cornice(c,22,20,51,1.45,0.75,ivory);
  for (const z of [19,35]) {
    cornice(c,22,20,z,1.45,0.75,ivory);
    for (const x of [-8,3]) {
      window(c,a,x,z+2,5.2,9,{trim:"#e2b482",lit:(z+x+variant)%3!==0});
      window(c,b,x,z+2,4.8,8.8,{trim:"#aa8a71",lit:(z+x+variant)%3===0});
    }
  }
  const eave = 55;
  for (const [low,high,color] of [[-13,0,tiles[1]],[13,0,tiles[0]]]) {
    const roof = (u,t) => [u,low+(high-low)*t,eave+22*t];
    face(c,[roof(-13,0),roof(13,0),roof(13,1),roof(-13,1)],
      fade(c,roof(-13,1),roof(13,0),color,low>0 ? tiles[1] : "#382e30"));
    for (let row=1;row<8;row++) {
      const t=row/8;
      path(c,[roof(-12.8,t),roof(12.8,t)],"#382c303a",0.8);
      path(c,[roof(-12.8,t+0.022),roof(12.8,t+0.022)],"#fad1a05e",0.43);
      for (let u=-11+(row%2)*2;u<13;u+=4) {
        path(c,[roof(u,t),roof(u,t-0.12)],"#392c32a0",0.49);
      }
    }
    path(c,[roof(-13,0),roof(13,0)],"#432e30",2);
  }
  face(c,[[13,-13,55],[13,13,55],[13,0,77]],"#aa714a");
  for (const y of [-6,-3,0,3,6]) path(c,[[13,y,56],[13,y,75-Math.abs(y)*1.6]],"#66483d",0.65);
  const gable = right(13.1);
  window(c,gable,-2.5,59,5,8,{trim:"#dda967",lit:true});
  path(c,[[-13,0,77],[13,0,77],[13,13,55]],"#c89870",1.5);
  box(c,-8,-4,5,4,64,16,["#ba987a","#a46b50","#684839"]);
  for (const z of [68,72,76]) path(c,[[-8,0,z],[-3,0,z],[-3,-4,z]],"#623f35",0.65);
  box(c,-8.8,-4.8,6.6,5.6,80,2,["#d0a585","#865746","#664438"]);
  door(c,a,-3.4,6,6.8,11,"#e0b386","#5b4b42");
  window(c,a,-9,8,3.6,6,{trim:"#c29068",lit:true});
  window(c,a,5.5,8,3.6,6,{trim:"#c29068",lit:true});
  face(c,[[-5.7,9.9,19],[5.7,9.9,19],[5.7,15,16],[-5.7,15,16]],tiles[0]);
  for (let x=-5;x<5.7;x+=1.65) path(c,[[x,10,19],[x,15,16]],"#e0a97e",0.6);
  stairs(c,-4.8,10,9.6);
  pot(c,-8,13,2,3.4,true);
  pot(c,8,13,2,3.4,true);
}

function greenhouse(c, variant) {
  const frames = [
    ["#d8d6a5","#9aa980","#5b7964"],
    ["#c9e0cc","#8eae97","#567a70"],
    ["#e0c994","#a39366","#6f6d56"],
  ][variant];
  const a = front(11);
  const b = right(12);
  box(c,-13,-12,26,24,1.8,5,["#d2bc90","#8e8060","#6e6b53"]);
  for (const y of [-6,1,7]) {
    box(c,-9,y,19,3,6,2,["#a08c58","#8a633f","#614c36"]);
    for (const x of [-7,-3,1,5,9]) pot(c,x,y+1.5,8,2.6,(x+y+variant)%3===0);
  }
  const glass = ["#8fd9c392","#8cd9e097","#afdec48c"][variant];
  const wall = (at,u,v) => fade(c,at(u,26),at(v,6),"#8fd9c968","#1d554eaa");
  panel(c,a,-12,6,24,22,wall(a,-12,12),frames[2]);
  panel(c,b,-11,6,22,22,wall(b,-11,11),frames[2]);
  for (const [at,min,max] of [[a,-12,12],[b,-11,11]]) {
    for (let u=min;u<=max;u+=(max-min)/6) path(c,[at(u,6),at(u,28)],frames[0],0.88);
    for (const z of [7,18,27]) path(c,[at(min,z),at(max,z)],frames[1],1);
    for (let u=min+1;u<max-3;u+=7) {
      face(c,[at(u,24),at(u+2,24),at(u+6,10),at(u+4,10)],"#e4fff04a",null);
    }
  }
  const apex=50;
  for (const edge of [-12.3,12.3]) {
    const roof = (u,t) => [u,edge*(1-t),28+(apex-28)*t];
    face(c,[roof(-13,0),roof(13,0),roof(13,1),roof(-13,1)],
      fade(c,roof(-13,1),roof(13,0),glass,edge>0 ? "#5d9d92a0" : "#39746cb3"));
    for (let u=-13;u<=13;u+=4.33) path(c,[roof(u,0),roof(u,1)],frames[0],0.86);
    for (const t of [0.02,0.44,0.96]) path(c,[roof(-13,t),roof(13,t)],frames[1],1);
    for (const u of [-9,-2,5]) face(c,[roof(u,0.16),roof(u+1.8,0.16),roof(u+4,0.87),roof(u+2.5,0.87)],"#eefff66b",null);
  }
  face(c,[[13,-12.3,28],[13,12.3,28],[13,0,apex]],"#5f958fbc",frames[0]);
  path(c,[[13,0,29],[13,0,apex]],frames[0],1);
  box(c,-4,1,8,5,48,2,frames);
  face(c,[[-3.6,1,50],[3.6,1,50],[3.6,6,52],[-3.6,6,52]],"#45776b",frames[0]);
  panel(c,a,-3.7,6,7.4,15,"#35665a",frames[1]);
  panel(c,a,-2.8,9,5.6,10,glass,frames[0]);
  path(c,[a(1.7,13),a(3,13)],"#ead399",0.9);
  box(c,-11,12,6,3,2,3,stone);
  box(c,6,12,6,3,2,3,stone);
  pot(c,-8,13.5,5,4,true);
  pot(c,9,13.5,5,4,true);
  stairs(c,-4,11,8);
}

function tiledEaves(c, extent, z, shades) {
  const corners = [[-extent,-extent],[extent,-extent],[extent,extent],[-extent,extent]];
  const inset = 0.58;
  for (const i of [0,3,1,2]) {
    const [ax,ay]=corners[i];
    const [bx,by]=corners[(i+1)%4];
    const point=(u,t) => {
      const scale=1-t*(1-inset);
      return [(ax+(bx-ax)*u)*scale,(ay+(by-ay)*u)*scale,z+t*9+Math.pow(Math.abs(u-0.5)*2,5)*3*(1-t)];
    };
    const outline = [point(0,0),point(0.18,0),point(0.5,0),point(0.82,0),point(1,0),point(1,1),point(0,1)];
    face(c,outline,fade(c,point(0.3,1),point(0.8,0),shades[i%2],shades[2]));
    for (let u=0.07;u<1;u+=0.095) {
      path(c,[point(u,0.02),point(u,0.52),point(u,0.96)],"#263b428c",0.65);
      path(c,[point(u+0.015,0.04),point(u+0.015,0.86)],"#adc5be63",0.38);
    }
    for (const t of [0.31,0.68]) path(c,[point(0,t),point(0.5,t),point(1,t)],"#242f3e8c",0.5);
    path(c,outline.slice(0,5),"#d2aa70",1.0);
    const tip=point(1,0);
    path(c,[point(0.84,0),tip,[tip[0]*1.035,tip[1]*1.035,tip[2]+2]],"#e5c088",0.83);
  }
}

function pagoda(c, variant) {
  const lacquer=[["#a44536","#612f37"],["#ab623a","#744136"],["#906146","#5b3d40"]][variant];
  const roofs=[["#648a83","#526876","#253b49"],["#6c7770","#575b60","#303b45"],["#657990","#555e7d","#30364e"]][variant];
  box(c,-13.3,-13.3,26.6,26.6,1.8,4.2,stone);
  for (const [n,base,h] of [[10.3,6,19],[7.3,34,15],[4.8,57,13]]) {
    const tint = fade(c,[-n,n,base+h],[n,n,base],lacquer[0],"#563638");
    box(c,-n,-n,2*n,2*n,base,h,["#c89a67",tint,lacquer[1]]);
    const a=front(n+0.04);
    const b=right(n+0.04);
    for (const [at,shade] of [[a,"#d29158"],[b,"#9e654f"]]) {
      for (const u of [-n+0.8,0,n-0.8]) {
        path(c,[at(u,base),at(u,base+h)],"#4e3330",1.65);
        path(c,[at(u+0.45,base+0.6),at(u+0.45,base+h)],shade,0.56);
      }
      for (const u of [-n*0.74,n*0.18]) window(c,at,u,base+4,n*0.58,h*0.44,
        {trim:"#b98963",lit:true,mullion:n>6});
      path(c,[at(-n,base+h-2),at(n,base+h-2)],"#e1b681",1);
    }
    box(c,-n-0.8,-n-0.8,2*n+1.6,2*n+1.6,base+h-0.5,1.6,darkTimber);
    tiledEaves(c,n+3.4,base+h+1.2,roofs);
  }
  box(c,-1.65,-1.65,3.3,3.3,79,4.6,["#f6d18c","#be8b56","#845441"]);
  path(c,[[0,0,83],[0,0,91]],"#bf915e",1.45);
  face(c,[[-1.5,0,87],[0,-1.5,87],[1.5,0,87],[0,1.5,87]],"#efc481");
  door(c,front(10.4),-2.4,6,4.8,11,"#cf9967","#4d3835");
  stairs(c,-4,10,8);
  for (const x of [-8,8]) {
    path(c,[[x,13,2],[x,13,12]],"#483936",1.1);
    box(c,x-1.25,12,2.5,2.5,8,3.4,["#ffd898","#e29a5a","#9c5947"]);
    box(c,x-1.6,11.7,3.2,3.2,11.4,1,roofs);
    pot(c,x,8,2,3.1,true);
  }
}

function cyberTower(c, variant) {
  const accent=["#ed93f1","#7beaeb","#ffa989"][variant];
  const bloom=["#ba5eef","#36bac8","#e97a8a"][variant];
  const frame=["#ddd4ce","#a7a5b3","#73798e"];
  const tint=["#5f577b","#3c6875","#665a70"][variant];
  const a=front(10.5);
  const b=right(11.5);
  box(c,-13,-12,26,24,1.8,4.2,stone);
  box(c,-11.5,-10.5,23,21,6,66,[
    "#7f869f",
    fade(c,[-11,10,68],[11,10,6],tint,"#26394b"),
    fade(c,[12,-10,68],[12,10,7],"#566683","#212d42"),
  ]);
  for (const [at,min,max] of [[a,-11,11],[b,-10,10]]) {
    for (let u=min;u<max;u+=3) {
      path(c,[at(u,7),at(u,71)],"#bbadcd45",0.55);
      path(c,[at(u+0.7,7),at(u+0.7,71)],"#1c3045b8",0.63);
    }
    for (const z of [11,25,40,55]) {
      for (const u of [min+1.1,min+7.5,min+13.9]) {
        window(c,at,u,z,4.6,9,{trim:"#7b8aa0",glass:variant===1?"#77d3cf":"#9b9fdb",
          lit:z===11 || ((z+Math.floor(u)+variant)%5===0),mirror:true,mullion:false});
      }
    }
  }
  cornice(c,23,21,37.1,1.6,1.0,frame);
  cornice(c,23,21,53.1,1.6,1.0,frame);
  cornice(c,23,21,20.4,2.3,1.5,frame);
  c.save();
  c.shadowColor=bloom;
  c.shadowBlur=7;
  path(c,[[-13,12,21.5],[13,12,21.5],[13,-12,21.5]],bloom,2.3);
  path(c,[[-13,12,21.8],[13,12,21.8],[13,-12,21.8]],accent,1.15);
  c.restore();
  box(c,-13,-12,26,24,70,3.4,frame);
  // Rooftop walls sit around a planted terrace and an exposed service unit.
  box(c,-11,-10,22,20,73.4,1,["#6c8276","#5d6669","#46555e"]);
  box(c,-9,-7,6,14,74,1.5,["#a8ae68","#697959","#475d51"]);
  for (const y of [-5,-1,3,6]) pot(c,-6,y,75,3.3,true);
  for (const y of [-4,-1,2,5]) face(c,bounds(-1,y,2.7,2.7,74.2),"#c3b797","#78827b",0.35);
  box(c,2,-9,7,5,74,3.7,["#adbac0","#788a9a","#566374"]);
  for (let x=2.5;x<9;x+=1.25) path(c,[[x,-8.6,77.8],[x,-4.4,77.8]],"#505b75",0.5);
  for (const [x,y,w,d] of [[-12.4,-11.4,24.8,1.1],[-12.4,-10.4,1.1,21.9],
    [11.3,-10.4,1.1,21.9],[-12.4,10.4,24.8,1.1]]) box(c,x,y,w,d,73.2,3.6,frame);
  path(c,[[6,-5,77.8],[6,-5,96]],"#6f819a",1.0);
  path(c,[[3.6,-5,92],[8.4,-5,92]],"#c3d8d5",0.78);
  path(c,[[6,-5,95],[6,-5,97]],accent,1.4);
  const sign=front(12.5);
  panel(c,sign,-9.3,44,11,16,"#1f294f");
  panel(c,sign,-8.6,45,9.6,14,fade(c,sign(0,59),sign(-8,45),"#4a3779","#263558"),bloom);
  const icon=[[-7,51],[-4.6,55.3],[-2.5,53.9],[-0.6,56],[-2.2,48.7],[-4.25,50.4],[-7,51]];
  c.save();
  c.shadowColor=bloom;
  c.shadowBlur=6;
  path(c,icon.map(([u,z])=>sign(u,z)),accent,0.95);
  c.restore();
  panel(c,a,-3.7,6,7.4,12,"#253849","#c3b699");
  panel(c,a,-2.9,7,5.8,9,fade(c,a(2.9,16),a(-2.9,7),"#49a4a6","#daad70"),"#a7b8ad");
  path(c,[a(0,7),a(0,16)],"#40545e",0.6);
  stairs(c,-5,10.6,10);
  pot(c,-8,13,2,4.1,true);
  pot(c,8,13,2,3.6);
}

const families = [townhouse,greenhouse,pagoda,cyberTower];
const sprites = new Map();

export function building(style, variant = 0) {
  const key = style*3+variant;
  if (!sprites.has(key)) {
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 480;
    const c = canvas.getContext("2d");
    c.scale(3,3);
    c.translate(64,122);
    yard(c);
    families[style](c,variant);
    sprites.set(key,canvas);
  }
  return sprites.get(key);
}
