import {
  Menu,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  setIcon,
  setTooltip,
  TFile
} from 'obsidian';
import {
  getCurrentCanvas,
  hasAdvancedCanvas,
  randomId,
  replaceCanvasData,
  selectedEdgeData,
  selectedRuntimeEdges,
  selectedNodeData,
  selectedRuntimeNodes,
  type RuntimeCanvas,
  type RuntimeCanvasNode
} from './canvas-compat';
import { arrangeNodes, type ArrangeMode } from './arrange';
import { alignCanvasEdges, mergeEdgeStyle, mergeNodeStyle, safeInsertionOrigin, updateNodes } from './canvas-data';
import { diagnoseCanvas, type CanvasHealthIssue } from './diagnostics';
import { moveGroupChildren } from './group-follow';
import { fitGroupsToChildren } from './group-layout';
import { groupNodes, ungroupNodes } from './group-actions';
import { snapFragmentIntoGroup, snapNodeIntoGroup } from './group-snap';
import { computeMindMapLayout, moveNodesToLayout } from './layout';
import { outlineToCanvas, parseMarkdownOutline } from './outline';
import { findCanvasMatches, replaceAllMatches, replaceCurrentMatch, type CanvasSearchMatch } from './search';
import { markdownTextSelection, styleTextSelection, type TextSelectionSnapshot } from './rich-text';
import { snapNodePosition } from './snap';
import { instantiateSwimlane, SWIMLANE_TEMPLATES } from './swimlane';
import { FLOW_TEMPLATES, instantiateFlowTemplate } from './templates';
import { applyCanvasTheme, CANVAS_THEMES } from './themes';
import { COMPONENT_LIBRARY, componentsByCategory, type ComponentSpec } from './components';
import { createSavedComponent, instantiateSavedComponent, type SavedCanvasComponent } from './saved-components';
import { filterMediaItems, mediaItemsFromPaths, type MediaKind, type MediaItem } from './media';
import { clientPointToCanvas, parseCssTransform } from './canvas-position';
import { addWaypointAtLongestSegment, edgeRoutePoints, EDGE_WAYPOINTS_KEY, parseEdgeWaypoints, polylinePath, serializeEdgeWaypoints, type EdgeWaypoint } from './edge-waypoints';
import type { CanvasDocument, CanvasEdgeData, CanvasNodeData, CanvasStyleAttributes, LayoutDirection } from './types';

interface CanvasStudioSettings {
  defaultFontFamily: string;
  defaultFontSize: number;
  layoutDirection: LayoutDirection;
  showToolbar: boolean;
  smartSnap: boolean;
  snapGridSize: number;
  snapThreshold: number;
  groupFollowChildren: boolean;
  savedComponents: SavedCanvasComponent[];
}

const DEFAULT_SETTINGS: CanvasStudioSettings = {
  defaultFontFamily: 'sans-serif',
  defaultFontSize: 16,
  layoutDirection: 'right',
  showToolbar: true,
  smartSnap: true,
  snapGridSize: 20,
  snapThreshold: 12,
  groupFollowChildren: true,
  savedComponents: []
};

const TOOLBAR_ACTIONS = [
  { id: 'create-child', icon: 'git-branch', label: '创建子节点', shortLabel: '子节点' },
  { id: 'create-sibling', icon: 'git-merge', label: '创建同级节点', shortLabel: '同级' },
  { id: 'layout', icon: 'layout-dashboard', label: '自动布局思维导图', shortLabel: '布局' },
  { id: 'import', icon: 'list-tree', label: '导入 Markdown 大纲', shortLabel: '导入' },
  { id: 'template', icon: 'layout-template', label: '流程图与泳道模板', shortLabel: '模板' },
  { id: 'components', icon: 'blocks', label: '常用组件库', shortLabel: '组件' },
  { id: 'media', icon: 'image-plus', label: '插入媒体或文件', shortLabel: '媒体' },
  { id: 'arrange', icon: 'align-horizontal-distribute-center', label: '节点对齐与分布', shortLabel: '排版' },
  { id: 'shape', icon: 'shapes', label: '设置流程图形状', shortLabel: '形状' },
  { id: 'edge', icon: 'git-commit-horizontal', label: '连线样式与自动整理', shortLabel: '连线' },
  { id: 'style', icon: 'type', label: '字体与文本样式', shortLabel: '字体' },
  { id: 'theme', icon: 'palette', label: '应用白板主题', shortLabel: '主题' },
  { id: 'search', icon: 'search', label: '搜索与替换文本', shortLabel: '搜索' },
  { id: 'export', icon: 'download', label: '导出白板图片', shortLabel: '导出' },
  { id: 'present', icon: 'presentation', label: '开始演示模式', shortLabel: '演示' },
  { id: 'info', icon: 'info', label: '查看画布信息', shortLabel: '信息' },
  { id: 'diagnostics', icon: 'shield-check', label: '检查白板完整性', shortLabel: '检查' },
  { id: 'copy-style', icon: 'paintbrush', label: '复制节点格式', shortLabel: '复制' },
  { id: 'paste-style', icon: 'paintbrush-2', label: '粘贴节点格式', shortLabel: '粘贴' }
] as const;

type ToolbarActionId = typeof TOOLBAR_ACTIONS[number]['id'];
const SECONDARY_TOOLBAR_ACTIONS = new Set<ToolbarActionId>([
  'theme', 'search', 'export', 'present', 'info', 'diagnostics', 'copy-style', 'paste-style'
]);
const READONLY_TOOLBAR_ACTIONS = new Set<ToolbarActionId | 'more'>([
  'search', 'export', 'present', 'info', 'diagnostics', 'more'
]);
const COMPONENT_MIME = 'application/x-canvas-studio-component';

export default class CanvasStudioPlugin extends Plugin {
  override settings: CanvasStudioSettings = DEFAULT_SETTINGS;
  private toolbar: HTMLElement | null = null;
  private inspector: HTMLElement | null = null;
  private toolbarCanvas: RuntimeCanvas | null = null;
  private copiedStyle: CanvasStyleAttributes | null = null;
  private pendingTextSelection: TextSelectionSnapshot | null = null;
  private snappingNodeIds = new Set<string>();
  private componentDropCanvas: RuntimeCanvas | null = null;
  private componentDropPreview: HTMLElement | null = null;
  private activeComponentDragId: string | null = null;
  private edgeWaypointOverlay: SVGGElement | null = null;
  private edgeWaypointCanvas: RuntimeCanvas | null = null;
  private edgeWaypointDisplay: SVGPathElement | null = null;
  private edgeWaypointTransient = new Map<string, EdgeWaypoint[]>();
  private edgeWaypointDrag: { canvas: RuntimeCanvas; edgeId: string; index: number } | null = null;

  override async onload(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.addSettingTab(new CanvasStudioSettingTab(this.app, this));

    this.addCommand({
      id: 'create-child-node',
      name: 'Canvas Studio: 创建子节点',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.createChildNode())
    });
    this.addCommand({
      id: 'create-sibling-node',
      name: 'Canvas Studio: 创建同级节点',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.createSiblingNode())
    });
    this.addCommand({
      id: 'layout-mindmap',
      name: 'Canvas Studio: 自动布局思维导图',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.layoutMindMap())
    });
    this.addCommand({
      id: 'copy-style',
      name: 'Canvas Studio: 复制节点格式',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.copyStyle())
    });
    this.addCommand({
      id: 'paste-style',
      name: 'Canvas Studio: 粘贴节点格式',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.pasteStyle())
    });
    this.addCommand({
      id: 'import-markdown-outline',
      name: 'Canvas Studio: 导入 Markdown 大纲',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.openOutlineImport())
    });
    for (const template of FLOW_TEMPLATES) {
      this.addCommand({
        id: `insert-template-${template.id}`,
        name: `Canvas Studio: 插入${template.name}模板`,
        checkCallback: (checking) => this.commandAvailability(checking, () => this.insertFlowTemplate(template.id))
      });
    }
    for (const template of SWIMLANE_TEMPLATES) {
      this.addCommand({
        id: `insert-swimlane-${template.id}`,
        name: `Canvas Studio: 插入${template.name}`,
        checkCallback: (checking) => this.commandAvailability(checking, () => this.insertSwimlane(template.id))
      });
    }
    for (const theme of CANVAS_THEMES) {
      this.addCommand({
        id: `apply-theme-${theme.id}`,
        name: `Canvas Studio: 应用${theme.name}主题`,
        checkCallback: (checking) => this.commandAvailability(checking, () => this.applyTheme(theme.id))
      });
    }
    this.addCommand({
      id: 'search-replace',
      name: 'Canvas Studio: 搜索与替换文本',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.openSearch())
    });
    this.addCommand({
      id: 'start-presentation',
      name: 'Canvas Studio: 开始演示',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.runAdvancedCommand('advanced-canvas:start-presentation'))
    });
    this.addCommand({
      id: 'toggle-readonly',
      name: 'Canvas Studio: 切换只读模式',
      checkCallback: (checking) => {
        const canvas = getCurrentCanvas(this.app);
        if (!canvas) return false;
        if (!checking) this.runAdvancedCommand('advanced-canvas:toggle-readonly');
        return true;
      }
    });
    this.addCommand({
      id: 'diagnostics',
      name: 'Canvas Studio: 检查白板完整性',
      checkCallback: (checking) => {
        const canvas = getCurrentCanvas(this.app);
        if (!canvas) return false;
        if (!checking) this.openDiagnostics();
        return true;
      }
    });
    this.addCommand({
      id: 'component-library',
      name: 'Canvas Studio: 打开常用组件库',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.openComponentLibrary())
    });
    this.addCommand({
      id: 'save-selection-component',
      name: 'Canvas Studio: 保存选区为组件',
      checkCallback: (checking) => this.commandAvailability(checking, () => this.openSaveComponent())
    });

    this.registerDomEvent(document, 'keydown', (event) => this.handleKeydown(event));
    this.registerDomEvent(document, 'dragover', (event) => this.handleComponentDragOver(event));
    this.registerDomEvent(document, 'drop', (event) => this.handleComponentDrop(event));
    this.registerDomEvent(document, 'dragend', () => {
      this.activeComponentDragId = null;
      this.clearComponentDropPreview();
    });
    this.registerDomEvent(document, 'pointermove', (event) => this.handleEdgeWaypointPointerMove(event));
    this.registerDomEvent(document, 'pointerup', () => this.handleEdgeWaypointPointerUp());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.refreshToolbar()));
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.refreshToolbar()));
    this.registerEvent(this.app.workspace.on('advanced-canvas:canvas-changed' as never, () => this.refreshToolbar()));
    this.registerEvent(this.app.workspace.on('advanced-canvas:selection-changed' as never, () => this.updateToolbarState()));
    this.registerEvent(this.app.workspace.on('advanced-canvas:selection-changed' as never, (...args: unknown[]) => {
      this.refreshEdgeWaypointOverlay(args[0] as RuntimeCanvas | undefined);
    }));
    this.registerEvent(this.app.workspace.on('advanced-canvas:node-rendered' as never, (...args: unknown[]) => {
      const node = args[1] as RuntimeCanvasNode | undefined;
      if (node) this.applyTypography(node);
    }));
    this.registerEvent(this.app.workspace.on('advanced-canvas:node-moved' as never, (...args: unknown[]) => {
      const canvas = args[0] as RuntimeCanvas | undefined;
      const node = args[1] as RuntimeCanvasNode | undefined;
      if (canvas && node) {
        this.handleNodeMoved(canvas, node);
        this.refreshEdgeWaypointOverlay(canvas);
      }
    }));
    this.registerEvent(this.app.workspace.on('advanced-canvas:edge-changed' as never, (...args: unknown[]) => {
      this.refreshEdgeWaypointOverlay(args[0] as RuntimeCanvas | undefined);
    }));
    this.registerEvent(this.app.workspace.on('advanced-canvas:canvas-view-unloaded:before' as never, () => this.unmountToolbar()));

    this.refreshToolbar();
  }

  override onunload(): void {
    for (const node of this.toolbarCanvas?.nodes.values() ?? []) this.clearTypography(node);
    this.unmountToolbar();
    this.clearEdgeWaypointOverlay();
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.refreshToolbar();
  }

  private commandAvailability(checking: boolean, action: () => void): boolean {
    const canvas = getCurrentCanvas(this.app);
    if (!canvas || canvas.readonly) return false;
    if (!checking) action();
    return true;
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    const canvas = getCurrentCanvas(this.app);
    if (!canvas || canvas.readonly) return;
    const target = event.target;
    if (!(target instanceof Node) || !canvas.wrapperEl?.contains(target)) return;
    if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable="true"], .cm-editor')) return;
    const selected = selectedRuntimeNodes(canvas);
    if (selected.length !== 1 || selected[0]?.isEditing) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      this.createChildNode();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.createSiblingNode();
    }
  }

  private handleNodeMoved(canvas: RuntimeCanvas, node: RuntimeCanvasNode): void {
    if (this.settings.groupFollowChildren && node.getData().type === 'group' && node.prevX !== undefined && node.prevY !== undefined) {
      const movedData = moveGroupChildren(canvas.getData(), node.id, { x: node.prevX, y: node.prevY }, { x: node.x, y: node.y });
      if (movedData !== canvas.getData()) replaceCanvasData(canvas, movedData);
    }
    if (this.snappingNodeIds.has(node.id) || canvas.readonly) return;
    const data = node.getData();
    const groups = canvas.getData().nodes.filter((candidate) => candidate.type === 'group');
    const groupSnapped = snapNodeIntoGroup(data, groups, { threshold: this.settings.snapThreshold });
    const others = canvas.getData().nodes.filter((candidate) => candidate.id !== node.id);
    const snapped = this.settings.smartSnap
      ? snapNodePosition(groupSnapped.node, others, {
        gridSize: this.settings.snapGridSize,
        threshold: this.settings.snapThreshold
      })
      : { x: groupSnapped.node.x, y: groupSnapped.node.y };
    if (snapped.x === data.x && snapped.y === data.y) return;
    this.snappingNodeIds.add(node.id);
    node.setData({ ...data, x: snapped.x, y: snapped.y });
    canvas.requestSave?.();
    this.showSnapGuides(canvas, snapped.guideX, snapped.guideY);
    window.setTimeout(() => this.snappingNodeIds.delete(node.id), 0);
  }

  private showSnapGuides(canvas: RuntimeCanvas, x?: number, y?: number): void {
    const container = canvas.canvasEl;
    if (!container) return;
    container.querySelectorAll('.canvas-studio-snap-guide').forEach((guide) => guide.remove());
    const guides: HTMLElement[] = [];
    if (x !== undefined) {
      const guide = container.createDiv({ cls: 'canvas-studio-snap-guide canvas-studio-snap-guide-x' });
      guide.style.left = `${x}px`;
      guides.push(guide);
    }
    if (y !== undefined) {
      const guide = container.createDiv({ cls: 'canvas-studio-snap-guide canvas-studio-snap-guide-y' });
      guide.style.top = `${y}px`;
      guides.push(guide);
    }
    window.setTimeout(() => guides.forEach((guide) => guide.remove()), 700);
  }

  private refreshToolbar(): void {
    window.setTimeout(() => {
      const canvas = getCurrentCanvas(this.app);
      if (!canvas?.wrapperEl || !this.settings.showToolbar) {
        this.unmountToolbar();
        return;
      }
      if (this.toolbarCanvas === canvas && this.toolbar?.isConnected) {
        this.updateToolbarState();
        return;
      }
      this.unmountToolbar();
      this.toolbarCanvas = canvas;
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'canvas-studio-toolbar';
      this.toolbar.setAttribute('aria-label', 'Canvas Studio 工具栏');
      for (const action of TOOLBAR_ACTIONS) {
        if (!SECONDARY_TOOLBAR_ACTIONS.has(action.id)) this.addToolbarButton(action);
      }
      this.addMoreToolbarButton();
      canvas.wrapperEl.appendChild(this.toolbar);
      this.inspector = document.createElement('aside');
      this.inspector.className = 'canvas-studio-inspector';
      this.inspector.setAttribute('aria-label', 'Canvas Studio 属性面板');
      canvas.wrapperEl.appendChild(this.inspector);
      this.mountComponentDropTarget(canvas);
      this.syncCanvasThemeClass(canvas);
      for (const node of canvas.nodes.values()) this.applyTypography(node);
      this.updateToolbarState();
    }, 0);
  }

  private addToolbarButton(action: typeof TOOLBAR_ACTIONS[number]): void {
    if (!this.toolbar) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'clickable-icon';
    button.dataset.canvasStudioAction = action.id;
    button.setAttribute('aria-label', action.label);
    setTooltip(button, action.label, { placement: 'bottom' });
    setIcon(button, action.icon);
    button.createSpan({ cls: 'canvas-studio-button-label', text: action.shortLabel });
    button.addEventListener('pointerdown', () => {
      if (action.id === 'style') this.captureTextSelection();
    });
    button.addEventListener('click', () => this.handleToolbarAction(action.id, button));
    this.toolbar.appendChild(button);
  }

  private addMoreToolbarButton(): void {
    if (!this.toolbar) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'clickable-icon canvas-studio-more-button';
    button.dataset.canvasStudioAction = 'more';
    button.setAttribute('aria-label', '更多白板工具');
    setTooltip(button, '更多白板工具', { placement: 'bottom' });
    setIcon(button, 'ellipsis');
    button.createSpan({ cls: 'canvas-studio-button-label', text: '更多' });
    button.addEventListener('click', () => this.openMoreMenu(button));
    this.toolbar.appendChild(button);
  }

  private handleToolbarAction(actionId: ToolbarActionId, anchor: HTMLElement): void {
    switch (actionId) {
      case 'create-child': this.createChildNode(); break;
      case 'create-sibling': this.createSiblingNode(); break;
      case 'layout': this.layoutMindMap(); break;
      case 'import': this.openOutlineImport(); break;
      case 'template': this.openTemplateMenu(anchor); break;
      case 'components': this.openComponentLibrary(); break;
      case 'media': this.openMediaLibrary(); break;
      case 'arrange': this.openArrangeMenu(anchor); break;
      case 'shape': this.openShapeMenu(anchor); break;
      case 'edge': this.openEdgeMenu(anchor); break;
      case 'style': this.openStyleMenu(anchor); break;
      case 'theme': this.openThemeMenu(anchor); break;
      case 'search': this.openSearch(); break;
      case 'export': this.openExportMenu(anchor); break;
      case 'present': this.runAdvancedCommand('advanced-canvas:start-presentation'); break;
      case 'info': this.openCanvasInfo(); break;
      case 'diagnostics': this.openDiagnostics(); break;
      case 'copy-style': this.copyStyle(); break;
      case 'paste-style': this.pasteStyle(); break;
    }
  }

  private updateToolbarState(): void {
    if (!this.toolbar) return;
    const readonly = Boolean(this.toolbarCanvas?.readonly);
    for (const button of this.toolbar.querySelectorAll('button')) {
      const action = button.dataset.canvasStudioAction;
      button.toggleAttribute('disabled', readonly && !READONLY_TOOLBAR_ACTIONS.has((action ?? '') as ToolbarActionId | 'more'));
    }
    this.updateInspector();
    this.refreshEdgeWaypointOverlay(this.toolbarCanvas ?? undefined);
  }

  private updateInspector(): void {
    const inspector = this.inspector;
    const canvas = this.toolbarCanvas;
    if (!inspector || !canvas) return;
    inspector.empty();
    const nodes = selectedNodeData(canvas);
    const edges = selectedEdgeData(canvas);
    if (nodes.length > 0) {
      this.renderNodeInspector(inspector, nodes);
    } else if (edges.length > 0) {
      this.renderEdgeInspector(inspector, edges);
    } else {
      this.renderCanvasInspector(inspector, canvas);
    }
    if (canvas.readonly) {
      inspector.querySelectorAll('button, input, select, textarea').forEach((element) => {
        (element as HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).disabled = true;
      });
    }
  }

  private renderInspectorHeader(container: HTMLElement, title: string, detail: string): void {
    const header = container.createDiv({ cls: 'canvas-studio-inspector-header' });
    header.createDiv({ cls: 'canvas-studio-inspector-title', text: title });
    header.createDiv({ cls: 'canvas-studio-inspector-detail', text: detail });
  }

  private renderNodeInspector(container: HTMLElement, nodes: CanvasNodeData[]): void {
    this.renderInspectorHeader(container, '节点属性', `已选 ${nodes.length} 个节点`);
    const field = (label: string) => {
      const element = container.createDiv({ cls: 'canvas-studio-inspector-field' });
      element.createEl('label', { text: label });
      return element;
    };
    const sizeField = field('字号');
    const size = sizeField.createEl('select');
    for (const value of [12, 14, 16, 18, 20, 24, 32]) size.createEl('option', { value: String(value), text: `${value}px` });
    size.value = typeof nodes[0]?.styleAttributes?.fontSize === 'number' ? String(nodes[0].styleAttributes.fontSize) : '16';
    size.addEventListener('change', () => this.applyStyle({ fontSize: Number(size.value) }));

    const familyField = field('字体');
    const family = familyField.createEl('select');
    for (const [value, label] of [['sans-serif', '无衬线'], ['serif', '衬线'], ['monospace', '等宽'], ['var(--font-interface)', '界面字体']] as const) {
      family.createEl('option', { value, text: label });
    }
    family.value = typeof nodes[0]?.styleAttributes?.fontFamily === 'string' ? nodes[0].styleAttributes.fontFamily : 'sans-serif';
    family.addEventListener('change', () => this.applyStyle({ fontFamily: family.value }));

    const alignField = field('对齐');
    const align = alignField.createDiv({ cls: 'canvas-studio-inspector-segmented' });
    for (const [value, label, icon] of [['left', '左', 'align-left'], ['center', '中', 'align-center'], ['right', '右', 'align-right']] as const) {
      const button = align.createEl('button', { cls: 'clickable-icon', attr: { 'aria-label': `${label}对齐` } });
      setIcon(button, icon);
      setTooltip(button, `${label}对齐`, { placement: 'top' });
      button.addEventListener('click', () => this.applyStyle({ textAlign: value }));
    }

    const shapeField = field('形状');
    const shape = shapeField.createEl('select');
    for (const [value, label] of [['', '矩形'], ['pill', '胶囊'], ['diamond', '判断'], ['parallelogram', '输入输出'], ['document', '文档'], ['database', '数据库']] as const) {
      shape.createEl('option', { value, text: label });
    }
    shape.value = typeof nodes[0]?.styleAttributes?.shape === 'string' ? nodes[0].styleAttributes.shape : '';
    shape.addEventListener('change', () => this.applyShape(shape.value || null));

    const groups = nodes.filter((node) => node.type === 'group');
    if (groups.length > 0) {
      const layoutField = field('分组布局');
      const fit = layoutField.createEl('button', {
        text: '按内容自适应尺寸',
        cls: 'canvas-studio-inspector-action'
      });
      setTooltip(fit, '根据组内节点边界调整分组尺寸，保留节点位置', { placement: 'top' });
      fit.addEventListener('click', () => this.fitSelectedGroups());
    }

    const colorField = field('节点颜色');
    const color = colorField.createEl('select');
    for (const [value, label] of [['1', '红'], ['2', '橙'], ['3', '黄'], ['4', '绿'], ['5', '青'], ['6', '紫']] as const) {
      color.createEl('option', { value, text: label });
    }
    color.value = typeof nodes[0]?.color === 'string' && /^[1-6]$/.test(nodes[0].color) ? nodes[0].color : '4';
    color.addEventListener('change', () => this.applyNodeProperties({ color: color.value }));

    const borderField = field('边框');
    const border = borderField.createEl('select');
    for (const [value, label] of [['solid', '实线'], ['dashed', '虚线'], ['dotted', '点线'], ['invisible', '隐藏']] as const) {
      border.createEl('option', { value, text: label });
    }
    border.value = typeof nodes[0]?.styleAttributes?.border === 'string' ? nodes[0].styleAttributes.border : 'solid';
    border.addEventListener('change', () => this.applyStyle({ border: border.value }));

    const lockField = field('节点状态');
    const lock = lockField.createEl('label', { cls: 'canvas-studio-inspector-check' });
    const lockInput = lock.createEl('input', { type: 'checkbox', attr: { 'aria-label': '锁定节点' } });
    lockInput.checked = nodes.every((node) => node.locked === true);
    lock.createSpan({ text: '锁定选中节点' });
    lockInput.addEventListener('change', () => this.applyNodeProperties({ locked: lockInput.checked }));

    const footer = container.createDiv({ cls: 'canvas-studio-inspector-footer' });
    const more = footer.createEl('button', { text: '更多字体设置', cls: 'mod-cta' });
    more.addEventListener('click', () => this.openStyleMenu(more));
  }

  private renderEdgeInspector(container: HTMLElement, edges: ReturnType<typeof selectedEdgeData>): void {
    this.renderInspectorHeader(container, '连线属性', `已选 ${edges.length} 条连线`);
    const field = container.createDiv({ cls: 'canvas-studio-inspector-field' });
    field.createEl('label', { text: '路由方式' });
    const route = field.createEl('select');
    for (const [value, label] of [['direct', '直线'], ['square', '直角'], ['a-star', '自动避障'], ['bezier', '贝塞尔']] as const) route.createEl('option', { value, text: label });
    const currentRoute = edges[0]?.styleAttributes?.pathfindingMethod;
    route.value = typeof currentRoute === 'string' ? currentRoute : 'square';
    route.addEventListener('change', () => this.applyEdgeStyle({ pathfindingMethod: route.value }));

    const waypointField = container.createDiv({ cls: 'canvas-studio-inspector-field' });
    waypointField.createEl('label', { text: '手动折点' });
    const waypointActions = waypointField.createDiv({ cls: 'canvas-studio-inspector-segmented' });
    const addWaypoint = waypointActions.createEl('button', { text: '添加折点' });
    addWaypoint.addEventListener('click', () => this.addEdgeWaypoint());
    const clearWaypoints = waypointActions.createEl('button', { text: '清除折点' });
    clearWaypoints.addEventListener('click', () => this.clearEdgeWaypoints());
    const waypointCount = parseEdgeWaypoints(edges[0] ?? { styleAttributes: {} } as CanvasEdgeData).length;
    waypointField.createDiv({ cls: 'canvas-studio-inspector-detail', text: `当前 ${waypointCount} 个；拖动圆点调整，双击圆点删除` });

    const colorField = container.createDiv({ cls: 'canvas-studio-inspector-field' });
    colorField.createEl('label', { text: '连线颜色' });
    const color = colorField.createEl('select');
    for (const [value, label] of [['1', '红'], ['2', '橙'], ['3', '黄'], ['4', '绿'], ['5', '青'], ['6', '紫']] as const) color.createEl('option', { value, text: label });
    color.value = typeof edges[0]?.color === 'string' && /^[1-6]$/.test(edges[0].color) ? edges[0].color : '5';
    color.addEventListener('change', () => this.applyEdgeColor(color.value));

    const arrowField = container.createDiv({ cls: 'canvas-studio-inspector-field' });
    arrowField.createEl('label', { text: '终点箭头' });
    const arrow = arrowField.createEl('select');
    for (const [value, label] of [['arrow', '三角箭头'], ['none', '无箭头'], ['diamond', '菱形'], ['circle', '圆形']] as const) arrow.createEl('option', { value, text: label });
    arrow.value = typeof edges[0]?.styleAttributes?.arrow === 'string' ? edges[0].styleAttributes.arrow : 'arrow';
    arrow.addEventListener('change', () => this.applyEdgeStyle({ ...(arrow.value === 'arrow' || arrow.value === 'none' ? { toEnd: arrow.value } : { arrow: arrow.value }) }));

    const labelField = container.createDiv({ cls: 'canvas-studio-inspector-field' });
    labelField.createEl('label', { text: '连线标签' });
    const label = labelField.createEl('input', { type: 'text', value: edges[0]?.label ?? '', attr: { placeholder: '例如：是 / 否' } });
    label.addEventListener('change', () => this.applyEdgeLabel(label.value));
    const footer = container.createDiv({ cls: 'canvas-studio-inspector-footer' });
    const align = footer.createEl('button', { text: '整理选中连线', cls: 'mod-cta' });
    align.addEventListener('click', () => this.alignEdges(false));
  }

  private renderCanvasInspector(container: HTMLElement, canvas: RuntimeCanvas): void {
    this.renderInspectorHeader(container, '画布属性', '未选择对象');
    const data = canvas.getData();
    const summary = container.createDiv({ cls: 'canvas-studio-inspector-summary' });
    summary.createDiv({ text: `节点 ${data.nodes.length}` });
    summary.createDiv({ text: `连线 ${data.edges.length}` });
    summary.createDiv({ text: `分区 ${data.nodes.filter((node) => node.type === 'group').length}` });
    summary.createDiv({ text: '选择对象后显示上下文属性' });
  }

  private unmountToolbar(): void {
    this.unmountComponentDropTarget();
    this.clearEdgeWaypointOverlay();
    if (this.toolbarCanvas?.wrapperEl) {
      this.toolbarCanvas.wrapperEl.classList.remove(...CANVAS_THEMES.map((theme) => theme.canvasClass));
    }
    this.toolbar?.remove();
    this.inspector?.remove();
    this.toolbar = null;
    this.toolbarCanvas = null;
    this.inspector = null;
  }

  private refreshEdgeWaypointOverlay(canvas?: RuntimeCanvas): void {
    const target = canvas ?? this.toolbarCanvas;
    if (!target) {
      this.clearEdgeWaypointOverlay();
      return;
    }
    const [runtimeEdge] = selectedRuntimeEdges(target);
    const selectedEdges = selectedRuntimeEdges(target);
    const edgeData = runtimeEdge?.getData() as CanvasEdgeData | undefined;
    const waypoints = edgeData ? (this.edgeWaypointTransient.get(edgeData.id) ?? parseEdgeWaypoints(edgeData)) : [];
    const display = runtimeEdge?.path?.display;
    const svg = display?.ownerSVGElement;
    if (selectedEdges.length !== 1 || !runtimeEdge || !edgeData || waypoints.length === 0 || !svg || !display || target.readonly) {
      this.clearEdgeWaypointOverlay();
      return;
    }
    this.clearEdgeWaypointOverlay();
    const nodes = new Map(target.getData().nodes.map((node) => [node.id, node]));
    const route = edgeRoutePoints(edgeData, nodes, waypoints);
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'canvas-studio-edge-waypoint-overlay');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'canvas-studio-edge-waypoint-path');
    path.setAttribute('d', polylinePath(route));
    group.appendChild(path);
    waypoints.forEach((point, index) => {
      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('class', 'canvas-studio-edge-waypoint-handle');
      handle.setAttribute('cx', String(point.x));
      handle.setAttribute('cy', String(point.y));
      handle.setAttribute('r', '8');
      handle.setAttribute('aria-label', `连线折点 ${index + 1}`);
      handle.addEventListener('pointerdown', (event) => this.startEdgeWaypointDrag(event, target, edgeData.id, index));
      handle.addEventListener('dblclick', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.removeEdgeWaypoint(target, edgeData.id, index);
      });
      group.appendChild(handle);
    });
    svg.appendChild(group);
    display.classList.add('canvas-studio-edge-waypoint-hidden');
    this.edgeWaypointOverlay = group;
    this.edgeWaypointCanvas = target;
    this.edgeWaypointDisplay = display;
  }

  private clearEdgeWaypointOverlay(): void {
    this.edgeWaypointOverlay?.remove();
    this.edgeWaypointOverlay = null;
    this.edgeWaypointCanvas = null;
    this.edgeWaypointDisplay?.classList.remove('canvas-studio-edge-waypoint-hidden');
    this.edgeWaypointDisplay = null;
  }

  private startEdgeWaypointDrag(event: PointerEvent, canvas: RuntimeCanvas, edgeId: string, index: number): void {
    if (canvas.readonly) return;
    event.preventDefault();
    event.stopPropagation();
    const edge = canvas.getData().edges.find((candidate) => candidate.id === edgeId);
    if (!edge) return;
    this.edgeWaypointTransient.set(edgeId, [...parseEdgeWaypoints(edge)]);
    this.edgeWaypointDrag = { canvas, edgeId, index };
  }

  private handleEdgeWaypointPointerMove(event: PointerEvent): void {
    const drag = this.edgeWaypointDrag;
    if (!drag) return;
    const points = this.edgeWaypointTransient.get(drag.edgeId);
    if (!points?.[drag.index]) return;
    const point = drag.canvas.posFromEvt?.(event) ?? this.componentDropPoint(drag.canvas, event.clientX, event.clientY);
    points[drag.index] = point;
    this.edgeWaypointTransient.set(drag.edgeId, points);
    this.refreshEdgeWaypointOverlay(drag.canvas);
  }

  private handleEdgeWaypointPointerUp(): void {
    const drag = this.edgeWaypointDrag;
    if (!drag) return;
    const points = this.edgeWaypointTransient.get(drag.edgeId);
    this.edgeWaypointDrag = null;
    if (points) this.persistEdgeWaypoints(drag.canvas, drag.edgeId, points);
  }

  private persistEdgeWaypoints(canvas: RuntimeCanvas, edgeId: string, points: EdgeWaypoint[]): void {
    if (canvas.readonly) return;
    const data = canvas.getData();
    const nextData = {
      ...data,
      edges: data.edges.map((edge) => edge.id === edgeId
        ? mergeEdgeStyle(edge, { [EDGE_WAYPOINTS_KEY]: serializeEdgeWaypoints(points) })
        : edge)
    };
    this.edgeWaypointTransient.delete(edgeId);
    replaceCanvasData(canvas, nextData);
    window.setTimeout(() => this.refreshEdgeWaypointOverlay(canvas), 0);
  }

  private addEdgeWaypoint(): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const [edge] = selectedEdgeData(canvas);
    if (!edge) return;
    const data = canvas.getData();
    const points = edgeRoutePoints(edge, new Map(data.nodes.map((node) => [node.id, node])));
    const next = addWaypointAtLongestSegment(points).slice(1, -1);
    this.persistEdgeWaypoints(canvas, edge.id, next);
  }

  private clearEdgeWaypoints(): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const [edge] = selectedEdgeData(canvas);
    if (!edge) return;
    this.persistEdgeWaypoints(canvas, edge.id, []);
  }

  private removeEdgeWaypoint(canvas: RuntimeCanvas, edgeId: string, index: number): void {
    if (canvas.readonly) return;
    const edge = canvas.getData().edges.find((candidate) => candidate.id === edgeId);
    if (!edge) return;
    const points = parseEdgeWaypoints(edge);
    points.splice(index, 1);
    this.persistEdgeWaypoints(canvas, edgeId, points);
  }

  private mountComponentDropTarget(canvas: RuntimeCanvas): void {
    this.componentDropCanvas = canvas;
  }

  private unmountComponentDropTarget(): void {
    const surface = this.componentDropCanvas?.wrapperEl;
    surface?.classList.remove('canvas-studio-component-drop-target');
    this.clearComponentDropPreview();
    this.componentDropCanvas = null;
  }

  private handleComponentDragOver(event: DragEvent): void {
    const canvas = this.componentDropCanvas;
    if (!canvas || canvas.readonly || !event.dataTransfer?.types.includes(COMPONENT_MIME)) return;
    const componentId = event.dataTransfer.getData(COMPONENT_MIME) || this.activeComponentDragId;
    const component = this.availableComponents().find((candidate) => candidate.id === componentId);
    if (!component) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    canvas.wrapperEl?.classList.add('canvas-studio-component-drop-target');
    this.showComponentDropPreview(component.name, event.clientX, event.clientY);
  }

  private handleComponentDrop(event: DragEvent): void {
    const canvas = this.componentDropCanvas;
    if (!canvas || canvas.readonly || !event.dataTransfer?.types.includes(COMPONENT_MIME)) return;
    const componentId = event.dataTransfer.getData(COMPONENT_MIME) || this.activeComponentDragId;
    const component = this.availableComponents().find((candidate) => candidate.id === componentId);
    if (!component) return;
    event.preventDefault();
    this.clearComponentDropPreview();
    this.insertComponentAt(component, this.componentDropPoint(canvas, event.clientX, event.clientY));
  }

  private showComponentDropPreview(name: string, clientX: number, clientY: number): void {
    if (!this.componentDropPreview) {
      this.componentDropPreview = document.body.createDiv({ cls: 'canvas-studio-component-drop-preview' });
    }
    this.componentDropPreview.setText(`放置：${name}`);
    this.componentDropPreview.style.left = `${clientX + 14}px`;
    this.componentDropPreview.style.top = `${clientY + 14}px`;
  }

  private clearComponentDropPreview(): void {
    this.componentDropCanvas?.wrapperEl?.classList.remove('canvas-studio-component-drop-target');
    this.componentDropPreview?.remove();
    this.componentDropPreview = null;
  }

  private beginComponentDrag(componentId: string): void {
    this.activeComponentDragId = componentId;
  }

  private componentDropPoint(canvas: RuntimeCanvas, clientX: number, clientY: number): { x: number; y: number } {
    const surface = canvas.canvasEl ?? canvas.wrapperEl;
    if (!surface) return this.insertionOrigin(canvas, true);
    const rect = surface.getBoundingClientRect();
    return clientPointToCanvas(clientX, clientY, rect, parseCssTransform(window.getComputedStyle(surface).transform));
  }

  private currentCanvas(): RuntimeCanvas | null {
    const canvas = getCurrentCanvas(this.app);
    if (!canvas) new Notice('请先打开一个 Canvas 文件。', 2500);
    return canvas;
  }

  private selection(canvas: RuntimeCanvas): CanvasNodeData[] {
    return selectedNodeData(canvas);
  }

  private createConnectedNode(canvas: RuntimeCanvas, parent: CanvasNodeData, crossPosition: number): string {
    const data = canvas.getData();
    const nodeId = randomId('node');
    const width = Math.max(220, parent.width);
    const height = Math.max(80, parent.height);
    const placement = (() => {
      switch (this.settings.layoutDirection) {
        case 'left': return {
          x: parent.x - width - 96,
          y: crossPosition,
          fromSide: 'left' as const,
          toSide: 'right' as const
        };
        case 'down': return {
          x: crossPosition,
          y: parent.y + parent.height + 32,
          fromSide: 'bottom' as const,
          toSide: 'top' as const
        };
        case 'up': return {
          x: crossPosition,
          y: parent.y - height - 32,
          fromSide: 'top' as const,
          toSide: 'bottom' as const
        };
        default: return {
          x: parent.x + parent.width + 96,
          y: crossPosition,
          fromSide: 'right' as const,
          toSide: 'left' as const
        };
      }
    })();
    const node = mergeNodeStyle({
      id: nodeId,
      type: 'text',
      x: placement.x,
      y: placement.y,
      width,
      height,
      text: '新节点',
    }, {
      fontFamily: this.settings.defaultFontFamily,
      fontSize: this.settings.defaultFontSize
    });
    const edge = {
      id: randomId('edge'),
      fromNode: parent.id,
      fromSide: placement.fromSide,
      toNode: nodeId,
      toSide: placement.toSide,
      toEnd: 'arrow' as const,
      styleAttributes: { pathfindingMethod: 'square' }
    };
    replaceCanvasData(canvas, {
      ...data,
      nodes: [...data.nodes, node],
      edges: [...data.edges, edge]
    });
    return nodeId;
  }

  private createChildNode(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const [parent] = this.selection(canvas);
    if (!parent) {
      new Notice('请选择一个父节点。', 2500);
      return;
    }
    const crossPosition = this.nextChildCrossPosition(canvas, parent);
    const nodeId = this.createConnectedNode(canvas, parent, crossPosition);
    window.setTimeout(() => this.focusNode(canvas, nodeId), 0);
    new Notice('已创建子节点。', 1500);
  }

  private createSiblingNode(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const [selected] = this.selection(canvas);
    if (!selected) {
      new Notice('请选择一个节点。', 2500);
      return;
    }
    const incoming = canvas.getData().edges.find((edge) => edge.toNode === selected.id);
    if (!incoming) {
      new Notice('当前节点没有父节点，无法创建同级节点。', 3000);
      return;
    }
    const parent = canvas.getData().nodes.find((node) => node.id === incoming.fromNode);
    if (!parent) return;
    const crossPosition = this.nextChildCrossPosition(canvas, parent);
    const nodeId = this.createConnectedNode(canvas, parent, crossPosition);
    window.setTimeout(() => this.focusNode(canvas, nodeId), 0);
    new Notice('已创建同级节点。', 1500);
  }

  private nextChildCrossPosition(canvas: RuntimeCanvas, parent: CanvasNodeData): number {
    const data = canvas.getData();
    const childIds = new Set(data.edges
      .filter((edge) => edge.fromNode === parent.id)
      .map((edge) => edge.toNode));
    const children = data.nodes.filter((node) => childIds.has(node.id));
    const vertical = this.settings.layoutDirection === 'down' || this.settings.layoutDirection === 'up';
    if (children.length === 0) return vertical ? parent.x : parent.y;
    return vertical
      ? Math.max(...children.map((node) => node.x + node.width)) + 32
      : Math.max(...children.map((node) => node.y + node.height)) + 32;
  }

  private focusNode(canvas: RuntimeCanvas, nodeId: string): void {
    const node = canvas.nodes.get(nodeId);
    if (!node) return;
    canvas.selectOnly?.(node);
    canvas.zoomToSelection?.();
  }

  private layoutMindMap(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const [selected] = this.selection(canvas);
    const data = canvas.getData();
    const result = computeMindMapLayout(data, {
      rootId: selected?.id,
      direction: this.settings.layoutDirection
    });
    const sides = (() => {
      switch (this.settings.layoutDirection) {
        case 'left': return { fromSide: 'left' as const, toSide: 'right' as const };
        case 'down': return { fromSide: 'bottom' as const, toSide: 'top' as const };
        case 'up': return { fromSide: 'top' as const, toSide: 'bottom' as const };
        default: return { fromSide: 'right' as const, toSide: 'left' as const };
      }
    })();
    const moved = moveNodesToLayout(data, result);
    const nextData = {
      ...moved,
      edges: moved.edges.map((edge) => result.positions.has(edge.fromNode) && result.positions.has(edge.toNode)
        ? { ...edge, ...sides }
        : edge)
    };
    const diagnostics = result.diagnostics.filter((item) => item.kind !== 'disconnected');
    replaceCanvasData(canvas, nextData);
    if (diagnostics.length > 0) {
      new Notice(`布局完成，但发现 ${diagnostics.length} 个树结构问题。`, 4500);
    } else {
      new Notice('思维导图布局完成。', 1500);
    }
  }

  private openShapeMenu(anchor: HTMLElement): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const menu = new Menu();
    const shapes: Array<[string, string | null, string]> = [
      ['矩形', null, 'rectangle-horizontal'],
      ['圆角胶囊', 'pill', 'shape-pill'],
      ['判断', 'diamond', 'diamond'],
      ['输入/输出', 'parallelogram', 'shape-parallelogram'],
      ['圆形', 'circle', 'circle'],
      ['预定义处理', 'predefined-process', 'shape-predefined-process'],
      ['文档', 'document', 'shape-document'],
      ['数据库', 'database', 'shape-database']
    ];
    for (const [label, value, icon] of shapes) {
      menu.addItem((item) => item.setTitle(label).setIcon(icon).onClick(() => this.applyShape(value)));
    }
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private openTemplateMenu(anchor: HTMLElement): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const menu = new Menu();
    for (const template of FLOW_TEMPLATES) {
      menu.addItem((item) => item
        .setTitle(template.name)
        .setIcon('layout-template')
        .onClick(() => this.insertFlowTemplate(template.id)));
    }
    for (const template of SWIMLANE_TEMPLATES) {
      menu.addItem((item) => item
        .setTitle(template.name)
        .setIcon('columns-3')
        .onClick(() => this.insertSwimlane(template.id)));
    }
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private openMoreMenu(anchor: HTMLElement): void {
    const menu = new Menu();
    const readonly = Boolean(this.toolbarCanvas?.readonly);
    for (const action of TOOLBAR_ACTIONS) {
      if (!SECONDARY_TOOLBAR_ACTIONS.has(action.id)) continue;
      if (readonly && !READONLY_TOOLBAR_ACTIONS.has(action.id)) continue;
      menu.addItem((item) => item
        .setTitle(action.label)
        .setIcon(action.icon)
        .onClick(() => this.handleToolbarAction(action.id, anchor)));
    }
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private openComponentLibrary(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    new ComponentLibraryModal(this.app, (component) => this.insertComponent(component), this.availableComponents(), () => this.openSaveComponent(), (componentId) => this.beginComponentDrag(componentId)).open();
  }

  private availableComponents(): ComponentSpec[] {
    const saved = this.settings.savedComponents.map((component) => ({
      id: component.id,
      name: component.name,
      category: '我的组件' as const,
      description: `保存于本地的 ${component.nodes.length} 个节点组件。`,
      build: (origin: { x: number; y: number }, idFactory: (prefix: string) => string) => instantiateSavedComponent(component, origin, idFactory)
    }));
    return [...COMPONENT_LIBRARY, ...saved];
  }

  private openMediaLibrary(): void {
    new MediaLibraryModal(this.app, (item) => this.insertMediaItem(item)).open();
  }

  private insertMediaItem(item: MediaItem): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const data = canvas.getData();
    const origin = safeInsertionOrigin(data, true);
    const node = {
      id: randomId('file'),
      type: 'file' as const,
      file: item.path,
      x: origin.x,
      y: origin.y,
      width: item.kind === 'pdf' ? 440 : 360,
      height: item.kind === 'image' || item.kind === 'vector' ? 260 : 180
    };
    replaceCanvasData(canvas, { ...data, nodes: [...data.nodes, node] });
    new Notice(`已插入素材：${item.name}`, 1800);
  }

  private openSaveComponent(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(this.selection(canvas).map((node) => node.id));
    if (ids.size === 0) {
      new Notice('请先选择要保存的节点。', 2500);
      return;
    }
    new ComponentNameModal(this.app, (name) => {
      try {
        const component = createSavedComponent(canvas.getData(), ids, randomId('component'), name);
        this.settings.savedComponents = [...this.settings.savedComponents, component];
        void this.saveSettings();
        new Notice(`已保存组件：${name}`, 1800);
      } catch (error) {
        new Notice(error instanceof Error ? error.message : '保存组件失败。', 3000);
      }
    }).open();
  }

  private insertComponent(component: ComponentSpec): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    this.insertComponentAt(component, this.insertionOrigin(canvas, true));
  }

  private insertComponentAt(component: ComponentSpec, origin: { x: number; y: number }): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const data = canvas.getData();
    const initialFragment = component.build(origin, randomId);
    const snapped = snapFragmentIntoGroup(
      initialFragment.nodes,
      data.nodes.filter((node) => node.type === 'group'),
      origin
    );
    const fragment = component.build(snapped.origin, randomId);
    this.insertDocument(canvas, fragment);
    new Notice(`已插入组件：${component.name}`, 1800);
  }

  private openThemeMenu(anchor: HTMLElement): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const menu = new Menu();
    for (const theme of CANVAS_THEMES) {
      menu.addItem((item) => item
        .setTitle(theme.name)
        .setIcon('palette')
        .onClick(() => this.applyTheme(theme.id)));
    }
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private openExportMenu(anchor: HTMLElement): void {
    const menu = new Menu();
    menu.addItem((item) => item
      .setTitle('导出整张白板图片')
      .setIcon('image-down')
      .onClick(() => (this.app as unknown as { commands: { executeCommandById(id: string): void } }).commands.executeCommandById('advanced-canvas:export-all-as-image')));
    menu.addItem((item) => item
      .setTitle('导出选中内容图片')
      .setIcon('scan')
      .onClick(() => (this.app as unknown as { commands: { executeCommandById(id: string): void } }).commands.executeCommandById('advanced-canvas:export-selected-as-image')));
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private runAdvancedCommand(commandId: string): void {
    const commands = (this.app as unknown as { commands?: { commands?: Record<string, unknown>; executeCommandById?: (id: string) => boolean } }).commands;
    if (!commands?.commands?.[commandId] || !commands.executeCommandById) {
      new Notice('当前未检测到 Advanced Canvas 对应能力。', 3000);
      return;
    }
    commands.executeCommandById(commandId);
  }

  private openCanvasInfo(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const data = canvas.getData();
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const canvasStudio = metadata?.canvasStudio as Record<string, unknown> | undefined;
    new CanvasInfoModal(this.app, {
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length,
      groupCount: data.nodes.filter((node) => node.type === 'group').length,
      theme: typeof canvasStudio?.theme === 'string' ? canvasStudio.theme : '未设置',
      advancedCanvas: hasAdvancedCanvas(this.app),
      readonly: Boolean(canvas.readonly),
      format: typeof metadata?.version === 'string' ? metadata.version : 'JSON Canvas 1.0'
    }).open();
  }

  private openDiagnostics(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    new CanvasDiagnosticsModal(this.app, diagnoseCanvas(canvas.getData())).open();
  }

  private openSearch(): void {
    new CanvasSearchModal(
      this.app,
      () => getCurrentCanvas(this.app),
      (nodeId) => {
        const canvas = getCurrentCanvas(this.app);
        if (canvas) this.focusNode(canvas, nodeId);
      },
      (match, query, replacement) => {
        const canvas = getCurrentCanvas(this.app);
        if (!canvas) return;
        replaceCanvasData(canvas, replaceCurrentMatch(canvas.getData(), match, query, replacement));
      },
      (query, replacement, caseSensitive) => {
        const canvas = getCurrentCanvas(this.app);
        if (!canvas) return 0;
        const result = replaceAllMatches(canvas.getData(), query, replacement, caseSensitive);
        if (result.replacements > 0) replaceCanvasData(canvas, result.data);
        return result.replacements;
      }
    ).open();
  }

  private openArrangeMenu(anchor: HTMLElement): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const menu = new Menu();
    const actions: Array<[string, ArrangeMode, string]> = [
      ['左对齐', 'align-left', 'align-start-vertical'],
      ['水平居中', 'align-center', 'align-center-vertical'],
      ['右对齐', 'align-right', 'align-end-vertical'],
      ['顶部对齐', 'align-top', 'align-start-horizontal'],
      ['垂直居中', 'align-middle', 'align-center-horizontal'],
      ['底部对齐', 'align-bottom', 'align-end-horizontal'],
      ['水平等距', 'distribute-horizontal', 'align-horizontal-distribute-center'],
      ['垂直等距', 'distribute-vertical', 'align-vertical-distribute-center']
    ];
    for (const [label, mode, icon] of actions) {
      menu.addItem((item) => item.setTitle(label).setIcon(icon).onClick(() => this.applyArrange(mode)));
    }
    menu.addSeparator();
    menu.addItem((item) => item.setTitle('组合选中节点').setIcon('group').onClick(() => this.groupSelection()));
    menu.addItem((item) => item.setTitle('取消组合').setIcon('ungroup').onClick(() => this.ungroupSelection()));
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private groupSelection(): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const ids = new Set(this.selection(canvas).filter((node) => node.type !== 'group').map((node) => node.id));
    if (ids.size < 2) {
      new Notice('请选择至少两个节点后再组合。', 2500);
      return;
    }
    replaceCanvasData(canvas, groupNodes(canvas.getData(), ids, { id: randomId('group'), label: '分组' }));
    new Notice(`已将 ${ids.size} 个节点组合。`, 1800);
  }

  private ungroupSelection(): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const ids = new Set(this.selection(canvas).filter((node) => node.type === 'group').map((node) => node.id));
    if (ids.size === 0) {
      new Notice('请选择至少一个分组后再取消组合。', 2500);
      return;
    }
    replaceCanvasData(canvas, ungroupNodes(canvas.getData(), ids));
    new Notice(`已取消 ${ids.size} 个分组。`, 1800);
  }

  private openEdgeMenu(anchor: HTMLElement): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const menu = new Menu();
    menu.addItem((item) => item
      .setTitle('整理选中连线')
      .setIcon('wand-sparkles')
      .onClick(() => this.alignEdges(false)));
    menu.addItem((item) => item
      .setTitle('整理全部连线')
      .setIcon('route')
      .onClick(() => this.alignEdges(true)));
    menu.addSeparator();
    const styles: Array<[string, CanvasStyleAttributes, string]> = [
      ['贝塞尔曲线', { pathfindingMethod: null }, 'spline'],
      ['直线', { pathfindingMethod: 'direct' }, 'slash'],
      ['直角折线', { pathfindingMethod: 'square' }, 'corner-down-right'],
      ['自动避障', { pathfindingMethod: 'a-star' }, 'route'],
      ['实线', { path: null }, 'minus'],
      ['虚线', { path: 'long-dashed' }, 'ellipsis'],
      ['点线', { path: 'dotted' }, 'more-horizontal'],
      ['三角箭头', { arrow: null }, 'move-right'],
      ['菱形箭头', { arrow: 'diamond' }, 'diamond'],
      ['圆形箭头', { arrow: 'circle' }, 'circle']
    ];
    for (const [label, style, icon] of styles) {
      menu.addItem((item) => item.setTitle(label).setIcon(icon).onClick(() => this.applyEdgeStyle(style)));
    }
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private openStyleMenu(anchor: HTMLElement): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const menu = new Menu();
    for (const [label, family] of [
      ['无衬线字体', 'sans-serif'],
      ['衬线字体', 'serif'],
      ['等宽字体', 'monospace'],
      ['系统界面字体', 'var(--font-interface)']
    ] as const) {
      menu.addItem((item) => item.setTitle(label).setIcon('case-sensitive').onClick(() => this.applyStyle({ fontFamily: family })));
    }
    menu.addSeparator();
    for (const size of [14, 16, 20, 24, 32]) {
      menu.addItem((item) => item.setTitle(`字号 ${size}`).setIcon('type').onClick(() => this.applyStyle({ fontSize: size })));
    }
    for (const align of [['左对齐', 'left'], ['居中', 'center'], ['右对齐', 'right']] as const) {
      menu.addItem((item) => item.setTitle(align[0]).setIcon(`align-${align[1]}`).onClick(() => this.applyStyle({ textAlign: align[1] })));
    }
    menu.addItem((item) => item.setTitle('粗体').setIcon('bold').onClick(() => this.applyStyle({ fontWeight: 700 })));
    menu.addItem((item) => item.setTitle('斜体').setIcon('italic').onClick(() => this.applyStyle({ fontStyle: 'italic' })));
    menu.addItem((item) => item.setTitle('下划线').setIcon('underline').onClick(() => this.applyStyle({ textDecoration: 'underline' })));
    menu.addItem((item) => item.setTitle('清除强调').setIcon('remove-formatting').onClick(() => this.applyStyle({ fontWeight: null, fontStyle: null, textDecoration: null })));
    menu.addSeparator();
    for (const lineHeight of [1.2, 1.5, 1.8]) {
      menu.addItem((item) => item.setTitle(`行距 ${lineHeight}`).setIcon('rows-3').onClick(() => this.applyStyle({ lineHeight })));
    }
    for (const padding of [8, 16, 24]) {
      menu.addItem((item) => item.setTitle(`内边距 ${padding}`).setIcon('panel-top').onClick(() => this.applyStyle({ padding })));
    }
    menu.addSeparator();
    for (const [label, color] of [
      ['默认文字色', null],
      ['强调色', 'var(--text-accent)'],
      ['弱化色', 'var(--text-muted)'],
      ['红色', 'var(--text-error)'],
      ['绿色', 'var(--color-green)']
    ] as const) {
      menu.addItem((item) => item.setTitle(label).setIcon('palette').onClick(() => this.applyStyle({ textColor: color })));
    }
    menu.showAtPosition(this.menuPosition(anchor));
  }

  private captureTextSelection(): void {
    this.pendingTextSelection = null;
    const canvas = getCurrentCanvas(this.app);
    if (!canvas) return;
    const [node] = selectedRuntimeNodes(canvas);
    const editorState = node?.child?.editMode?.cm?.state;
    const range = editorState?.selection?.main;
    const sourceText = editorState?.doc?.toString();
    if (!node?.isEditing || !range || typeof sourceText !== 'string' || range.to <= range.from) return;
    this.pendingTextSelection = {
      nodeId: node.id,
      from: range.from,
      to: range.to,
      sourceText
    };
  }

  private menuPosition(anchor: HTMLElement): { x: number; y: number } {
    const rect = anchor.getBoundingClientRect();
    return { x: rect.left, y: rect.bottom + 4 };
  }

  private openOutlineImport(): void {
    new MarkdownOutlineModal(this.app, (markdown) => this.insertMarkdownOutline(markdown)).open();
  }

  private insertionOrigin(canvas: RuntimeCanvas, center = false): { x: number; y: number } {
    return safeInsertionOrigin(canvas.getData(), center);
  }

  private insertDocument(canvas: RuntimeCanvas, fragment: CanvasDocument): void {
    const data = canvas.getData();
    replaceCanvasData(canvas, {
      ...data,
      nodes: [...data.nodes, ...fragment.nodes],
      edges: [...data.edges, ...fragment.edges]
    });
    const rootId = fragment.nodes[0]?.id;
    if (rootId) window.setTimeout(() => this.focusNode(canvas, rootId), 0);
  }

  private insertMarkdownOutline(markdown: string): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    try {
      const outline = parseMarkdownOutline(markdown);
      const fragment = outlineToCanvas(outline, {
        direction: this.settings.layoutDirection,
        origin: this.insertionOrigin(canvas),
        idFactory: randomId,
        fontFamily: this.settings.defaultFontFamily,
        fontSize: this.settings.defaultFontSize
      });
      this.insertDocument(canvas, fragment);
      new Notice(`已导入 ${fragment.nodes.length} 个大纲节点。`, 2500);
    } catch (error) {
      new Notice(error instanceof Error ? error.message : 'Markdown 大纲导入失败。', 4500);
    }
  }

  private insertFlowTemplate(templateId: string): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const template = FLOW_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    const fragment = instantiateFlowTemplate(template, {
      origin: this.insertionOrigin(canvas, true),
      idFactory: randomId,
      fontFamily: this.settings.defaultFontFamily,
      fontSize: this.settings.defaultFontSize
    });
    this.insertDocument(canvas, fragment);
    new Notice(`已插入${template.name}模板。`, 2000);
  }

  private insertSwimlane(templateId: string): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const template = SWIMLANE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    const fragment = instantiateSwimlane(template, {
      origin: this.insertionOrigin(canvas),
      idFactory: randomId,
      fontFamily: this.settings.defaultFontFamily,
      fontSize: this.settings.defaultFontSize
    });
    this.insertDocument(canvas, fragment);
    new Notice(`已插入${template.name}。`, 2000);
  }

  private applyTheme(themeId: string): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const theme = CANVAS_THEMES.find((item) => item.id === themeId);
    if (!theme) return;
    const selectedIds = new Set(this.selection(canvas).map((node) => node.id));
    const targetIds = selectedIds.size > 0 ? selectedIds : undefined;
    replaceCanvasData(canvas, applyCanvasTheme(canvas.getData(), theme, targetIds));
    if (!targetIds) this.syncCanvasThemeClass(canvas, theme.id);
    new Notice(targetIds ? `已为选中节点应用${theme.name}主题。` : `已为整张白板应用${theme.name}主题。`, 2000);
  }

  private syncCanvasThemeClass(canvas: RuntimeCanvas, themeId?: string): void {
    if (!canvas.wrapperEl) return;
    canvas.wrapperEl.classList.remove(...CANVAS_THEMES.map((theme) => theme.canvasClass));
    const metadata = canvas.getData().metadata as Record<string, unknown> | undefined;
    const canvasStudio = metadata?.canvasStudio as Record<string, unknown> | undefined;
    const resolvedThemeId = themeId ?? (typeof canvasStudio?.theme === 'string' ? canvasStudio.theme : undefined);
    const theme = CANVAS_THEMES.find((item) => item.id === resolvedThemeId);
    if (theme) canvas.wrapperEl.classList.add(theme.canvasClass);
  }

  private applyStyle(patch: CanvasStyleAttributes): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const textSelection = this.pendingTextSelection;
    this.pendingTextSelection = null;
    if (textSelection) {
      const node = canvas.getData().nodes.find((item) => item.id === textSelection.nodeId);
      if (node) {
        const marker = patch.fontWeight === 700 ? '**' : patch.fontStyle === 'italic' ? '*' : patch.textDecoration === 'underline' ? null : undefined;
        const styledText = marker
          ? markdownTextSelection(textSelection.sourceText, textSelection.from, textSelection.to, marker)
          : styleTextSelection(textSelection.sourceText, textSelection.from, textSelection.to, patch);
        if (styledText) {
          const nextData = updateNodes(canvas.getData(), new Set([node.id]), (item) => ({ ...item, text: styledText }));
          replaceCanvasData(canvas, nextData);
          new Notice('已将字体样式应用到选中文字。', 1800);
          return;
        }
      }
    }
    const ids = new Set(this.selection(canvas).map((node) => node.id));
    if (ids.size === 0) {
      new Notice('请选择至少一个节点。', 2500);
      return;
    }
    const nextData = updateNodes(canvas.getData(), ids, (node) => mergeNodeStyle(node, patch));
    replaceCanvasData(canvas, nextData);
    for (const id of ids) {
      const node = canvas.nodes.get(id);
      if (node) this.applyTypography(node);
    }
  }

  private applyNodeProperties(patch: Pick<CanvasNodeData, 'color' | 'locked'>): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(this.selection(canvas).map((node) => node.id));
    if (ids.size === 0) return;
    replaceCanvasData(canvas, updateNodes(canvas.getData(), ids, (node) => ({ ...node, ...patch })));
  }

  private fitSelectedGroups(): void {
    const canvas = this.currentCanvas();
    if (!canvas || canvas.readonly) return;
    const groupIds = new Set(this.selection(canvas)
      .filter((node) => node.type === 'group')
      .map((node) => node.id));
    if (groupIds.size === 0) return;
    const data = canvas.getData();
    const nextData = fitGroupsToChildren(data, groupIds);
    const changed = nextData.nodes.some((node, index) => {
      const previous = data.nodes[index];
      return previous && (node.x !== previous.x || node.y !== previous.y || node.width !== previous.width || node.height !== previous.height);
    });
    if (!changed) {
      new Notice('选中的分组没有可适应的内部节点。', 2200);
      return;
    }
    replaceCanvasData(canvas, nextData);
    new Notice(`已调整 ${groupIds.size} 个分组的尺寸。`, 1800);
  }

  private applyEdgeColor(color: string): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(selectedEdgeData(canvas).map((edge) => edge.id));
    replaceCanvasData(canvas, {
      ...canvas.getData(),
      edges: canvas.getData().edges.map((edge) => ids.has(edge.id) ? { ...edge, color } : edge)
    });
  }

  private applyEdgeLabel(label: string): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(selectedEdgeData(canvas).map((edge) => edge.id));
    replaceCanvasData(canvas, {
      ...canvas.getData(),
      edges: canvas.getData().edges.map((edge) => ids.has(edge.id) ? { ...edge, label: label || undefined } : edge)
    });
  }

  private applyShape(shape: string | null): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(this.selection(canvas).filter((node) => node.type === 'text').map((node) => node.id));
    if (ids.size === 0) {
      new Notice('请选择至少一个文本节点。', 2500);
      return;
    }
    const nextData = updateNodes(canvas.getData(), ids, (node) => {
      const styled = mergeNodeStyle(node, {
        shape,
        ...(shape === 'diamond' ? { padding: 32 } : {})
      });
      if (shape === 'diamond') return { ...styled, width: Math.max(styled.width, 340), height: Math.max(styled.height, 180) };
      if (shape === 'circle') {
        const size = Math.max(styled.width, styled.height, 220);
        return { ...styled, width: size, height: size };
      }
      if (shape === 'document' || shape === 'database') return { ...styled, height: Math.max(styled.height, 120) };
      return styled;
    });
    replaceCanvasData(canvas, nextData);
    for (const id of ids) {
      const node = canvas.nodes.get(id);
      if (node) this.applyTypography(node);
    }
  }

  private applyArrange(mode: ArrangeMode): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(this.selection(canvas).map((node) => node.id));
    if (ids.size < 2) {
      new Notice('请选择至少两个节点。', 2500);
      return;
    }
    replaceCanvasData(canvas, arrangeNodes(canvas.getData(), ids, mode));
  }

  private applyEdgeStyle(patch: CanvasStyleAttributes): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const ids = new Set(selectedEdgeData(canvas).map((edge) => edge.id));
    if (ids.size === 0) {
      new Notice('请选择至少一条连线。', 2500);
      return;
    }
    const data = canvas.getData();
    replaceCanvasData(canvas, {
      ...data,
      edges: data.edges.map((edge) => ids.has(edge.id) ? mergeEdgeStyle(edge, patch) : edge)
    });
  }

  private alignEdges(all: boolean): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const selectedIds = new Set(selectedEdgeData(canvas).map((edge) => edge.id));
    if (!all && selectedIds.size === 0) {
      new Notice('请先选中至少一条连线，或选择“整理全部连线”。', 3000);
      return;
    }
    replaceCanvasData(canvas, alignCanvasEdges(canvas.getData(), all ? undefined : selectedIds));
    new Notice(all ? '已整理全部连线。' : `已整理 ${selectedIds.size} 条连线。`, 1800);
  }

  private copyStyle(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    const [node] = this.selection(canvas);
    if (!node) {
      new Notice('请选择一个源节点。', 2500);
      return;
    }
    this.copiedStyle = {
      ...(node.styleAttributes ?? {}),
      ...(node.color ? { color: node.color } : {})
    };
    new Notice('已复制节点格式。', 1500);
  }

  private pasteStyle(): void {
    const canvas = this.currentCanvas();
    if (!canvas) return;
    if (!this.copiedStyle) {
      new Notice('还没有复制的节点格式。', 2500);
      return;
    }
    const ids = new Set(this.selection(canvas).map((node) => node.id));
    const color = this.copiedStyle.color;
    const style = { ...this.copiedStyle };
    delete style.color;
    const nextData = updateNodes(canvas.getData(), ids, (node) => ({
      ...mergeNodeStyle(node, style),
      ...(typeof color === 'string' ? { color } : {})
    }));
    replaceCanvasData(canvas, nextData);
    for (const id of ids) {
      const node = canvas.nodes.get(id);
      if (node) this.applyTypography(node);
    }
    new Notice('已粘贴节点格式。', 1500);
  }

  private applyTypography(node: RuntimeCanvasNode): void {
    const element = node.nodeEl;
    if (!element) return;
    const style = node.getData().styleAttributes ?? {};
    const properties: Array<[string, unknown, string]> = [
      ['--canvas-studio-font-family', style.fontFamily, ''],
      ['--canvas-studio-font-size', style.fontSize, 'px'],
      ['--canvas-studio-font-weight', style.fontWeight, ''],
      ['--canvas-studio-font-style', style.fontStyle, ''],
      ['--canvas-studio-line-height', style.lineHeight, ''],
      ['--canvas-studio-text-color', style.textColor, ''],
      ['--canvas-studio-padding', style.padding, 'px']
    ];
    for (const [property, value, unit] of properties) {
      if (value === undefined || value === null || value === '') element.style.removeProperty(property);
      else element.style.setProperty(property, `${String(value)}${unit}`);
    }
    element.toggleClass('canvas-studio-underlined', style.textDecoration === 'underline');
  }

  private clearTypography(node: RuntimeCanvasNode): void {
    const element = node.nodeEl;
    if (!element) return;
    for (const property of [
      '--canvas-studio-font-family',
      '--canvas-studio-font-size',
      '--canvas-studio-font-weight',
      '--canvas-studio-font-style',
      '--canvas-studio-line-height',
      '--canvas-studio-text-color',
      '--canvas-studio-padding'
    ]) element.style.removeProperty(property);
    element.removeClass('canvas-studio-underlined');
  }
}

class MarkdownOutlineModal extends Modal {
  constructor(
    app: CanvasStudioPlugin['app'],
    private readonly submit: (markdown: string) => void
  ) {
    super(app);
  }

  override onOpen(): void {
    this.titleEl.setText('Markdown 大纲导入');
    const textarea = this.contentEl.createEl('textarea', {
      cls: 'canvas-studio-import-textarea',
      attr: {
        'aria-label': 'Markdown 大纲',
        placeholder: '# 主题\n## 分支\n- 条目'
      }
    });
    const actions = this.contentEl.createDiv({ cls: 'canvas-studio-modal-actions' });
    const cancel = actions.createEl('button', { text: '取消' });
    const confirm = actions.createEl('button', { text: '导入', cls: 'mod-cta' });
    cancel.addEventListener('click', () => this.close());
    confirm.addEventListener('click', () => {
      const value = textarea.value.trim();
      if (!value) return;
      this.submit(value);
      this.close();
    });
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) confirm.click();
    });
    window.setTimeout(() => textarea.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

interface CanvasInfo {
  nodeCount: number;
  edgeCount: number;
  groupCount: number;
  theme: string;
  advancedCanvas: boolean;
  readonly: boolean;
  format: string;
}

class CanvasInfoModal extends Modal {
  constructor(app: CanvasStudioPlugin['app'], private readonly info: CanvasInfo) {
    super(app);
  }

  override onOpen(): void {
    this.titleEl.setText('Canvas 信息');
    const table = this.contentEl.createEl('table', { cls: 'canvas-studio-info-table' });
    const rows: Array<[string, string]> = [
      ['节点', String(this.info.nodeCount)],
      ['连线', String(this.info.edgeCount)],
      ['分区', String(this.info.groupCount)],
      ['主题', this.info.theme],
      ['格式', this.info.format],
      ['Advanced Canvas', this.info.advancedCanvas ? '已启用' : '未启用'],
      ['编辑状态', this.info.readonly ? '只读' : '可编辑']
    ];
    for (const [label, value] of rows) {
      const row = table.createEl('tr');
      row.createEl('th', { text: label });
      row.createEl('td', { text: value });
    }
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

class ComponentLibraryModal extends Modal {
  constructor(
    app: CanvasStudioPlugin['app'],
    private readonly insert: (component: ComponentSpec) => void,
    private readonly components: ComponentSpec[] = COMPONENT_LIBRARY,
    private readonly saveSelection?: () => void,
    private readonly onDragStart?: (componentId: string) => void
  ) {
    super(app);
  }

  override onOpen(): void {
    this.titleEl.setText('常用组件库');
    this.modalEl.addClass('canvas-studio-component-modal');
    if (this.saveSelection) {
      const save = this.contentEl.createEl('button', { text: '保存当前选区为组件', cls: 'mod-cta canvas-studio-component-save' });
      save.addEventListener('click', () => { this.close(); this.saveSelection?.(); });
    }
    const builtInIds = new Set(COMPONENT_LIBRARY.map((component) => component.id));
    const extra = this.components.filter((component) => !builtInIds.has(component.id));
    for (const [category, components] of componentsByCategory(extra)) {
      this.contentEl.createEl('h3', { text: category, cls: 'canvas-studio-component-category' });
      const grid = this.contentEl.createDiv({ cls: 'canvas-studio-component-grid' });
      for (const component of components) {
        const button = grid.createEl('button', { cls: 'canvas-studio-component-card', attr: { draggable: 'true' } });
        button.draggable = true;
        setIcon(button, component.id === 'button' ? 'square-mouse-pointer' : component.id === 'input' ? 'text-cursor-input' : component.id === 'tag' ? 'tag' : component.id === 'info-card' ? 'panel-top' : 'triangle-alert');
        button.createSpan({ cls: 'canvas-studio-component-name', text: component.name });
        button.createSpan({ cls: 'canvas-studio-component-description', text: component.description });
        setTooltip(button, component.description, { placement: 'top' });
        button.addEventListener('dragstart', (event) => {
          event.dataTransfer?.setData(COMPONENT_MIME, component.id);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
          this.onDragStart?.(component.id);
          this.close();
        });
        button.addEventListener('click', () => {
          this.insert(component);
          this.close();
        });
      }
    }
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

const MEDIA_KIND_LABELS: Record<MediaKind | 'all', string> = {
  all: '全部类型',
  image: '图片',
  vector: 'SVG',
  pdf: 'PDF',
  file: '其他文件'
};

const MEDIA_KIND_ICONS: Record<MediaKind, string> = {
  image: 'image',
  vector: 'file-code-2',
  pdf: 'file-text',
  file: 'file'
};

class MediaLibraryModal extends Modal {
  private readonly items: MediaItem[];
  private queryInput!: HTMLInputElement;
  private kindSelect!: HTMLSelectElement;
  private summaryEl!: HTMLElement;
  private listEl!: HTMLElement;

  constructor(
    app: CanvasStudioPlugin['app'],
    private readonly insert: (item: MediaItem) => void
  ) {
    super(app);
    this.items = mediaItemsFromPaths(this.app.vault.getFiles().map((file) => file.path));
  }

  override onOpen(): void {
    this.titleEl.setText('Vault 媒体库');
    this.modalEl.addClass('canvas-studio-media-modal');

    const filters = this.contentEl.createDiv({ cls: 'canvas-studio-media-filters' });
    this.queryInput = filters.createEl('input', {
      type: 'search',
      attr: { placeholder: '搜索文件名或路径', 'aria-label': '搜索文件名或路径' }
    });
    this.kindSelect = filters.createEl('select', { attr: { 'aria-label': '媒体类型' } });
    for (const kind of ['all', 'image', 'vector', 'pdf', 'file'] as const) {
      this.kindSelect.createEl('option', { value: kind, text: MEDIA_KIND_LABELS[kind] });
    }

    this.summaryEl = this.contentEl.createDiv({ cls: 'canvas-studio-media-summary' });
    this.listEl = this.contentEl.createDiv({ cls: 'canvas-studio-media-list' });
    this.queryInput.addEventListener('input', () => this.renderItems());
    this.kindSelect.addEventListener('change', () => this.renderItems());
    this.renderItems();
    window.setTimeout(() => this.queryInput.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private renderItems(): void {
    const kind = this.kindSelect.value as MediaKind | 'all';
    const items = filterMediaItems(this.items, this.queryInput.value, kind);
    this.summaryEl.setText(`${items.length} 个文件可插入`);
    this.listEl.empty();
    if (items.length === 0) {
      this.listEl.createDiv({ cls: 'canvas-studio-media-empty', text: '没有匹配的 Vault 文件。' });
      return;
    }
    for (const item of items) this.renderItem(item);
  }

  private renderItem(item: MediaItem): void {
    const button = this.listEl.createEl('button', {
      cls: 'canvas-studio-media-item',
      attr: { type: 'button', 'aria-label': `插入 ${item.name}` }
    });
    const preview = button.createDiv({ cls: 'canvas-studio-media-preview' });
    this.renderPreview(preview, item);
    const details = button.createDiv({ cls: 'canvas-studio-media-details' });
    details.createDiv({ cls: 'canvas-studio-media-name', text: item.name });
    details.createDiv({ cls: 'canvas-studio-media-path', text: item.path });
    details.createDiv({ cls: 'canvas-studio-media-kind', text: MEDIA_KIND_LABELS[item.kind] });
    setTooltip(button, `插入 ${item.path}`, { placement: 'top' });
    button.addEventListener('click', () => {
      this.insert(item);
      this.close();
    });
  }

  private renderPreview(container: HTMLElement, item: MediaItem): void {
    const file = this.app.vault.getAbstractFileByPath(item.path);
    if (item.kind === 'image' && file instanceof TFile) {
      const image = container.createEl('img', {
        attr: { src: this.app.vault.getResourcePath(file), alt: item.name, loading: 'lazy' }
      });
      image.addEventListener('error', () => {
        image.remove();
        this.renderFileIcon(container, item);
      }, { once: true });
      return;
    }
    this.renderFileIcon(container, item);
  }

  private renderFileIcon(container: HTMLElement, item: MediaItem): void {
    const icon = container.createDiv({ cls: 'canvas-studio-media-icon' });
    setIcon(icon, MEDIA_KIND_ICONS[item.kind]);
    icon.setAttribute('aria-hidden', 'true');
  }
}

class ComponentNameModal extends Modal {
  constructor(app: CanvasStudioPlugin['app'], private readonly submit: (name: string) => void) {
    super(app);
  }

  override onOpen(): void {
    this.titleEl.setText('保存为组件');
    const input = this.contentEl.createEl('input', {
      type: 'text',
      attr: { placeholder: '组件名称', 'aria-label': '组件名称' }
    });
    const actions = this.contentEl.createDiv({ cls: 'canvas-studio-modal-actions' });
    const cancel = actions.createEl('button', { text: '取消' });
    const save = actions.createEl('button', { text: '保存', cls: 'mod-cta' });
    const commit = () => {
      const value = input.value.trim();
      if (!value) return new Notice('请输入组件名称。', 2000);
      this.submit(value);
      this.close();
    };
    cancel.addEventListener('click', () => this.close());
    save.addEventListener('click', commit);
    input.addEventListener('keydown', (event) => { if (event.key === 'Enter') commit(); });
    window.setTimeout(() => input.focus(), 0);
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

class CanvasDiagnosticsModal extends Modal {
  constructor(app: CanvasStudioPlugin['app'], private readonly issues: CanvasHealthIssue[]) {
    super(app);
  }

  override onOpen(): void {
    this.titleEl.setText('Canvas 完整性检查');
    if (this.issues.length === 0) {
      this.contentEl.createDiv({ cls: 'canvas-studio-diagnostics-clean', text: '未发现结构问题。' });
      return;
    }
    const summary = this.contentEl.createDiv({ cls: 'canvas-studio-diagnostics-summary' });
    summary.setText(`发现 ${this.issues.length} 个问题；本检查不会自动修改文件。`);
    const list = this.contentEl.createEl('ul', { cls: 'canvas-studio-diagnostics-list' });
    for (const issue of this.issues) {
      const item = list.createEl('li');
      item.createEl('strong', { text: issue.kind });
      item.createSpan({ text: `：${issue.message}` });
      if (issue.ids.length > 0) item.createEl('code', { text: ` [${issue.ids.join(', ')}]` });
    }
  }

  override onClose(): void {
    this.contentEl.empty();
  }
}

class CanvasSearchModal extends Modal {
  private queryInput!: HTMLInputElement;
  private replacementInput!: HTMLInputElement;
  private caseSensitiveInput!: HTMLInputElement;
  private resultSummary!: HTMLElement;
  private matchList!: HTMLElement;
  private matches: CanvasSearchMatch[] = [];
  private cursor = 0;

  constructor(
    app: CanvasStudioPlugin['app'],
    private readonly getCanvas: () => RuntimeCanvas | null,
    private readonly focusNode: (nodeId: string) => void,
    private readonly replaceCurrent: (match: CanvasSearchMatch, query: string, replacement: string) => void,
    private readonly replaceAll: (query: string, replacement: string, caseSensitive: boolean) => number
  ) {
    super(app);
  }

  override onOpen(): void {
    this.modalEl.addClass('canvas-studio-search-modal');
    this.titleEl.setText('Canvas 搜索与替换');
    const queryLabel = this.contentEl.createEl('label', { text: '搜索文本' });
    this.queryInput = queryLabel.createEl('input', {
      type: 'search',
      attr: { 'aria-label': '搜索文本', placeholder: '输入要查找的文本' }
    });
    const replacementLabel = this.contentEl.createEl('label', { text: '替换为' });
    this.replacementInput = replacementLabel.createEl('input', {
      type: 'text',
      attr: { 'aria-label': '替换为', placeholder: '可留空以删除文本' }
    });
    const options = this.contentEl.createDiv({ cls: 'canvas-studio-search-options' });
    const caseLabel = options.createEl('label');
    this.caseSensitiveInput = caseLabel.createEl('input', { type: 'checkbox', attr: { 'aria-label': '区分大小写' } });
    caseLabel.createSpan({ text: '区分大小写' });
    this.resultSummary = this.contentEl.createDiv({ cls: 'canvas-studio-search-summary' });
    this.matchList = this.contentEl.createDiv({ cls: 'canvas-studio-search-results' });
    const actions = this.contentEl.createDiv({ cls: 'canvas-studio-modal-actions' });
    const next = actions.createEl('button', { text: '定位下一个' });
    const replace = actions.createEl('button', { text: '替换当前' });
    const replaceAll = actions.createEl('button', { text: '全部替换', cls: 'mod-cta' });
    next.addEventListener('click', () => this.focusNext());
    replace.addEventListener('click', () => this.replaceSelected());
    replaceAll.addEventListener('click', () => this.replaceEverywhere());
    this.queryInput.addEventListener('input', () => this.refreshMatches());
    this.caseSensitiveInput.addEventListener('change', () => this.refreshMatches());
    this.queryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') this.focusNext();
    });
    window.setTimeout(() => this.queryInput.focus(), 0);
    this.refreshMatches();
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private refreshMatches(): void {
    const query = this.queryInput.value;
    const canvas = this.getCanvas();
    this.matches = canvas ? findCanvasMatches(canvas.getData(), query, this.caseSensitiveInput.checked) : [];
    this.cursor = 0;
    this.resultSummary.setText(query ? `找到 ${this.matches.length} 处匹配` : '输入文本后开始搜索');
    this.matchList.empty();
    for (const [index, match] of this.matches.slice(0, 20).entries()) {
      const item = this.matchList.createEl('button', {
        text: `${index + 1}. ${match.text}`,
        cls: 'canvas-studio-search-result'
      });
      item.addEventListener('click', () => {
        this.cursor = index;
        this.focusNext();
      });
    }
    if (this.matches.length > 20) this.matchList.createEl('div', { text: '仅显示前 20 个结果。', cls: 'canvas-studio-search-more' });
  }

  private focusNext(): void {
    if (this.matches.length === 0) return;
    const match = this.matches[this.cursor % this.matches.length]!;
    this.focusNode(match.nodeId);
    this.cursor = (this.cursor + 1) % this.matches.length;
  }

  private replaceSelected(): void {
    if (this.matches.length === 0) return;
    const query = this.queryInput.value;
    const replacement = this.replacementInput.value;
    const match = this.matches[Math.max(0, this.cursor - 1) % this.matches.length]!;
    this.replaceCurrent(match, query, replacement);
    this.refreshMatches();
    new Notice('已替换当前匹配。', 1500);
  }

  private replaceEverywhere(): void {
    const query = this.queryInput.value;
    const replacements = this.replaceAll(query, this.replacementInput.value, this.caseSensitiveInput.checked);
    this.refreshMatches();
    new Notice(replacements > 0 ? `已替换 ${replacements} 处匹配。` : '没有可替换的匹配。', 2000);
  }
}

class CanvasStudioSettingTab extends PluginSettingTab {
  plugin: CanvasStudioPlugin;

  constructor(app: CanvasStudioPlugin['app'], plugin: CanvasStudioPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  override display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Canvas Studio' });
    containerEl.createEl('p', {
      text: hasAdvancedCanvas(this.app)
        ? 'Advanced Canvas 已检测到，流程图形状和边样式将写入原生 .canvas。'
        : '未检测到 Advanced Canvas，插件将使用基础兼容模式。'
    });

    new Setting(containerEl)
      .setName('显示 Canvas 工具栏')
      .setDesc('只在打开 Canvas 时显示。')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showToolbar)
        .onChange(async (value) => {
          this.plugin.settings.showToolbar = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('智能吸附')
      .setDesc('移动节点后吸附到网格或邻近节点的边缘和中心线。')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.smartSnap)
        .onChange(async (value) => {
          this.plugin.settings.smartSnap = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('分组带动子节点')
      .setDesc('移动分区或泳道时，自动带动其中的节点。')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.groupFollowChildren)
        .onChange(async (value) => {
          this.plugin.settings.groupFollowChildren = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('吸附阈值')
      .setDesc('节点距离参考线多少像素以内时触发吸附。')
      .addSlider((slider) => slider
        .setLimits(4, 24, 1)
        .setValue(this.plugin.settings.snapThreshold)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.snapThreshold = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('默认字体')
      .setDesc('保存到新建文本节点的 styleAttributes.fontFamily。')
      .addText((text) => text
        .setValue(this.plugin.settings.defaultFontFamily)
        .onChange(async (value) => {
          this.plugin.settings.defaultFontFamily = value.trim() || DEFAULT_SETTINGS.defaultFontFamily;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('默认字号')
      .setDesc('新建文本节点的字号。')
      .addText((text) => text
        .setValue(String(this.plugin.settings.defaultFontSize))
        .onChange(async (value) => {
          const parsed = Number(value);
          if (!Number.isFinite(parsed)) return;
          this.plugin.settings.defaultFontSize = Math.min(96, Math.max(8, Math.round(parsed)));
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('思维导图方向')
      .setDesc('自动布局的主方向。')
      .addDropdown((dropdown) => dropdown
        .addOptions({ right: '向右', left: '向左', down: '向下', up: '向上' })
        .setValue(this.plugin.settings.layoutDirection)
        .onChange(async (value) => {
          this.plugin.settings.layoutDirection = value as LayoutDirection;
          await this.plugin.saveSettings();
        }));
  }
}
