import type { CanvasDocument, CanvasEdgeData, CanvasNodeData, CanvasStyleAttributes } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNode(value: unknown): value is CanvasNodeData {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.type === 'string'
    && typeof value.x === 'number'
    && typeof value.y === 'number'
    && typeof value.width === 'number'
    && typeof value.height === 'number';
}

export function parseCanvasDocument(input: string): CanvasDocument {
  const parsed: unknown = JSON.parse(input);
  if (!isRecord(parsed)) throw new Error('Canvas data must be a JSON object');

  const nodes = parsed.nodes ?? [];
  const edges = parsed.edges ?? [];
  if (!Array.isArray(nodes) || !nodes.every(isNode)) throw new Error('Canvas nodes are invalid');
  if (!Array.isArray(edges)) throw new Error('Canvas edges are invalid');

  return {
    ...parsed,
    nodes: nodes as CanvasNodeData[],
    edges: edges as CanvasDocument['edges']
  };
}

export function serializeCanvasDocument(data: CanvasDocument): string {
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function cloneCanvasDocument(data: CanvasDocument): CanvasDocument {
  return parseCanvasDocument(serializeCanvasDocument(data));
}

export function mergeNodeStyle(
  node: CanvasNodeData,
  patch: CanvasStyleAttributes
): CanvasNodeData {
  const styleAttributes = { ...(node.styleAttributes ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) delete styleAttributes[key];
    else styleAttributes[key] = value;
  }

  return {
    ...node,
    ...(Object.keys(styleAttributes).length > 0 ? { styleAttributes } : { styleAttributes: undefined })
  };
}

export function mergeEdgeStyle(
  edge: CanvasEdgeData,
  patch: CanvasStyleAttributes
): CanvasEdgeData {
  const styleAttributes = { ...(edge.styleAttributes ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined) delete styleAttributes[key];
    else styleAttributes[key] = value;
  }

  return {
    ...edge,
    ...(Object.keys(styleAttributes).length > 0 ? { styleAttributes } : { styleAttributes: undefined })
  };
}

export function updateNodes(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  update: (node: CanvasNodeData) => CanvasNodeData
): CanvasDocument {
  return {
    ...data,
    nodes: data.nodes.map((node) => nodeIds.has(node.id) ? update(node) : node)
  };
}

export function safeInsertionOrigin(
  data: CanvasDocument,
  centered = false
): { x: number; y: number } {
  const maxX = Math.max(0, ...data.nodes.map((node) => node.x + node.width));
  const minY = Math.min(0, ...data.nodes.map((node) => node.y));
  return { x: maxX + (centered ? 420 : 160), y: minY };
}
