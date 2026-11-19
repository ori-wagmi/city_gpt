import { Scene } from "./scene.js";
import { normalizeAddress, ownedNames } from "./ownership.js";
import { addIsland, buildMap, createWorld, landmarkTypes, placeName, presets, regenerateIsland, visiblePlacements } from "./world.js";

const $ = (selector) => document.querySelector(selector);
const format = new Intl.NumberFormat("en-US");
const storageKey = "hl-names-city-v2";
const walletButton = $("#wallet");
const walletIcon = walletButton.firstElementChild;
const worldButtons = [...document.querySelectorAll("[data-count], #add, #regenerate, #regenerate-island, #reset")];
const canvas = $("canvas");
const scene = new Scene(canvas, onMapClick);
const announcedWallets = [];

window.addEventListener("eip6963:announceProvider", (event) => {
  const candidate = event.detail?.provider;
  if (typeof candidate?.request === "function" && !announcedWallets.includes(candidate)) announcedWallets.push(candidate);
});
window.dispatchEvent(new Event("eip6963:requestProvider"));

let state = restore();
let map = buildMap(state);
let islandId = 0;
let address = null;
let provider = null;
let names = [];
let selectedName = null;
let owned = new Map();
let status = "disconnected";
let lookupError = "";
let incomplete = false;
let walletController;
let expiryTimer;
let noticeTimer;
let generating = false;

function restore() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored?.version === 1 && presets.includes(stored.preset) &&
        stored.islands?.length && stored.placements) return stored;
  } catch { /* Start fresh when storage is inaccessible or unreadable. */ }
  return createWorld();
}

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    $(".sidebar-footer span").textContent = "Saved in this browser";
  } catch {
    $(".sidebar-footer span").textContent = "Browser storage unavailable";
  }
}

function notice(message, error = false, persistent = false) {
  const element = $("#notice");
  clearTimeout(noticeTimer);
  element.dataset.error = error;
  element.textContent = message;
  if (message && !persistent) noticeTimer = setTimeout(() => { element.textContent = ""; }, 5000);
}

function renderWorld() {
  const select = $("#islands");
  select.replaceChildren(...map.islands.map(({ id, name }) => new Option(name, id)));
  const count = map.islands.length;
  $("#landmass-count").textContent = `${count} ${count === 1 ? "landmass" : "landmasses"}`;
  $("#demo-total").textContent = `${format.format(map.demoCount)} demo buildings`;
  for (const button of document.querySelectorAll("[data-count]")) {
    button.setAttribute("aria-pressed", Number(button.dataset.count) === state.preset);
  }
  selectIsland(islandId);
}

function renderNames() {
  owned = visiblePlacements(state, map, address, names);
  const list = $("#names");
  const scrollTop = list.scrollTop;
  const focusedId = document.activeElement?.dataset.nameId;
  list.replaceChildren();
  const connected = Boolean(address);
  const addressLabel = $("#address");
  addressLabel.hidden = !connected;
  addressLabel.title = address ?? "";
  addressLabel.textContent = address ? `${address.slice(0,8)}…${address.slice(-6)}` : "";
  walletButton.replaceChildren(walletIcon, connected ? "Disconnect" : "Connect wallet");
  $("#refresh").hidden = !connected;
  $("#refresh").disabled = status === "loading";

  if (status === "ready" && incomplete) {
    const message = document.createElement("p");
    message.textContent = "HL Names returned fewer records than the registry reports. Refresh to check again.";
    list.append(message);
  }
  if (status !== "ready" || (!names.length && !incomplete)) {
    const message = document.createElement("p");
    message.textContent = {
      disconnected: "Connect an EVM wallet to place a building for one of your .hl names.",
      loading: "Checking active ownership on HyperEVM…",
      error: lookupError,
      ready: "This wallet has no active .hl names.",
    }[status];
    list.append(message);
  } else if (names.length) {
    const positions = new Map([...owned].map(([key, name]) => [name.id,key]));
    for (const item of names) {
      const key = positions.get(item.id);
      const button = document.createElement("button");
      const label = document.createElement("strong");
      const stateLabel = document.createElement("small");
      button.className = "name-row";
      button.dataset.nameId = item.id;
      button.title = item.name;
      button.setAttribute("aria-pressed", selectedName === item.id);
      label.textContent = item.name;
      stateLabel.textContent = key ? "Placed" : "Unplaced";
      button.append(label,stateLabel);
      button.onclick = () => {
        if (key) {
          const tile = map.tiles.get(key);
          selectedName = null;
          selectIsland(tile.island);
          scene.focus(tile);
        } else {
          selectedName = selectedName === item.id ? null : item.id;
          notice("");
        }
        renderNames();
      };
      list.append(button);
      if (focusedId === item.id) button.focus({ preventScroll:true });
    }
  }

  list.scrollTop = scrollTop;
  const placing = names.find(({ id }) => id === selectedName);
  $("#placement-bar").hidden = !placing;
  $("#map-hint").hidden = Boolean(placing);
  $("#placing").textContent = placing ? `Choose an open plot for ${placing.name}` : "";
  canvas.classList.toggle("placing", Boolean(placing));
  $("#open-total").textContent = `${format.format(map.openCount-owned.size)} open plots`;
  $("#real-total").textContent = `${format.format(owned.size)} wallet placements`;
  scene.placed = owned;
  scene.selectedName = selectedName;
  scene.invalidate();
}

function selectIsland(id) {
  islandId = id;
  scene.selectedIsland = id;
  $("#islands").value = id;
  $("#island-landmark").textContent = landmarkTypes[map.islands[id].landmark.landmark.type];
  scene.invalidate();
}

function onMapClick(tile) {
  if (generating) return;
  if (!selectedName) {
    if (tile) selectIsland(tile.island);
    return;
  }
  const next = placeName(state,map,address,names,selectedName,tile?.key);
  if (!next) {
    notice("Choose an unoccupied buildable plot.", true);
    return;
  }
  const name = names.find(({ id }) => id === selectedName);
  state = next;
  selectedName = null;
  selectIsland(tile.island);
  save();
  renderNames();
  notice(`${name.name} placed in ${map.islands[tile.island].name}.`);
}

async function changeWorld(makeState, selection, success) {
  if (generating) return;
  generating = true;
  worldButtons.forEach((button) => { button.disabled = true; });
  notice("Generating city…", false, true);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    const next = makeState();
    const nextMap = buildMap(next, map);
    scene.setWorld(nextMap, selection !== "keep");
    map = nextMap;
    state = next;
    selectedName = null;
    if (selection === "new") islandId = map.islands.length-1;
    if (selection === "first") islandId = 0;
    save();
    renderWorld();
    renderNames();
    notice(success(map.islands[islandId].name));
  } catch (error) {
    console.error(error);
    notice("City generation failed. Try again.", true);
  } finally {
    generating = false;
    worldButtons.forEach((button) => { button.disabled = false; });
  }
}

for (const button of document.querySelectorAll("[data-count]")) {
  button.onclick = () => {
    const preset = Number(button.dataset.count);
    if (preset !== state.preset) changeWorld(() => createWorld(preset),"first",() => "Population updated.");
  };
}
$("#add").onclick = () => changeWorld(() => addIsland(state),"new",(name) => `${name} added.`);
$("#regenerate").onclick = () => changeWorld(() => createWorld(state.preset),"first",() => "Map regenerated.");
$("#reset").onclick = () => changeWorld(() => createWorld(),"first",() => "Demo reset.");
$("#regenerate-island").onclick = () => {
  const target = islandId;
  changeWorld(() => regenerateIsland(state,target),"keep",() => `${map.islands[target].name} regenerated.`);
};
$("#islands").onchange = (event) => {
  selectIsland(Number(event.target.value));
  scene.focus(map.islands[islandId].landmark.landmark);
};
$("#overview").onclick = () => scene.fit();
$("#zoom-in").onclick = () => scene.zoom(1.35);
$("#zoom-out").onclick = () => scene.zoom(1/1.35);
$("#cancel").onclick = cancelPlacement;
function cancelPlacement() {
  if (!selectedName) return;
  selectedName = null;
  renderNames();
  notice("");
}
document.addEventListener("keydown",(event) => {
  if (event.key === "Escape") cancelPlacement();
});

function scheduleExpiry() {
  clearTimeout(expiryTimer);
  if (!names.length) return;
  const closest = Math.min(...names.map((name) => name.expiry));
  expiryTimer = setTimeout(() => {
    names = names.filter((name) => name.expiry > Date.now()/1000);
    if (!names.some((name) => name.id === selectedName)) selectedName = null;
    renderNames();
    scheduleExpiry();
  }, Math.min(2147483647,Math.max(10,closest*1000-Date.now()+10)));
}

async function loadNames() {
  if (!address) return;
  walletController?.abort();
  clearTimeout(expiryTimer);
  const controller = new AbortController();
  walletController = controller;
  const signal = AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]);
  status = "loading";
  names = [];
  selectedName = null;
  renderNames();
  try {
    const savedIds = (state.placements[address] ?? []).map((record) => record.id);
    const active = await ownedNames(address,signal,savedIds);
    if (controller.signal.aborted) return;
    names = active.names;
    incomplete = active.incomplete;
    status = "ready";
    scheduleExpiry();
  } catch (error) {
    if (controller.signal.aborted) return;
    status = "error";
    lookupError = signal.aborted ? "Ownership lookup timed out. Refresh to retry."
      : error instanceof TypeError ? "Could not reach HL Names. Refresh to retry." : error.message;
    controller.abort();
  }
  renderNames();
}

function changeAccount(accounts) {
  walletController?.abort();
  clearTimeout(expiryTimer);
  address = normalizeAddress(accounts?.[0]);
  names = [];
  selectedName = null;
  status = address ? "loading" : "disconnected";
  notice("");
  if (address) loadNames();
  else renderNames();
}

function disconnect() {
  provider?.removeListener?.("accountsChanged",changeAccount);
  provider?.removeListener?.("disconnect",disconnect);
  provider = null;
  changeAccount([]);
}

$("#refresh").onclick = loadNames;
walletButton.onclick = async () => {
  if (provider) {
    disconnect();
    return;
  }
  const candidate = window.ethereum ?? announcedWallets[0];
  if (!candidate) {
    notice("Open the demo in a browser with an EVM wallet extension.",true);
    return;
  }
  walletButton.disabled = true;
  try {
    const accounts = await candidate.request({ method:"eth_requestAccounts" });
    if (!normalizeAddress(accounts?.[0])) throw new Error("The wallet returned no account.");
    provider = candidate;
    provider.on?.("accountsChanged",changeAccount);
    provider.on?.("disconnect",disconnect);
    changeAccount(accounts);
  } catch (error) {
    notice(error.code === 4001 ? "Wallet connection canceled." : "Could not connect the wallet.",true);
  } finally {
    walletButton.disabled = false;
  }
};

scene.setWorld(map,true);
save();
renderWorld();
renderNames();
