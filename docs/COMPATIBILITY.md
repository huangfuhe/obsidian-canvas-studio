# Compatibility Evidence

Validated on 2026-09-28:

- Obsidian 1.13.7;
- Advanced Canvas 7.0.1;
- Canvas Studio 0.6.0;
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

## Focused Tests

- 29 tests cover data preservation, layout, arrangement, Markdown outline
  parsing, templates, swimlanes, themes, search/replace, diagnostics, and
  performance.
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
- No public BRAT installation or Obsidian community-plugin review has been
  performed.
