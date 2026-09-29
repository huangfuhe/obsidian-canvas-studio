# Changelog

## 0.9.88 - 2026-09-29

### Added

- 文件/媒体节点属性面板增加“打开源文件”，复用 Obsidian workspace 打开 Vault 文件。

## 0.9.87 - 2026-09-29

### Added

- 图片/SVG 节点属性面板增加裁剪填充、保持比例和平铺三种背景方式。

## 0.9.86 - 2026-09-29

### Added

- 文件/媒体节点属性面板显示图片、SVG、PDF或文件类型，并支持恢复默认尺寸。

## 0.9.85 - 2026-09-29

### Added

- 表格属性面板支持编辑单元格宽度和高度，批量重排全部单元格并同步表格组尺寸。

## 0.9.84 - 2026-09-29

### Added

- 选中语义单元格后可删除当前行或当前列，后续单元格自动前移并更新索引；表头行受保护。

## 0.9.83 - 2026-09-29

### Added

- 选中语义单元格后可在下方插入行或右侧插入列，后续单元格自动平移并更新索引。

## 0.9.82 - 2026-09-29

### Added

- 节点旋转支持任意角度输入，并提供左转/右转 15° 快捷按钮。

## 0.9.81 - 2026-09-29

### Added

- 白板完整性检查增加思维导图根/折叠节点、泳道归属和表格归属的失效引用诊断。

## 0.9.80 - 2026-09-29

### Fixed

- 连线属性面板正确回读原生无箭头/三角和自定义菱形/圆形终点状态。

## 0.9.79 - 2026-09-29

### Added

- 表格属性面板支持确认后删除末行或末列，并清理对应单元格与关联连线。

## 0.9.78 - 2026-09-29

### Added

- 表格组和单元格增加行列语义字段，表格属性面板支持新增行和新增列。

## 0.9.77 - 2026-09-29

### Added

- 节点属性面板和命令面板增加“适应文本高度”，按实际渲染内容批量调整文本节点高度。

## 0.9.76 - 2026-09-29

### Added

- 手绘工具增加橡皮擦模式，按指针附近最近笔画删除整条 stroke，支持拖动连续擦除。

## 0.9.75 - 2026-09-29

### Added

- 画布属性面板增加手绘颜色、2-12px 粗细选择、撤销上一笔和清除全部。

## 0.9.74 - 2026-09-29

### Added

- 字体菜单支持为单行选中文字添加 URL，保存为原生 Markdown `[文字](URL)`。

## 0.9.73 - 2026-09-29

### Added

- 字体菜单增加删除线，选中文字保存为原生 Markdown `~~文本~~`。

## 0.9.72 - 2026-09-29

### Added

- 字体菜单支持将选中文字行转换为项目符号列表或编号列表，继续保存为原生 Markdown 文本。

## 0.9.71 - 2026-09-29

### Added

- 思维导图与流程图操作会自动同步画布编辑模式：大纲/树布局进入思维导图，形状/连线/模板进入流程图。

## 0.9.70 - 2026-09-29

### Added

- 工具栏上下文标识显示当前编辑模式：自由白板、思维导图或流程图。

## 0.9.69 - 2026-09-29

### Docs

- 校准开发方案中的 focused tests 数量为 101。

## 0.9.68 - 2026-09-29

### Added

- 画布属性面板增加自由白板、思维导图、流程图三种编辑模式，持久化到 `metadata.canvasStudio.mode`。

## 0.9.67 - 2026-09-29

### Fixed

- 切换菱形/圆形箭头回三角或无箭头时清理旧的自定义箭头样式，避免视觉状态残留。

## 0.9.66 - 2026-09-29

### Added

- 胶囊流程节点属性面板增加流程角色回读与修改：普通节点、开始、结束。

## 0.9.65 - 2026-09-29

### Added

- 流程模板中的开始、结束/完成节点同步写入 `canvasStudioFlowRole`，与手动形状入口保持一致。

## 0.9.64 - 2026-09-29

### Fixed

- 修正连线箭头写回：`fromEnd`/`toEnd` 现在写入原生 edge 顶层字段，不再误放进 `styleAttributes`。

### Added

- 连线属性面板增加起点箭头选择，支持双向箭头表达。

## 0.9.63 - 2026-09-29

### Added

- 节点属性面板增加顶部/居中/底部垂直对齐，写入可选 `styleAttributes.verticalAlign`。

## 0.9.62 - 2026-09-29

### Added

- 流程图形状菜单增加“开始”和“结束”语义入口，使用原生胶囊节点并写入可选 `canvasStudioFlowRole`。

## 0.9.61 - 2026-09-29

### Docs

- 补充判断分支模板的真实 Obsidian CLI smoke 证据：6 个 text 节点、6 条 edge、5 种流程图形状和“是/否”标签。

## 0.9.60 - 2026-09-29

### Docs

- 开发方案补充真实 Obsidian CLI Canvas smoke gate：行式泳道命令写入原生 group/text/edge 后读取成功，临时测试文件已清理。

## 0.9.59 - 2026-09-29

### Docs

- 记录运行中 Obsidian CLI 未提供 PDF/print/export 命令，PDF 继续保持为后续独立能力；PNG/SVG 仍由 Advanced Canvas 提供。

## 0.9.58 - 2026-09-29

### Fixed

- 同步开发方案中的当前版本、测试数和后续验收口径，避免继续引用旧的 0.8.x 交互架构。

## 0.9.57 - 2026-09-29

### Added

- 思维导图节点支持折叠/展开分支，状态写入 `metadata.canvasStudio.collapsedMindMapNodeIds`。
- 折叠时隐藏后代节点和关联连线，展开时恢复显示。

## 0.9.56 - 2026-09-29

### Added

- 思维导图属性面板增加层级主题菜单，支持海洋层级、暖色重点和技术蓝图三种主题。
- 主题按根节点和分支深度分配颜色，并写入可选深度/主题元数据。

## 0.9.55 - 2026-09-29

### Added

- 拖动节点进入泳道时显示“目标泳道：xxx”中文提示，并对目标容器做轻微脉冲高亮。

## 0.9.54 - 2026-09-29

### Added

- 节点拖动进入泳道时高亮目标容器，落入或离开时自动更新 `canvasStudioLaneId`。

## 0.9.53 - 2026-09-29

### Added

- 节点属性面板增加“泳道归属”下拉框，只选择节点即可移动到目标泳道并写回归属字段。

## 0.9.52 - 2026-09-29

### Added

- 泳道节点移入和复制现在写入可选 `styleAttributes.canvasStudioLaneId`，支持回读节点归属。

## 0.9.51 - 2026-09-29

### Added

- 泳道属性面板增加“删除泳道及内容”，确认后删除内部节点和关联连线；保留“移除容器（保留内容）”作为非破坏性操作。

## 0.9.50 - 2026-09-29

### Added

- 泳道属性面板支持新增空泳道：列式新增右侧，行式新增下方，不复制内部节点和连线。

## 0.9.49 - 2026-09-29

### Added

- 支持从属性面板或命令面板设置/取消思维导图根节点。
- 自动布局在没有当前选区时优先使用持久化的思维导图根节点 ID。

## 0.9.48 - 2026-09-29

### Added

- 节点属性面板增加旋转、水平/垂直翻转和置顶/置底/上下移动一层操作。
- 变换和层级状态继续写入原生节点数组及可选 `styleAttributes`，不创建额外文件。

## 0.9.47 - 2026-09-29

### Added

- 混合选择泳道和节点后，属性面板支持将选中节点整体移入指定泳道并保留相对布局。

## 0.9.46 - 2026-09-29

### Added

- 泳道属性面板增加行式/列式切换，重新排列选中泳道并同步带动内部节点。

## 0.9.45 - 2026-09-29

### Added

- 泳道模板支持列式和行式两种方向，行式模板使用正交跨泳道锚点并写入可选语义字段。

## 0.9.44 - 2026-09-29

### Added

- 选择连线的“自动避障”路由时，直接显示 Canvas Studio 的多障碍物正交 A* 预览，即使还没有手动折点。

## 0.9.43 - 2026-09-29

### Added

- 手动折点预览升级为基于障碍物膨胀和正交网格 A* 的多障碍物绕行，仍不改写用户保存的折点。

### Fixed

- 字体菜单在工具栏抢焦点后仍可恢复 CodeMirror 或原生 DOM 选区，降低选中文字样式不生效的问题。

## 0.9.42 - 2026-09-29

### Added

- 工具栏和命令面板增加撤销、重做入口，复用 Obsidian 原生编辑器命令。
- 本地单人白板范围继续保持不变，不引入多人协作、评论、@提及或实时同步。

## 0.9.41 - 2026-09-29

### Fixed

- 组件跨窗口拖放增加 localStorage 组件 ID 兜底，目标窗口按指针下的 Canvas 接收。

## 0.9.40 - 2026-09-29

### Added

- 基础手绘模式：笔画点位保存到 `metadata.canvasStudio.strokes`，插件启用时以 SVG overlay 绘制。
- “更多”菜单和命令面板支持确认后清除全部手绘笔迹。

## 0.9.39 - 2026-09-29

### Added

- 空画布属性面板增加默认、纯白、冷灰、暖白四种背景预设。
- 背景状态写入可选 `metadata.canvasStudio.background`，插件卸载时清理视图样式。

## 0.9.38 - 2026-09-29

### Added

- 增加可持久化画布网格开关，写入 `metadata.canvasStudio.grid`。
- 网格显示使用 Canvas Studio CSS 层，不改变原生节点和文件类型。

## 0.9.37 - 2026-09-29

### Added

- 支持 Delete/Backspace 删除选中对象，以及命令面板和排版菜单入口。
- 删除节点时同步移除关联连线；单独删除连线不影响节点。

## 0.9.36 - 2026-09-29

### Added

- 工具栏根据当前选区上下文隐藏低相关操作，并将隐藏操作保留到“更多”菜单。
- 节点、连线和空画布状态分别使用对应的操作集合。

## 0.9.35 - 2026-09-29

### Added

- 工具栏增加选区上下文标识：整张画布、单个/多个节点、连线或混合选区。
- 上下文标识随选区事件更新，帮助快速判断当前属性操作对象。

## 0.9.34 - 2026-09-29

### Added

- 选中 file 节点后，可在右侧属性面板编辑 Vault 文件路径。
- 修改路径前校验目标文件存在，避免生成悬空 file 节点。

## 0.9.33 - 2026-09-29

### Added

- 支持复制选中对象，保留内部连线并重新映射节点/连线 ID。
- 支持 `Ctrl/Cmd+D`、排版菜单和命令面板入口。

## 0.9.32 - 2026-09-29

### Added

- 演示模式增加上一个节点、下一个节点和结束演示入口。
- 命令面板和“更多”菜单复用 Advanced Canvas 原生演示导航命令。

## 0.9.31 - 2026-09-29

### Added

- “更多”菜单和命令面板新增缩放到选中内容、缩放至全览。
- 复用 Advanced Canvas 原生 `zoom-to-selection` / `zoom-to-fit` 命令。

## 0.9.30 - 2026-09-29

### Added

- 搜索与替换现在覆盖 link 节点 URL。
- 替换 URL 时保留 link 节点显示标题不变。

## 0.9.29 - 2026-09-29

### Added

- 搜索与替换现在覆盖分组/泳道标题 `label`。
- 替换标题时只写回标题字段，不改变节点正文。

## 0.9.28 - 2026-09-29

### Added

- 节点属性面板增加透明度选择，支持 20% 到 100%。
- 透明度写入 `styleAttributes.opacity` 并应用到节点渲染。

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
