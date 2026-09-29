import type { CanvasEdgeData, CanvasNodeData } from './types';

export type SelectionContextKind = 'canvas' | 'nodes' | 'edges' | 'mixed';

export interface SelectionContext {
  kind: SelectionContextKind;
  label: string;
  count: number;
}

export function describeSelectionContext(nodes: CanvasNodeData[], edges: CanvasEdgeData[]): SelectionContext {
  if (nodes.length > 0 && edges.length > 0) return { kind: 'mixed', label: '混合选区', count: nodes.length + edges.length };
  if (edges.length > 0) return { kind: 'edges', label: '连线', count: edges.length };
  if (nodes.length > 0) return { kind: 'nodes', label: nodes.length === 1 ? '单个节点' : '多个节点', count: nodes.length };
  return { kind: 'canvas', label: '整张画布', count: 0 };
}

const NODE_ONLY_ACTIONS = new Set(['create-child', 'create-sibling', 'layout', 'shape', 'style', 'copy-style', 'paste-style']);
const EDGE_ONLY_ACTIONS = new Set(['edge']);
const EDITING_ACTIONS = new Set(['arrange', 'shape', 'style', 'copy-style', 'paste-style', 'edge', 'create-child', 'create-sibling', 'layout']);

export function isContextualActionHidden(actionId: string, kind: SelectionContextKind): boolean {
  if (kind === 'canvas') return EDITING_ACTIONS.has(actionId);
  if (kind === 'nodes') return EDGE_ONLY_ACTIONS.has(actionId);
  if (kind === 'edges') return NODE_ONLY_ACTIONS.has(actionId) || actionId === 'arrange';
  return EDITING_ACTIONS.has(actionId);
}
