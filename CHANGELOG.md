# Changelog

## 0.6.0 - 2026-09-28

### Added

- Native Canvas mind-map child/sibling creation and four-direction layout.
- Flowchart shapes, edge styles, typography, alignment, distribution, and format brush.
- Markdown heading/list import and declarative flowchart templates.
- Cross-team swimlane template using native group, text, and edge objects.
- Semantic whole-canvas and selection themes.
- Canvas text search and replacement.
- Advanced Canvas image export, presentation, and readonly shortcuts.
- Canvas information and read-only integrity diagnostics.
- Mobile toolbar safe-area positioning, horizontal scrolling, and 44px touch targets.

### Compatibility

- Obsidian 1.13.0 or newer.
- Advanced Canvas 7.0.1 is recommended and required for advanced shape, edge,
  presentation, and image-export behavior.
- All board content remains in `.canvas` files. No sidecar content format is
  introduced.

### Known Limitations

- Canvas APIs used by Obsidian and Advanced Canvas are not public APIs. Re-run
  compatibility checks after either dependency is upgraded.
- Mobile behavior has been verified with desktop mobile emulation, not physical
  iOS or Android devices.
- Diagnostics are advisory. Directed cycles may be intentional in process maps.
