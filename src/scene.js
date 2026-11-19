import { building, polygon } from "./art.js";
import { landmarkBounds, landmarkSprite } from "./landmarks.js";
import { hash, tileKey } from "./world.js";

const W = 28;
const H = 14;
const project = (x, y) => [(x - y) * W, (x + y) * H];
const corners = [[0,-H],[W,0],[0,H],[-W,0]];
const diamond = (c, x, y, color, inset = 1, stroke) =>
  polygon(c, corners.map(([dx, dy]) => [x + dx * inset, y + dy * inset]), color, stroke);

function line(c, a, b, color, width = 1) {
  c.beginPath();
  c.moveTo(...a);
  c.lineTo(...b);
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}

function ellipse(c, x, y, w, h, color) {
  c.beginPath();
  c.ellipse(x, y, w, h, 0, 0, 2 * Math.PI);
  c.fillStyle = color;
  c.fill();
}

function terrain(c, tile, x, y) {
  const tone = Math.floor(tile.noise * 4);
  const lawn = ["#8b9a5c", "#91a466", "#9da965", "#a0ae6d"][tone];
  const road = tile.type === "road";
  diamond(c, x, y, lawn, 1.025);
  if (road) {
    diamond(c, x, y, "#c0b69b", 1.025);
    // Paving slabs follow the two street axes.
    for (const side of [-1, 1]) {
      for (const offset of [4, 11, 18, 25]) {
        const dy = (W-offset)*0.5;
        line(c,[x+side*offset,y-dy],[x+side*(offset-2),y-dy+1],"#8d8977",0.55);
        line(c,[x+side*offset,y+dy],[x+side*(offset-2),y+dy-1],"#8d8977",0.55);
      }
    }
    for (const [active, direction] of [[tile.roadX, 1], [tile.roadY, -1]]) {
      if (!active) continue;
      polygon(c, [[x-direction*26,y-1],[x-direction*2,y-13],
        [x+direction*26,y+1],[x+direction*2,y+13]], "#8e8f83");
      polygon(c, [[x-direction*23,y-2.5],[x-direction*5,y-11.5],
        [x+direction*23,y+2.5],[x+direction*5,y+11.5]], "#6e7977");
    }
    if (tile.roadX !== tile.roadY) {
      const sign = tile.roadX ? 1 : -1;
      line(c, [x-sign*6,y-3], [x+sign*6,y+3], "#c1b699",0.8);
      for (const side of [-1,1]) {
        line(c,[x+sign*(-14+side*10),y-7-side*5],[x+sign*(14+side*10),y+7-side*5],
          side===1 ? "#a8a592" : "#ded2ac",0.72);
      }
      if (tile.noise > 0.93) {
        c.fillStyle="#4c5655";
        c.fillRect(x+4,y-2,3.5,1.1);
      }
    } else {
      for (let u=-4;u<=4;u+=2.7) {
        line(c,[x+7+u,y-4+u*0.5],[x+10+u,y-5.5+u*0.5],"#ccc8b0",0.68);
      }
    }
    return;
  }
  if (tile.type === "plot") {
    diamond(c, x, y, "#a0a379", 0.86);
    diamond(c, x, y - 1, ["#c0bb89","#c8c194","#c6c394","#c9c697"][tone], 0.75);
    if (tile.demo === undefined) {
      diamond(c, x, y - 1, "#cec18d", 0.57, "#a29769");
      diamond(c, x, y - 2, "#d6cd9e", 0.46);
      for (let i=0;i<4;i++) {
        const [dx,dy]=corners[i];
        ellipse(c,x+dx*0.53,y-1+dy*0.53,1.6,1.1,"#9d8a60");
        ellipse(c,x+dx*0.53-0.35,y-1.4+dy*0.53,0.85,0.66,"#eee0af");
      }
      line(c, [x-4,y-2], [x+4,y-2], "#aba071",0.72);
      line(c, [x,y-5], [x,y+1], "#aba071",0.72);
    }
  }
  const texture = hash(tile.key);
  for (let i = 0; i < 12; i++) {
    const offset = Math.imul(texture+i*317,1597334677) >>> 0;
    const dx = (offset % 49) - 24;
    const dy = (((offset >>> 16) % 21) - 10)*(1-Math.abs(dx)/W);
    c.fillStyle = i % 2 ? "#eee6b155" : "#4e6e4768";
    c.fillRect(x + dx, y + dy, (offset % 3) * 0.6 + 0.7, 0.65);
    if (tile.type === "park" && i%3 === 0) {
      line(c,[x+dx,y+dy],[x+dx-1,y+dy-2.4],"#54744d",0.65);
      line(c,[x+dx,y+dy],[x+dx+1.5,y+dy-1.6],"#bac782",0.68);
      if (tile.noise>0.64 && i%2===0) ellipse(c,x+dx-1,y+dy-2.6,1,0.72,"#f2c6a3");
    }
  }
}

function shoreline(c, tile, x, y) {
  tile.edges.forEach((edge, i) => {
    if (!edge) return;
    const [ax, ay] = corners[i];
    const [bx, by] = corners[(i + 1) % 4];
    const ox = (ax + bx) * 0.28;
    const oy = (ay + by) * 0.35;
    line(c, [x+ax+ox,y+ay+oy+13], [x+bx+ox,y+by+oy+13], "#497e76", 12);
    line(c, [x+ax+ox,y+ay+oy+10], [x+bx+ox,y+by+oy+10], "#76a594", 5);
    polygon(c, [[x+ax,y+ay],[x+bx,y+by],[x+bx,y+by+11],[x+ax,y+ay+11]],
      i < 2 ? "#8c8567" : "#6f7562");
    line(c, [x+ax,y+ay+3], [x+bx,y+by+3], "#baaf80", 2);
    line(c, [x+ax,y+ay+8], [x+bx,y+by+8], "#5f6860");
    for (const t of [0.12,0.38,0.66,0.9]) {
      const px=x+ax+(bx-ax)*t;
      const py=y+ay+(by-ay)*t;
      line(c,[px,py+4],[px+0.5,py+7.5],"#535b4e",0.7);
      if (t<0.8) line(c,[px+ox,py+oy+12],[px+ox+(bx-ax)*0.12,py+oy+12+(by-ay)*0.12],"#abd0b773",0.88);
    }
    if (tile.noise > 0.68) {
      const px = x+(ax+bx)*0.64;
      const py = y+(ay+by)*0.74+11;
      ellipse(c,px,py+2,6,2.5,"#355e58");
      polygon(c,[[px-5,py],[px-2,py-4],[px+3,py-4],[px+6,py],[px+1,py+2]],"#879180");
      line(c,[px-2,py-4],[px+3,py-4],"#b6b7a0");
    }
  });
}

const trees = new Map();
function treeSprite(type) {
  if (trees.has(type)) return trees.get(type);
  const canvas = document.createElement("canvas");
  canvas.width = 147;
  canvas.height = 165;
  const c = canvas.getContext("2d");
  c.scale(3, 3);
  c.translate(22, 46);
  const shadow=c.createRadialGradient(8,3,0,8,3,16);
  shadow.addColorStop(0,"#263d3a9c");
  shadow.addColorStop(1,"#263d3a00");
  c.save();
  c.scale(1,0.55);
  c.fillStyle=shadow;
  c.fillRect(-12,-7,39,22);
  c.restore();
  polygon(c,[[-2.1,1],[-1.3,-26],[0.8,-28],[2.1,0],[0,2]],"#65513a","#454b34",0.45);
  line(c,[-1,0],[-0.5,-25],"#be8d56",0.85);
  line(c,[0,-10],[7,-20],"#614d37",1);
  line(c,[0,-14],[-6,-23],"#614d37",1.15);
  const colors = [
    ["#314e3c","#436c44","#63874b","#81a65a","#b3bd78"],
    ["#486339","#627e3d","#81984a","#a0ae58","#caca81"],
    ["#794e67","#a76b81","#c98597","#df9fa6","#f3c3b8"],
    ["#244d42","#386c52","#508057","#6d9964","#a5b778"],
  ][type];
  const narrow=type===3;
  for (let i=0;i<38;i++) {
    const angle=i*2.4;
    const distance=0.26+((i*17)%25)/31;
    const px=Math.cos(angle)*distance*(narrow?7:14);
    const py=Math.sin(angle)*distance*(narrow?15:11)-(narrow?27:24);
    const w=3.5+(i%5)*0.76;
    const h=3+(i%4)*0.8;
    const light=px*0.65+py<-(narrow?28:24);
    polygon(c,[[px-w,py+0.5],[px-w*0.7,py-h*0.7],[px-w*0.14,py-h],
      [px+w*0.69,py-h*0.64],[px+w,py+0.6],[px+w*0.48,py+h*0.73],
      [px-w*0.23,py+h]],colors[light?2+(i%2):i%3]);
    if (i%2===0) ellipse(c,px-w*0.21,py-h*0.48,1.15+i%3*0.32,0.64,colors[light?4:3]);
    if (type===2 && i%3===0) ellipse(c,px+1,py,0.8,0.75,"#ffd8b8");
  }
  trees.set(type, canvas);
  return canvas;
}

function bridge(c, a, b, zoom) {
  const [ax, ay] = project(a.x, a.y);
  const [bx, by] = project(b.x, b.y);
  const side = a.x === b.x ? 1 : -1;
  const deck = (offset, color) => polygon(c, [[ax-13,ay+side*6+offset],[bx-13,by+side*6+offset],
    [bx+13,by-side*6+offset],[ax+13,ay-side*6+offset]], color);
  deck(14, "#0b363d8c");
  for (let i = 0.15; i < 0.95; i += 0.18) {
    const x = ax + (bx-ax)*i;
    const y = ay + (by-ay)*i;
    line(c, [x+8,y], [x+8,y+16], "#64776b", 8);
  }
  deck(5, "#566e65");
  deck(0, "#b3ad92");
  line(c, [ax,ay], [bx,by], "#788783", Math.max(7,0.9/zoom));
  line(c, [ax-12,ay+side*6-3], [bx-12,by+side*6-3], "#e4d4ac", 2);
  line(c, [ax+12,ay-side*6-3], [bx+12,by-side*6-3], "#e4d4ac", 2);
}

function islandLayer(island) {
  const tiles = [...island.tiles.values()].map((tile) => {
    const [x, y] = project(tile.x,tile.y);
    return { tile, x, y };
  }).sort((a, b) => a.y - b.y);
  const site = island.landmark.landmark;
  const [landmarkX,landmarkY] = project(site.x,site.y);
  const side = landmarkBounds.x*site.scale;
  const left = Math.min(Math.min(...tiles.map((item) => item.x)) - 55,landmarkX-side);
  const right = Math.max(Math.max(...tiles.map((item) => item.x)) + 55,landmarkX+side);
  const top = Math.min(tiles[0].y - 90,landmarkY-landmarkBounds.y*site.scale);
  const bottom = tiles.at(-1).y + 48;
  const resolution = tiles.length > 600 ? 0.68 : 1.6;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil((right-left)*resolution);
  canvas.height = Math.ceil((bottom-top)*resolution);
  const c = canvas.getContext("2d");
  c.scale(resolution,resolution);
  c.translate(-left,-top);
  for (const {tile,x,y} of tiles) if (tile.edges.some(Boolean)) shoreline(c,tile,x,y);
  for (const {tile,x,y} of tiles) terrain(c,tile,x,y);
  const objects = [];
  for (const item of tiles) {
    const {tile,x,y} = item;
    const inLandmarkPark = Math.abs(tile.x-site.x) < site.columns/2 && Math.abs(tile.y-site.y) < site.rows/2;
    if (tile.landmark) {
      objects.push({tile,x:landmarkX,y:landmarkY});
    } else if (tile.demo !== undefined ||
        (tile.type === "park" && !inLandmarkPark && (tile.noise < 0.11 || tile.noise > 0.48)) ||
        (tile.type === "road" && tile.noise > 0.962 && !tile.edges.some(Boolean))) objects.push(item);
  }
  objects.sort((a,b)=>a.y-b.y);
  return { island, canvas, left, top, right, bottom, objects, resolution };
}

function overviewLayer(layer) {
  const canvas = document.createElement("canvas");
  const resolution = 0.30;
  canvas.width = Math.ceil((layer.right-layer.left)*resolution);
  canvas.height = Math.ceil((layer.bottom-layer.top)*resolution);
  const c = canvas.getContext("2d");
  c.scale(resolution,resolution);
  c.translate(-layer.left,-layer.top);
  c.drawImage(layer.canvas,layer.left,layer.top,
    layer.canvas.width/layer.resolution,layer.canvas.height/layer.resolution);
  for (const item of layer.objects) drawObject(c,item,0.3);
  return { canvas, resolution };

}

const spriteScale = 0.75;
function drawBuilding(c, x, y, family, variant) {
  c.drawImage(building(family, variant), x-64*spriteScale, y-122*spriteScale,
    128*spriteScale, 160*spriteScale);
}

function drawObject(c, {tile,x:px,y:py}, zoom) {
  if (tile.demo !== undefined) {
    drawBuilding(c,px,py,tile.demo,tile.variant);
  } else if (tile.landmark) {
    const {type,variant,scale} = tile.landmark;
    const {width,height,x,y} = landmarkBounds;
    c.drawImage(landmarkSprite(type,variant),px-x*scale,py-y*scale,width*scale,height*scale);
  } else if (tile.type === "park") {
    const tree = treeSprite(tile.noise > 0.89 ? 2 : hash(tile.key)%3 === 0 ? 3 : tile.noise > 0.65 ? 1 : 0);
    const scale = 0.58+hash(tile.key)%31/100;
    c.drawImage(tree,px-22*scale,py-46*scale,49*scale,55*scale);
  } else if (zoom > 0.42) {
    ellipse(c,px+9,py+4,4,2,"#45574877");
    line(c,[px+8,py+3],[px+8,py-10],"#4e594d",2);
    ellipse(c,px+8,py-10,3,2,"#f0dfaa");
  }
}

export class Scene {
  constructor(canvas, click) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d", { alpha:false });
    this.click = click;
    this.camera = { x:0, y:0, zoom:1 };
    this.layers = [];
    this.layersByIsland = new WeakMap();
    this.placed = new Map();
    new ResizeObserver(() => {
      const initial = !this.width;
      this.width = canvas.clientWidth;
      this.height = canvas.clientHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(this.width*this.dpr);
      canvas.height = Math.round(this.height*this.dpr);
      if (initial) this.fit();
      else this.invalidate();
    }).observe(canvas);
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      this.drag = { x:event.offsetX, y:event.offsetY, moved:false, id:event.pointerId };
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (this.drag && this.drag.id === event.pointerId) {
        const dx = event.offsetX-this.drag.x;
        const dy = event.offsetY-this.drag.y;
        if (this.drag.moved || Math.hypot(dx,dy) > 4) {
          this.pan(dx,dy);
          Object.assign(this.drag,{ x:event.offsetX, y:event.offsetY, moved:true });
          canvas.classList.add("dragging");
        }
      }
      this.hover = this.pick(event.offsetX,event.offsetY);
      this.invalidate();
    });
    canvas.addEventListener("pointerup", (event) => {
      if (this.drag?.id !== event.pointerId) return;
      if (!this.drag.moved) this.click(this.pick(event.offsetX,event.offsetY));
      this.drag = null;
      canvas.classList.remove("dragging");
    });
    canvas.addEventListener("lostpointercapture", () => {
      this.drag = null;
      canvas.classList.remove("dragging");
    });
    canvas.addEventListener("pointerleave", () => { this.hover = null; this.invalidate(); });
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? this.height : 1);
      this.zoom(Math.exp(-Math.max(-220,Math.min(delta,220))*0.002),event.offsetX,event.offsetY);
    },{ passive:false });
    canvas.addEventListener("keydown", (event) => {
      const direction = { ArrowLeft:[48,0],ArrowRight:[-48,0],ArrowUp:[0,48],ArrowDown:[0,-48] }[event.key];
      if (direction) this.pan(...direction);
      else if (event.key === "+" || event.key === "=") this.zoom(1.3);
      else if (event.key === "-") this.zoom(1/1.3);
      else if (event.key === "Home") this.fit();
      else return;
      event.preventDefault();
    });
  }

  setWorld(map, overview) {
    this.map = map;
    this.layers = map.islands.map((island) => {
      if (!this.layersByIsland.has(island)) this.layersByIsland.set(island,islandLayer(island));
      return this.layersByIsland.get(island);
    });
    this.bounds = {
      left:Math.min(...this.layers.map((layer) => layer.left)),
      right:Math.max(...this.layers.map((layer) => layer.right)),
      top:Math.min(...this.layers.map((layer) => layer.top)),
      bottom:Math.max(...this.layers.map((layer) => layer.bottom)),
    };
    this.hover = null;
    if (overview) this.fit();
    else this.invalidate();
  }

  fit() {
    if (!this.width || !this.bounds) return;
    const {left,right,top,bottom} = this.bounds;
    const zoom = Math.min(1.42,(this.width-105)/(right-left),(this.height-110)/(bottom-top));
    this.fitZoom = Math.max(0.012,zoom);
    this.camera = { x:(left+right)/2, y:(top+bottom)/2, zoom:this.fitZoom };
    this.invalidate();
  }

  focus(tile) {
    const [x,y] = project(tile.x,tile.y);
    this.camera = { x, y:y-24, zoom:Math.max(this.camera.zoom,1.25) };
    this.invalidate();
  }

  pan(dx,dy) {
    this.camera.x -= dx/this.camera.zoom;
    this.camera.y -= dy/this.camera.zoom;
    this.invalidate();
  }

  zoom(factor,sx=this.width/2,sy=this.height/2) {
    const old = this.camera.zoom;
    const zoom = Math.max(Math.min(0.08,(this.fitZoom ?? 1)*0.85),Math.min(3.5,old*factor));
    this.camera.x += (sx-this.width/2)*(1/old-1/zoom);
    this.camera.y += (sy-this.height/2)*(1/old-1/zoom);
    this.camera.zoom = zoom;
    this.hover = this.pick(sx,sy);
    this.invalidate();
  }

  pick(sx,sy) {
    const {x,y,zoom} = this.camera;
    const px = x+(sx-this.width/2)/zoom;
    const py = y+(sy-this.height/2)/zoom;
    return this.map?.tiles.get(tileKey(Math.round((px/W+py/H)/2),Math.round((py/H-px/W)/2)));
  }

  invalidate() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => { this.frame = null; this.draw(); });
  }

  draw() {
    if (!this.width || !this.map) return;
    const c = this.context;
    const {x,y,zoom} = this.camera;
    const w = this.width;
    const h = this.height;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    const water = c.createLinearGradient(0,0,w,h);
    water.addColorStop(0,"#467d7a");
    water.addColorStop(0.48,"#286466");
    water.addColorStop(1,"#16484f");
    c.fillStyle = water;
    c.fillRect(0,0,w,h);
    const pixelX = x*zoom;
    const pixelY = y*zoom;
    for (let row=-1;row<h/28+1;row++) {
      for (let col=-1;col<w/45+1;col++) {
        const px = col*45 + (row%2)*20 - (pixelX%45);
        const py = row*28 - (pixelY%28);
        const n = hash(tileKey(col+Math.trunc(pixelX/45),row+Math.trunc(pixelY/28)));
        if (n%7 < 4) line(c,[px,py],[px+5+n%17,py],"#a2cebd35");
        if (n%11 === 0) line(c,[px+4,py+4],[px+12,py+4],"#9bc7b744");
      }
    }
    c.translate(w/2,h/2);
    c.scale(zoom,zoom);
    c.translate(-x,-y);
    const left = x-w/(2*zoom), right = x+w/(2*zoom);
    const top = y-h/(2*zoom), bottom = y+h/(2*zoom);
    const visible = (px,py,landmark) => {
      const side = landmark ? landmarkBounds.x : 55;
      const above = landmark ? landmarkBounds.y : 100;
      return px >= left-side && px <= right+side && py >= top-(landmark ? 49 : 25) && py <= bottom+above;
    };
    const layers = this.layers.filter((layer) =>
      layer.left <= right && layer.right >= left && layer.top <= bottom && layer.bottom >= top);
    const distant = zoom <= 0.32;
    for (const [a,b] of this.map.bridges) bridge(c,a,b,zoom);
    for (const layer of layers) {
      if (distant && !layer.overview) layer.overview = overviewLayer(layer);
      const {canvas,resolution} = distant ? layer.overview : layer;
      c.drawImage(canvas,layer.left,layer.top,canvas.width/resolution,canvas.height/resolution);
      if (this.selectedIsland === layer.island.id && this.layers.length > 1) {
        for (const tile of layer.island.tiles.values()) {
          if (!tile.edges.some(Boolean)) continue;
          const [px,py] = project(tile.x,tile.y);
          if (!visible(px,py)) continue;
          tile.edges.forEach((edge,i) => {
            if (!edge) return;
            const [ax,ay] = corners[i];
            const [bx,by] = corners[(i+1)%4];
            line(c,[px+ax,py+ay],[px+bx,py+by],"#d6f1b5",Math.max(1.6,0.85/zoom));
          });
        }
      }
    }
    if (this.hover && this.selectedName) {
      const [px,py] = project(this.hover.x,this.hover.y);
      const open = this.hover.type === "plot" && this.hover.demo === undefined && !this.placed.has(this.hover.key);
      diamond(c,px,py,open ? "#a3f3bdbb" : "#eeb39e8c",0.96,open ? "#e0ffe0" : "#f4c2af");
    }
    const objects = [];
    for (const layer of distant ? [] : layers) {
      for (const item of layer.objects) if (visible(item.x,item.y,item.tile.landmark)) objects.push(item);
    }
    for (const [key,name] of this.placed) {
      const tile = this.map.tiles.get(key);
      const [px,py] = project(tile.x,tile.y);
      if (visible(px,py)) objects.push({ tile, x:px, y:py, name });
    }
    objects.sort((a,b) => a.y-b.y);
    for (const item of objects) {
      const {x:px,y:py,name} = item;
      if (name) {
        const n = hash(name.id);
        diamond(c,px,py,"#68cbb0",0.96,"#ebf7ad");
        drawBuilding(c,px,py,n%4,(n>>>6)%3);
      } else {
        drawObject(c,item,zoom);
      }
    }
    c.setTransform(this.dpr,0,0,this.dpr,0,0);
    for (const {x:px,y:py,name} of objects) {
      if (!name) continue;
      const sx = (px-x)*zoom+w/2;
      const sy = (py-y-86)*zoom+h/2;
      if (zoom < 0.48) {
        ellipse(c,sx,sy,3,3,"#b8f1bd");
        continue;
      }
      c.font = "600 13px system-ui";
      c.textAlign = "center";
      c.textBaseline = "middle";
      const labelWidth = Math.min(230,c.measureText(name.name).width+18);
      c.beginPath();
      c.roundRect(sx-labelWidth/2,sy-11,labelWidth,22,5);
      c.fillStyle = "#174c40";
      c.fill();
      c.fillStyle = "#fffde8";
      c.fillText(name.name,sx,sy,labelWidth-12);
    }
  }
}
