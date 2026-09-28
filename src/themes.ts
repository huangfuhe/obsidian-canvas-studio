import type { CanvasDocument, CanvasNodeData, CanvasStyleAttributes } from './types';

export interface CanvasTheme {
  id: string;
  name: string;
  canvasClass: string;
  colors: {
    primary: string;
    secondary: string;
    decision: string;
    warning: string;
    neutral: string;
  };
  nodeStyle: CanvasStyleAttributes;
  edgeStyle: CanvasStyleAttributes;
}

export const CANVAS_THEMES: CanvasTheme[] = [
  {
    id: 'clear-work',
    name: '清晰工作',
    canvasClass: 'canvas-studio-theme-clear-work',
    colors: { primary: '4', secondary: '5', decision: '3', warning: '1', neutral: '2' },
    nodeStyle: { border: 'solid', fontFamily: 'sans-serif', lineHeight: 1.4 },
    edgeStyle: { path: 'solid', arrow: 'triangle', pathfindingMethod: 'square' }
  },
  {
    id: 'technical-map',
    name: '技术架构',
    canvasClass: 'canvas-studio-theme-technical-map',
    colors: { primary: '5', secondary: '6', decision: '3', warning: '1', neutral: '4' },
    nodeStyle: { border: 'solid', fontFamily: 'var(--font-interface)', lineHeight: 1.35 },
    edgeStyle: { path: 'solid', arrow: 'thin-triangle', pathfindingMethod: 'square' }
  },
  {
    id: 'review-board',
    name: '评审看板',
    canvasClass: 'canvas-studio-theme-review-board',
    colors: { primary: '6', secondary: '4', decision: '3', warning: '1', neutral: '5' },
    nodeStyle: { border: 'dashed', fontFamily: 'sans-serif', lineHeight: 1.5 },
    edgeStyle: { path: 'long-dashed', arrow: 'triangle-outline', pathfindingMethod: 'square' }
  }
];

function semanticColor(node: CanvasNodeData, theme: CanvasTheme): string {
  if (node.type === 'group' && node.color) return node.color;
  const shape = node.styleAttributes?.shape;
  if (shape === 'diamond') return theme.colors.decision;
  if (shape === 'document') return theme.colors.warning;
  if (shape === 'pill' || shape === 'circle') return theme.colors.primary;
  if (shape === 'parallelogram' || shape === 'database') return theme.colors.secondary;
  return theme.colors.neutral;
}

export function applyCanvasTheme(
  data: CanvasDocument,
  theme: CanvasTheme,
  nodeIds?: ReadonlySet<string>
): CanvasDocument {
  const nodes = data.nodes.map((node) => {
    if (nodeIds && !nodeIds.has(node.id)) return node;
    return {
      ...node,
      color: semanticColor(node, theme),
      styleAttributes: { ...(node.styleAttributes ?? {}), ...theme.nodeStyle }
    };
  });
  const themedNodeIds = nodeIds ?? new Set(nodes.map((node) => node.id));
  const edges = data.edges.map((edge) => {
    if (!themedNodeIds.has(edge.fromNode) || !themedNodeIds.has(edge.toNode)) return edge;
    return { ...edge, styleAttributes: { ...(edge.styleAttributes ?? {}), ...theme.edgeStyle } };
  });
  const result: CanvasDocument = {
    ...data,
    nodes,
    edges
  };
  if (nodeIds) return result;
  return {
    ...result,
    metadata: {
      ...((data.metadata as Record<string, unknown> | undefined) ?? {}),
      canvasStudio: {
        ...(((data.metadata as Record<string, unknown> | undefined)?.canvasStudio as Record<string, unknown> | undefined) ?? {}),
        theme: theme.id,
        cssclass: theme.canvasClass
      }
    }
  };
}
