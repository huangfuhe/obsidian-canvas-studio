# Compatibility Evidence

Validated on 2026-09-30:

- Obsidian 1.13.7;
- Advanced Canvas 7.0.1;
- Canvas Studio 0.9.95;
- Linux desktop runtime.

## Gate 0

The isolated compatibility Canvas was opened and saved with Canvas Studio and
Advanced Canvas enabled, and again with both plugins unloaded. Unknown top-level,
node, and edge fields survived the round trip.

## Runtime Checks

- Node creation, edge creation, four-direction layout, theme persistence,
  undo/redo, search/replace, templates, swimlanes, readonly mode, and plugin
  reload were verified inside Obsidian.
- The production bundle loaded without captured Canvas Studio console errors.
- A 390 x 844 mobile viewport simulation verified horizontal toolbar scrolling,
  safe-area placement, and 44px toolbar/modal controls.
- A real X11 Obsidian window verified the Chinese toolbar, node/edge inspector,
  fit-to-view clearance, full-screen presentation overlay hiding, and restoring
  the editing UI after presentation ends.
- A real isolated Canvas verified the native `metadata.startNode` presentation
  entry and the Canvas Studio presentation command path.
- The component command path was smoke tested on an isolated Canvas: the
  built-in button command wrote one native `text` node and the temporary file
  was moved to the vault trash afterward.
- Component drop handling now preserves the Canvas resolved from the drag
  event through insertion, covering the cross-pane target-selection bug at the
  code level.

## Focused Tests

- 116 tests cover data preservation, layout, arrangement, Markdown outline
  parsing, templates, swimlanes, themes, search/replace, diagnostics, edge
  highlighting, presentation metadata, and performance.
- The latest benchmark laid out 100 nodes in under 10 ms and 500 nodes in under
  100 ms on this workstation.

## Read-Only Existing-Canvas Sample

The following files were parsed and diagnosed without opening or saving them:

| Canvas | Nodes | Edges | Advisory findings |
|---|---:|---:|---|
| `Agent开发学习/skill.canvas` | 17 | 11 | 1 overlap |
| `Movie center/MovieCenter媒体资产白板.canvas` | 30 | 10 | none |
| `code harness/结构图.canvas` | 46 | 16 | 1 directed cycle |

Diagnostics are advisory. A cycle can be intentional process-map semantics, and
an overlap can be deliberate visual composition.

## Remaining Evidence Gap

- No physical iOS or Android device test has been performed.
- Component-library drag and drop has not been executed in an unobstructed
  desktop session; the library, search field, categories, and cards were
  verified in a real Obsidian window.
- PDF print output has not been verified because no printer is available in
  the current environment.
- No public BRAT installation or Obsidian community-plugin review has been
  performed.
