import type { CanvasDocument } from './types';

const MIND_MAP_ROOT_KEY = 'mindMapRootId';

export interface MindMapTheme {
  id: string;
  name: string;
  rootColor: string;
  levelColors: string[];
}

export const MIND_MAP_THEMES: MindMapTheme[] = [
  { id: 'ocean', name: '海洋层级', rootColor: '5', levelColors: ['4', '3', '6', '2'] },
  { id: 'warm', name: '暖色重点', rootColor: '1', levelColors: ['3', '2', '5', '6'] },
  { id: 'technical', name: '技术蓝图', rootColor: '6', levelColors: ['5', '4', '3', '2'] }
];

function studioMetadata(data: CanvasDocument): { metadata: Record<string, unknown>; studio: Record<string, unknown> } {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return { metadata, studio };
}

export function mindMapRootId(data: CanvasDocument): string | null {
  const { studio } = studioMetadata(data);
  const rootId = studio[MIND_MAP_ROOT_KEY];
  return typeof rootId === 'string' && data.nodes.some((node) => node.id === rootId) ? rootId : null;
}

export function setMindMapRoot(data: CanvasDocument, nodeId: string | null): CanvasDocument {
  if (nodeId !== null && !data.nodes.some((node) => node.id === nodeId)) return data;
  const { metadata, studio } = studioMetadata(data);
  const nextStudio = { ...studio };
  if (nodeId === null) delete nextStudio[MIND_MAP_ROOT_KEY];
  else nextStudio[MIND_MAP_ROOT_KEY] = nodeId;
  return { ...data, metadata: { ...metadata, canvasStudio: nextStudio } };
}

export function mindMapDepths(data: CanvasDocument, rootId: string): Map<string, number> {
  if (!data.nodes.some((node) => node.id === rootId)) return new Map();
  const children = new Map<string, string[]>();
  for (const edge of data.edges) {
    const branch = children.get(edge.fromNode) ?? [];
    branch.push(edge.toNode);
    children.set(edge.fromNode, branch);
  }
  const depths = new Map<string, number>([[rootId, 0]]);
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const depth = depths.get(current) ?? 0;
    for (const child of children.get(current) ?? []) {
      if (depths.has(child)) continue;
      depths.set(child, depth + 1);
      queue.push(child);
    }
  }
  return depths;
}

export function applyMindMapTheme(data: CanvasDocument, rootId: string, theme: MindMapTheme): CanvasDocument {
  const depths = mindMapDepths(data, rootId);
  if (depths.size === 0) return data;
  const nodes = data.nodes.map((node) => {
    const depth = depths.get(node.id);
    if (depth === undefined) return node;
    return {
      ...node,
      color: depth === 0 ? theme.rootColor : theme.levelColors[(depth - 1) % theme.levelColors.length],
      styleAttributes: {
        ...(node.styleAttributes ?? {}),
        canvasStudioMindMapDepth: depth,
        fontWeight: depth === 0 ? 700 : 400
      }
    };
  });
  const edges = data.edges.map((edge) => depths.has(edge.fromNode) && depths.has(edge.toNode)
    ? { ...edge, styleAttributes: { ...(edge.styleAttributes ?? {}), pathfindingMethod: 'square' } }
    : edge);
  const { metadata, studio } = studioMetadata(data);
  return {
    ...data,
    nodes,
    edges,
    metadata: { ...metadata, canvasStudio: { ...studio, [MIND_MAP_ROOT_KEY]: rootId, mindMapTheme: theme.id } }
  };
}

const MIND_MAP_COLLAPSED_KEY = 'collapsedMindMapNodeIds';

export function collapsedMindMapNodeIds(data: CanvasDocument): Set<string> {
  const { studio } = studioMetadata(data);
  const raw = studio[MIND_MAP_COLLAPSED_KEY];
  if (!Array.isArray(raw)) return new Set();
  const nodeIds = new Set(data.nodes.map((node) => node.id));
  return new Set(raw.filter((value): value is string => typeof value === 'string' && nodeIds.has(value)));
}

export function toggleMindMapBranch(data: CanvasDocument, nodeId: string): CanvasDocument {
  if (!data.nodes.some((node) => node.id === nodeId)) return data;
  const { metadata, studio } = studioMetadata(data);
  const collapsed = collapsedMindMapNodeIds(data);
  if (collapsed.has(nodeId)) collapsed.delete(nodeId);
  else collapsed.add(nodeId);
  return { ...data, metadata: { ...metadata, canvasStudio: { ...studio, [MIND_MAP_COLLAPSED_KEY]: [...collapsed] } } };
}

export function hiddenMindMapNodeIds(data: CanvasDocument): Set<string> {
  const collapsed = collapsedMindMapNodeIds(data);
  if (collapsed.size === 0) return new Set();
  const children = new Map<string, string[]>();
  for (const edge of data.edges) children.set(edge.fromNode, [...(children.get(edge.fromNode) ?? []), edge.toNode]);
  const hidden = new Set<string>();
  const queue = [...collapsed];
  while (queue.length > 0) {
    const parent = queue.shift();
    if (!parent) continue;
    for (const child of children.get(parent) ?? []) {
      if (hidden.has(child)) continue;
      hidden.add(child);
      queue.push(child);
    }
  }
  return hidden;
}
