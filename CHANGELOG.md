# Changelog

## 0.9.4 - 2026-09-28

### Added

- 选中分组或泳道后，可按内部节点边界自动调整分组尺寸。
- 自适应尺寸保留子节点位置，并继续写入标准 `.canvas` 节点数据。
- 低频工具收纳到“更多”菜单，缩短常驻工具栏；只读画布隐藏写入型命令。
- 只读画布同时禁用右侧属性面板的写入控件。

## 0.9.3 - 2026-09-28

### Added

- Native editable table component built from one group and text cell nodes.
- Vault 媒体库：按文件名、路径和类型筛选图片、SVG、PDF 及常见文件。
- 从媒体库插入标准 Canvas `file` 节点，并提供图片缩略图预览；不创建内容副文件。

## 0.9.2 - 2026-09-28

### Added

- Save the current Canvas selection as a reusable local component.
- Persist saved components in Canvas Studio settings without creating content
  sidecar files.
- Re-insert saved components with remapped node and edge IDs.

## 0.9.1 - 2026-09-28

### Added

- Moving a group/ swimlane moves contained text nodes by the same delta.
- The behavior can be disabled with the `分组带动子节点` setting.

## 0.9.0 - 2026-09-28

### Added

- Local component library with buttons, input fields, tags, information cards,
  and alert cards.
- Component categories and native Canvas insertion from the library modal.
- Component insertion uses standard `text` and `group` nodes and one undoable
  Canvas transaction.


## 0.8.0 - 2026-09-28

### Added

- Contextual right-side inspector for canvas, node, and edge selection states.
- Node inspector controls for font size, font family, alignment, and shape.
- Edge inspector controls for routing and selected-edge alignment.
- Canvas summary in the empty-selection inspector state.
- Smart snapping to a 20px grid and nearby node edges/centerlines with temporary
  alignment guides.

### Direction

- The toolbar remains a compact command surface; object-specific properties now
  live in the inspector, matching the interaction model of full whiteboard apps.


## 0.7.1 - 2026-09-28

### Fixed

- Typography actions now preserve the CodeMirror text selection before the
  toolbar receives focus.
- Font family, font size, color, underline, and line height can be applied to
  selected text using inline HTML in the same Canvas text node.
- Bold and italic selections use Markdown emphasis markers.
- Unsaved editor text is preserved when applying a local text style.


## 0.7.0 - 2026-09-28

### Added

- Chinese labels are visible in the Canvas Studio toolbar while tooltips remain
  available for full descriptions.
- Typography, style, arrange, and edge controls remain clickable without a
  selection and explain the required selection in Chinese when needed.
- Edge alignment commands choose cardinal anchors from node geometry and route
  selected or all edges through Advanced Canvas square pathfinding.


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
