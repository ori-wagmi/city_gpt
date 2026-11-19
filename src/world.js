export const presets = [0, 100, 1000, 10000];
export const landmarkTypes = ["Giga Factory", "Sky Needle", "Harbor Stadium", "Island Basilica"];
export const tileKey = (x, y) => `${x},${y}`;
export const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

export function hash(value) {
  let result = 2166136261;
  for (const char of String(value)) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return (result ^ (result >>> 16)) >>> 0;
}

function random(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let n = Math.imul(seed ^ (seed >>> 15), seed | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

const districtNames = [
  "Cedar Key", "Glasswater", "Juniper Reach", "Koi Harbor", "Lantern Point",
  "Fernbank", "Saltgrass", "Willow Quay", "Tern Island", "Iris Cove",
  "Moss Landing", "Pinewater", "Reed Hollow", "Pearl Bay", "Driftwood",
];

function nextPosition(islands, seed) {
  const used = new Set(islands.map(({ col, row }) => tileKey(col, row)));
  for (let ring = 1; ; ring++) {
    const options = [];
    for (let y = -ring; y <= ring; y++) {
      for (let x = -ring; x <= ring; x++) {
        if (Math.max(Math.abs(x), Math.abs(y)) === ring) options.push([x, y]);
      }
    }
    const order = ([x,y]) => (x*x+y*y)*2 + hash(`${seed}:${x},${y}`)/4294967296;
    options.sort((a,b) => order(a)-order(b));
    const available = options.find(([x, y]) => !used.has(tileKey(x, y)) &&
      [[1, 0], [0, 1], [-1, 0], [0, -1]].some(([dx, dy]) => used.has(tileKey(x + dx, y + dy))));
    if (available) return available;
  }
}

export function addIsland(state, target = 0, seed = newSeed()) {
  const id = state.islands.length;
  const [col, row] = id ? nextPosition(state.islands, state.layoutSeed) : [0, 0];
  const parent = state.islands.find((item) => Math.abs(col - item.col) + Math.abs(row - item.row) === 1);
  const island = { id, col, row, parent: parent?.id ?? null, seed, target };
  return { ...state, islands: [...state.islands, island] };
}

export function createWorld(preset = 0, seed = newSeed()) {
  const count = { 0: 1, 100: 2, 1000: 5, 10000: 15 }[preset];
  const rng = random(seed);
  let state = { version: 1, preset, layoutSeed: seed, islands: [], placements: {} };
  let remaining = preset;
  for (let i = 0; i < count; i++) {
    const left = count - i;
    const target = left === 1 ? remaining : Math.round(remaining / left * (0.84 + rng() * 0.32));
    state = addIsland(state, target, Math.floor(rng() * 4294967296));
    remaining -= target;
  }
  return state;
}

// Footprints use the same 28-unit tile axes as the isometric map.
const landmarkFootprints = [[70,56],[44,44],[62,58],[48,58]];
function findLandmark(tiles, centerX, centerY, id) {
  const type = (id+1)%landmarkTypes.length;
  const variant = Math.floor(id/landmarkTypes.length)%4;
  const [width,depth] = landmarkFootprints[type];
  let landmark;
  let bestScore = -Infinity;
  for (const tile of tiles.values()) {
    if (tile.type !== "park") continue;
    const closestCenter = Math.max(0,Math.hypot(tile.x-centerX,tile.y-centerY)-Math.SQRT2);
    if (2.8-closestCenter*0.09 <= bestScore) continue;
    for (let columns=1;columns<=3;columns++) {
      for (let rows=1;rows<=3;rows++) {
        let clear = true;
        for (let dx=0;dx<columns && clear;dx++) {
          for (let dy=0;dy<rows;dy++) {
            if (tiles.get(tileKey(tile.x+dx,tile.y+dy))?.type !== "park") {
              clear = false;
              break;
            }
          }
        }
        if (!clear) continue;
        const x = tile.x+(columns-1)/2;
        const y = tile.y+(rows-1)/2;
        const scale = Math.min(1,(columns*28-1)/width,(rows*28-1)/depth);
        const score = scale*2.8-Math.hypot(x-centerX,y-centerY)*0.09;
        if (score > bestScore) {
          bestScore = score;
          landmark = { tile:tiles.get(tileKey(Math.round(x),Math.round(y))), type, variant, x, y, scale, columns, rows };
        }
      }
    }
  }
  const {tile,...visual} = landmark;
  tile.landmark = visual;
  return tile;
}

function generateIsland(spec, spacing, size = spec.target ? Math.max(6, Math.ceil(Math.sqrt(spec.target / 1.38))) : Math.max(9, Math.floor(spacing * 0.20))) {
  const rng = random(spec.seed);
  const centerX = spec.col * spacing;
  const centerY = spec.row * spacing;
  const phase = rng() * Math.PI * 2;
  const twist = rng() * Math.PI * 2;
  const stretch = 0.83 + rng() * 0.30;
  const roadStep = 4 + Math.floor(rng() * 3);
  const parkX = Math.round((rng() - 0.5) * size) || 1;
  const parkY = (rng() > 0.5 ? 1 : -1) * Math.round(size * 0.43);
  const limit = Math.ceil(size * 1.55);
  const tiles = new Map();
  const plots = [];
  for (let y = -limit; y <= limit; y++) {
    for (let x = -limit; x <= limit; x++) {
      const angle = Math.atan2(y / stretch, x);
      const radius = size * (0.97 + 0.18 * Math.sin(angle * 3 + phase)
        + 0.10 * Math.sin(angle * 5 + twist) + 0.06 * Math.cos(angle * 8 + phase));
      if (Math.hypot(x, y / stretch) > radius) continue;
      const noise = rng();
      const road = x % roadStep === 0 || y % roadStep === 0;
      const park = Math.hypot(x - parkX, (y - parkY) * 1.3) < Math.max(2.3, size * 0.23);
      const type = road ? "road" : park || noise < 0.16 ? "park" : "plot";
      const key = tileKey(centerX + x, centerY + y);
      const tile = { x: centerX + x, y: centerY + y, key, island: spec.id, type,
        noise, roadX: y % roadStep === 0, roadY: x % roadStep === 0 };
      tiles.set(key, tile);
      if (type === "plot") plots.push(tile);
    }
  }
  for (const tile of tiles.values()) {
    tile.edges = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) =>
      !tiles.has(tileKey(tile.x + dx, tile.y + dy)));
  }
  // Correlated block density leaves some areas visibly more open.
  const weights = new Map();
  for (const tile of plots) {
    const block = tileKey(Math.floor((tile.x - centerX) / roadStep), Math.floor((tile.y - centerY) / roadStep));
    if (!weights.has(block)) weights.set(block, rng() * 0.48);
    tile.rank = rng() + weights.get(block);
    tile.blockStyle = hash(`${spec.seed}:${block}`) % 4;
  }
  const capacity = spec.target ? Math.ceil(spec.target / 0.8) : plots.length;
  if (plots.length < capacity) return generateIsland(spec, spacing, size + 1);
  plots.sort((a, b) => a.rank - b.rank);
  for (const tile of plots.splice(capacity)) tile.type = "park";
  for (const tile of plots.slice(0, spec.target)) {
    tile.demo = rng() < 0.48 ? tile.blockStyle : Math.floor(rng() * 4);
    tile.variant = Math.floor(rng() * 3);
  }
  const landmark = findLandmark(tiles,centerX+parkX,centerY+parkY,spec.id);
  return { ...spec, centerX, centerY, tiles, plots, landmark, name: districtNames[spec.id % districtNames.length] +
    (spec.id >= districtNames.length ? ` ${Math.floor(spec.id / districtNames.length) + 1}` : "") };
}

export function buildMap(state, previous) {
  const spacing = { 0: 33, 100: 33, 1000: 48, 10000: 78 }[state.preset];
  const islands = state.islands.map((spec) => {
    const existing = previous?.preset === state.preset && previous.islands[spec.id];
    return existing && existing.source === spec ? existing : { ...generateIsland(spec, spacing), source: spec };
  });
  const tiles = new Map(islands.flatMap((island) => [...island.tiles]));
  const bridges = [];
  for (const island of islands) {
    if (island.parent === null) continue;
    const parent = islands[island.parent];
    const dx = Math.sign(parent.centerX - island.centerX);
    const dy = Math.sign(parent.centerY - island.centerY);
    function edge(area, sx, sy) {
      return [...area.tiles.values()].filter((tile) =>
        sx ? tile.y === area.centerY : tile.x === area.centerX
      ).reduce((best, candidate) => candidate.x * sx + candidate.y * sy > best.x * sx + best.y * sy ? candidate : best);
    }
    bridges.push([edge(island, dx, dy), edge(parent, -dx, -dy)]);
  }
  const plots = islands.flatMap((item) => item.plots);
  return { preset: state.preset, islands, tiles, bridges, demoCount: plots.filter((tile) => tile.demo !== undefined).length,
    openCount: plots.filter((tile) => tile.demo === undefined).length };
}

export function regenerateIsland(state, id, seed = newSeed()) {
  const placements = Object.fromEntries(Object.entries(state.placements).map(([wallet, records]) =>
    [wallet, records.filter((record) => record.island !== id)]));
  return { ...state, placements,
    islands: state.islands.map((island) => island.id === id ? { ...island, seed } : island) };
}

export function visiblePlacements(state, map, wallet, names) {
  const owned = new Map(names.filter((name) => name.expiry > Date.now() / 1000).map((name) => [name.id, name]));
  const placed = new Map();
  for (const record of state.placements[wallet] ?? []) {
    const tile = map.tiles.get(record.key);
    if (owned.has(record.id) && tile?.type === "plot" && tile.island === record.island && tile.demo === undefined) {
      placed.set(record.key, owned.get(record.id));
    }
  }
  return placed;
}

export function placeName(state, map, wallet, names, id, key) {
  const placed = visiblePlacements(state, map, wallet, names);
  const tile = map.tiles.get(key);
  if (!wallet || !names.some((name) => name.id === id && name.expiry > Date.now() / 1000) ||
      tile?.type !== "plot" || tile.demo !== undefined || placed.has(key) ||
      [...placed.values()].some((name) => name.id === id)) return null;
  const records = (state.placements[wallet] ?? []).filter((record) => record.key !== key && record.id !== id);
  return { ...state, placements: { ...state.placements, [wallet]: [...records, { id, key, island: tile.island }] } };
}
