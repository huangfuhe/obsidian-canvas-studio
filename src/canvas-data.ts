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

export function mergeEdgePresentation(
  edge: CanvasEdgeData,
  patch: CanvasStyleAttributes
): CanvasEdgeData {
  const fromEnd = patch.fromEnd;
  const toEnd = patch.toEnd;
  const stylePatch = { ...patch };
  delete stylePatch.fromEnd;
  delete stylePatch.toEnd;
  const next = mergeEdgeStyle(edge, stylePatch);
  if (fromEnd === null) delete next.fromEnd;
  else if (fromEnd !== undefined) next.fromEnd = fromEnd as CanvasEdgeData['fromEnd'];
  if (toEnd === null) delete next.toEnd;
  else if (toEnd !== undefined) next.toEnd = toEnd as CanvasEdgeData['toEnd'];
  return next;
}

export type EdgeArrowSelection = 'arrow' | 'none' | 'diamond' | 'circle';

export function edgeArrowSelection(edge: CanvasEdgeData): EdgeArrowSelection {
  const custom = edge.styleAttributes?.arrow;
  if (custom === 'diamond' || custom === 'circle') return custom;
  return edge.toEnd === 'none' ? 'none' : 'arrow';
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

export function alignCanvasEdges(
  data: CanvasDocument,
  edgeIds?: ReadonlySet<string>
): CanvasDocument {
  const nodes = new Map(data.nodes.map((node) => [node.id, node]));
  const edges = data.edges.map((edge) => {
    if (edgeIds && !edgeIds.has(edge.id)) return edge;
    const from = nodes.get(edge.fromNode);
    const to = nodes.get(edge.toNode);
    if (!from || !to) return edge;
    const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
    const horizontal = Math.abs(toCenter.x - fromCenter.x) >= Math.abs(toCenter.y - fromCenter.y);
    const forward = horizontal ? toCenter.x >= fromCenter.x : toCenter.y >= fromCenter.y;
    const fromSide: CanvasEdgeData['fromSide'] = horizontal ? (forward ? 'right' : 'left') : (forward ? 'bottom' : 'top');
    const toSide: CanvasEdgeData['toSide'] = horizontal ? (forward ? 'left' : 'right') : (forward ? 'top' : 'bottom');
    return {
      ...edge,
      fromSide,
      toSide,
      styleAttributes: {
        ...(edge.styleAttributes ?? {}),
        pathfindingMethod: 'square'
      }
    };
  });
  return { ...data, edges };
}
