# Install, Upgrade, And Roll Back

## Requirements

- Obsidian 1.13.0 or newer.
- Advanced Canvas 7.0.1 or newer is strongly recommended.

## Manual Installation

1. Close or reload Obsidian before replacing plugin files.
2. Create `<vault>/.obsidian/plugins/canvas-studio/`.
3. Place `main.js`, `manifest.json`, and `styles.css` in that directory.
4. Enable **Canvas Studio** under **Settings -> Community plugins**.

Canvas Studio stores its settings in the plugin directory. Whiteboard content
continues to live only in existing `.canvas` files.

## Upgrade

1. Back up important `.canvas` files.
2. Replace all three release files together.
3. Reload Canvas Studio.
4. Open the compatibility test Canvas and run **Canvas Studio: Check canvas
   integrity**.
5. Confirm the toolbar, theme, undo/redo, and Advanced Canvas integration before
   editing important boards.

Do not mix `main.js`, `manifest.json`, and `styles.css` from different versions.

## Roll Back

1. Disable Canvas Studio.
2. Restore the previous three plugin files.
3. Reload Obsidian and re-enable the plugin.

Disabling or removing Canvas Studio does not delete Canvas nodes or edges.
Standard text, positions, colors, groups, and connections remain readable in
core Canvas. Advanced visual attributes may render as their core fallbacks.

## BRAT Readiness

The standalone repository is:

`https://github.com/huangfuhe/obsidian-canvas-studio`

BRAT installation should point at that repository. A usable release must expose
`main.js`, `manifest.json`, and `styles.css` as individual release assets.
