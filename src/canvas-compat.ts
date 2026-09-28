import { App, TextFileView } from 'obsidian';
import type { CanvasDocument, CanvasEdgeData, CanvasNodeData } from './types';

interface PendingHistoryCommit {
  baseIndex: number;
  previous: CanvasDocument;
  timers: number[];
}

const pendingHistoryCommits = new WeakMap<object, PendingHistoryCommit>();

export interface RuntimeCanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isEditing?: boolean;
  nodeEl?: HTMLElement;
  child?: {
    editMode?: {
      cm?: {
        state?: {
          doc?: { toString(): string };
          selection?: { main?: { from: number; to: number } };
        };
      };
    };
  };
  getData(): CanvasNodeData;
  setData(data: CanvasNodeData, addHistory?: boolean): void;
  startEditing?(): void;
}

interface RuntimeCanvasElement {
  id: string;
  getData(): CanvasNodeData | CanvasEdgeData;
}

export interface RuntimeCanvas {
  wrapperEl?: HTMLElement;
  canvasEl?: HTMLElement;
  readonly?: boolean;
  metadata?: Record<string, unknown>;
  data?: CanvasDocument;
  nodes: Map<string, RuntimeCanvasNode>;
  selection: Set<RuntimeCanvasElement>;
  getData(): CanvasDocument;
  getSelectionData?(): { nodes: CanvasNodeData[]; edges: CanvasEdgeData[] };
  createTextNode?(options: Record<string, unknown>): RuntimeCanvasNode;
  importData?(data: CanvasDocument, clearCanvas?: boolean, silent?: boolean): void;
  history?: {
    data: CanvasDocument[];
    current: number;
  };
  pushHistory?(data: CanvasDocument): void;
  requestSave?(): void;
  requestFrame?(): void;
  selectOnly?(node: RuntimeCanvasNode): void;
  deselectAll?(): void;
  zoomToSelection?(): void;
}

export function getCurrentCanvas(app: App): RuntimeCanvas | null {
  const view = app.workspace.getActiveViewOfType(TextFileView);
  if (!view || view.getViewType() !== 'canvas') return null;
  return (view as unknown as { canvas?: RuntimeCanvas }).canvas ?? null;
}

export function hasAdvancedCanvas(app: App): boolean {
  return Boolean((app as unknown as { plugins?: { plugins?: Record<string, unknown> } }).plugins?.plugins?.['advanced-canvas']);
}

export function selectedNodeData(canvas: RuntimeCanvas): CanvasNodeData[] {
  if (canvas.getSelectionData) return canvas.getSelectionData().nodes;
  return [...canvas.selection]
    .map((element) => element.getData())
    .filter((data): data is CanvasNodeData => 'type' in data && 'x' in data && 'y' in data);
}

export function selectedEdgeData(canvas: RuntimeCanvas): CanvasEdgeData[] {
  const selected = canvas.getSelectionData?.().edges ?? [];
  if (selected.length > 0) return selected;
  return [...canvas.selection]
    .map((element) => element.getData())
    .filter((data): data is CanvasEdgeData => 'fromNode' in data && 'toNode' in data);
}

export function selectedRuntimeNodes(canvas: RuntimeCanvas): RuntimeCanvasNode[] {
  return [...canvas.selection]
    .filter((element): element is RuntimeCanvasNode => 'x' in element && 'y' in element);
}

export function replaceCanvasData(canvas: RuntimeCanvas, data: CanvasDocument): void {
  const history = canvas.history;
  let pending = pendingHistoryCommits.get(canvas);
  if (!pending && history) {
    pending = {
      baseIndex: history.current,
      previous: canvas.getData(),
      timers: []
    };
    pendingHistoryCommits.set(canvas, pending);
  }
  if (canvas.importData) canvas.importData(data, true, true);
  else throw new Error('This Obsidian version does not expose Canvas.importData');
  if (data.metadata && typeof data.metadata === 'object') {
    const metadata = data.metadata as Record<string, unknown>;
    canvas.metadata = metadata;
    if (canvas.data) canvas.data = { ...canvas.data, metadata };
  }
  canvas.requestFrame?.();

  if (pending && history) {
    for (const timer of pending.timers) window.clearTimeout(timer);
    const commit = (final: boolean) => {
      const finalData = canvas.getData();
      if (pending.baseIndex >= 0) {
        history.data.length = pending.baseIndex + 1;
        history.current = pending.baseIndex;
        history.data[pending.baseIndex] = pending.previous;
      } else {
        history.data.length = 0;
        history.current = -1;
        canvas.pushHistory?.(pending.previous);
      }
      canvas.pushHistory?.(finalData);
      while (history.current > 0
        && JSON.stringify(history.data[history.current]) === JSON.stringify(history.data[history.current - 1])) {
        history.data.splice(history.current, 1);
        history.current -= 1;
      }
      if (final) pendingHistoryCommits.delete(canvas);
    };
    pending.timers = [
      window.setTimeout(() => commit(false), 50),
      window.setTimeout(() => commit(true), 500)
    ];
  } else {
    canvas.pushHistory?.(data);
  }
  canvas.requestSave?.();
}

export function randomId(prefix = 'cs'): string {
  const random = Math.random().toString(16).slice(2, 14);
  return `${prefix}-${Date.now().toString(16)}-${random}`;
}
