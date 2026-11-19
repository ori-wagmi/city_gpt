# HL Names City

HL Names City is a browser-local isometric city builder. It starts with one island and no buildings.

## Run locally

From this directory, run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [the local demo](http://127.0.0.1:8000) in a desktop browser. The app uses native browser modules and Canvas 2D, with no build step or package install.

## Explore and build

- Drag or use the arrow keys to pan. Scroll or use the zoom controls for street-level detail. Use **Fit entire world** or Home to return to the overview.
- Choose **0**, **100**, **1,000**, or **10,000** demo buildings. Generated buildings are scenery and do not represent on-chain ownership.
- **Add landmass** extends the map with an unpopulated connected area. Click an island to select it, or choose it in the sidebar to jump to its landmark. Each island has one civic landmark: a factory, observation tower, stadium, or basilica. Larger worlds reuse these four designs in different palettes.
- Connect a browser EVM wallet, select an unplaced name, and click a highlighted open plot. Escape cancels, and clicking a placed name in the sidebar brings its building into view.
- **Regenerate landmass** clears placements on that island. **Regenerate map** and changes to the population preset clear all placements. **Reset demo** returns to one newly generated empty island.

## Ownership and local storage

The app queries the official [HL Names API](https://github.com/HLnames/use-hln-api/blob/master/references/endpoints.md) for HyperEVM mainnet ownership. It uses `/utils/names_owner/:address` to discover namehashes and `/records/full_record/:nameHashOrId` to check expiry. The [HyperEVM mainnet RPC](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/hyperevm) verifies active owners through the [HL Names registry](https://hyperliquid-names.gitbook.io/hyperliquid-names/smart-contracts/deployments) and checks the registry balance for missing records. The sidebar flags a detected index gap and keeps verified names usable. It sends the [published public agent key](https://github.com/HLnames/use-hln-api/blob/master/SKILL.md). The wallet supplies the account address and does not need to switch networks. Connection and placement require zero signatures or transactions.

The browser saves island seeds, the preset, and placements keyed by wallet address and namehash in local storage. Reconnect the wallet after a refresh to verify ownership and show its saved buildings. Clearing browser data or switching origins, profiles, or devices removes access to that local state. There is no shared game backend.

## Art and rendering

The four Canvas building families take visual direction from the supplied `reference *.png` images. Bricks, roof tiles, greenhouse panes, neon, planters, and façade trim are drawn into three cached palette variants per family. The images serve as art references and are not loaded as in-game assets. Terrain, water, bridges, and scenery are procedural. The renderer caches terrain by landmass, reuses building and vegetation sprites, culls offscreen objects, and reduces label detail in the overview.
