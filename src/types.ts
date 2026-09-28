export type CanvasNodeType = 'text' | 'file' | 'link' | 'group';
export type LayoutDirection = 'right' | 'left' | 'down' | 'up';

export interface CanvasStyleAttributes {
  [key: string]: string | number | boolean | null | undefined;
}

export interface CanvasNodeData {
  id: string;
  type: CanvasNodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  locked?: boolean;
  text?: string;
  file?: string;
  url?: string;
  subpath?: string;
  label?: string;
  background?: string;
  backgroundStyle?: 'cover' | 'ratio' | 'repeat';
  styleAttributes?: CanvasStyleAttributes;
  [key: string]: unknown;
}

export interface CanvasEdgeData {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  fromEnd?: 'none' | 'arrow';
  toEnd?: 'none' | 'arrow';
  color?: string;
  label?: string;
  styleAttributes?: CanvasStyleAttributes;
  [key: string]: unknown;
}

export interface CanvasDocument {
  nodes: CanvasNodeData[];
  edges: CanvasEdgeData[];
  [key: string]: unknown;
}

export interface LayoutOptions {
  direction?: LayoutDirection;
  gapX?: number;
  gapY?: number;
  rootId?: string;
}

export interface LayoutDiagnostic {
  kind: 'cycle' | 'multiple-parent' | 'disconnected';
  nodeIds: string[];
  message: string;
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>;
  rootId: string | null;
  diagnostics: LayoutDiagnostic[];
}
