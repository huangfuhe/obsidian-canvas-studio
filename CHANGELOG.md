# Changelog

## 0.9.27 - 2026-09-29

### Fixed

- 组件拖放根据指针所在的 Canvas wrapper 解析目标，支持分屏场景的跨画布落点。
- 拖放预览会清理旧画布高亮，避免跨画布移动后残留虚线框。

## 0.9.26 - 2026-09-29

### Fixed

- 第二次修正组件库渲染路径：内置组件和我的组件统一经过同一套分类与搜索逻辑。

## 0.9.25 - 2026-09-29

### Fixed

- 修复组件库渲染仍过滤内置组件的问题，现在内置组件和我的组件会一起展示。
- 组件搜索增加纯逻辑过滤测试，覆盖命中和空结果状态。

## 0.9.24 - 2026-09-29

### Added

- “连线”菜单支持连接两个选中节点。
- 自动计算方向锚点，使用直角路由和箭头，并阻止重复/自连接。

## 0.9.23 - 2026-09-29

### Added

- 形状菜单在无选中节点时可直接创建矩形、胶囊、判断、圆形、文档等流程图形状。
- 新形状使用原生 `text` 节点，插入后自动进入编辑状态。

## 0.9.22 - 2026-09-29

### Added

- 工具栏和命令面板新增独立文本卡片、黄色便签创建入口。
- 新节点使用原生 `text` 类型，插入后自动选中并进入编辑状态。

## 0.9.21 - 2026-09-29

### Fixed

- 启用 Canvas 非文本编辑状态下的快捷键：`Ctrl/Cmd + Shift + L` 自动布局，`Ctrl/Cmd + Alt + C/V` 复制/粘贴格式。

## 0.9.20 - 2026-09-29

### Added

- 选中 link 节点后，可在右侧属性面板编辑链接地址和显示标题。
- 编辑地址继续经过 URL 规范化和校验。

## 0.9.19 - 2026-09-29

### Added

- 新增“插入链接节点”工具和命令面板命令。
- 支持 http/https、obsidian、mailto 等 URL，并写入原生 Canvas `link` 节点。

## 0.9.18 - 2026-09-29

### Changed

- 导出菜单明确显示 PNG/SVG，PDF 导出继续保留为后续能力。

## 0.9.17 - 2026-09-29

### Fixed

- 修复组件库 Modal 过滤逻辑导致内置组件不显示的问题。
- 组件库增加名称、分类和说明搜索，以及无结果状态。
- 导出入口明确标注 Advanced Canvas 提供的 PNG/SVG 选项。

## 0.9.16 - 2026-09-29

### Added

- 多选分组/泳道后支持水平或垂直批量整理。
- 整理会统一对应轴线和尺寸，并同步内部节点位置。

## 0.9.15 - 2026-09-29

### Added

- 泳道属性面板支持向左/向右重排，内部节点随容器一起交换位置。
- 支持移除泳道容器并保留内部节点和连线，操作前要求确认。

## 0.9.14 - 2026-09-29

### Added

- 分组/泳道属性面板支持复制到右侧或下方。
- 复制会重新映射内部节点和连线 ID，只复制容器内部连线。

## 0.9.13 - 2026-09-29

### Added

- 分组/泳道属性面板支持直接编辑宽度和高度。
- 批量选中的分组可以统一调整尺寸，并保留内部节点位置。

## 0.9.12 - 2026-09-29

### Added

- 选中分组或泳道后，可在右侧属性面板直接编辑分组标题。
- 标题更新保留原生 group 节点和其他未知字段。

## 0.9.11 - 2026-09-29

### Added

- 分组属性和排版菜单支持折叠/展开分组。
- Advanced Canvas 启用时委托其原生 `collapsed`/`collapsedData` 处理，未启用时保留字段降级。

## 0.9.10 - 2026-09-29

### Added

- 手动折点预览会检测穿过的节点，并在渲染层插入临时上下/左右绕行点。
- 自动绕行点不写入用户折点数据，拖动和清除操作仍只作用于手动折点。

## 0.9.9 - 2026-09-29

### Added

- 单条连线支持添加、拖动、双击删除和清除手动折点。
- 折点保存到 edge 的可选 `styleAttributes` 字段，并由 Canvas Studio SVG 层渲染。

## 0.9.8 - 2026-09-29

### Added

- 节点拖入分组时自动吸附到容器内边距，避免节点越出分组边界。
- 组件拖放到分组时自动调整片段原点，使组件内容保持在容器内。

## 0.9.7 - 2026-09-28

### Added

- 组件拖拽使用全局拖放监听，避免组件库 Modal 覆盖层阻断画布接收。
- 拖动过程中显示跟随指针的放置预览，并在释放后按画布缩放计算落点。

## 0.9.6 - 2026-09-28

### Added

- 组件库卡片支持拖拽到当前 Canvas 画布。
- 拖放位置按画布缩放换算为 Canvas 坐标，并保留原生节点与撤销事务。

## 0.9.5 - 2026-09-28

### Added

- 组合选中节点为原生 Canvas `group`，支持保留节点和连线。
- 取消组合只移除分组容器，不删除内部节点和连线。

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
