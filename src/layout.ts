import type {
  CanvasDocument,
  CanvasNodeData,
  LayoutDiagnostic,
  LayoutDirection,
  LayoutOptions,
  LayoutResult
} from './types';

const DEFAULT_GAP_X = 96;
const DEFAULT_GAP_Y = 32;

function pickRoot(data: CanvasDocument, requestedRootId?: string): string | null {
  if (requestedRootId && data.nodes.some((node) => node.id === requestedRootId)) return requestedRootId;
  const incoming = new Set(data.edges.map((edge) => edge.toNode));
  return data.nodes.find((node) => !incoming.has(node.id))?.id ?? data.nodes[0]?.id ?? null;
}

function childrenMap(data: CanvasDocument): Map<string, string[]> {
  const nodeIds = new Set(data.nodes.map((node) => node.id));
  const map = new Map<string, string[]>();
  for (const node of data.nodes) map.set(node.id, []);
  for (const edge of data.edges) {
    if (!nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode)) continue;
    map.get(edge.fromNode)?.push(edge.toNode);
  }
  return map;
}

function diagnosticsFor(data: CanvasDocument, rootId: string | null, children: Map<string, string[]>): LayoutDiagnostic[] {
  const diagnostics: LayoutDiagnostic[] = [];
  const parentMap = new Map<string, string[]>();
  for (const edge of data.edges) {
    if (!parentMap.has(edge.toNode)) parentMap.set(edge.toNode, []);
    parentMap.get(edge.toNode)?.push(edge.fromNode);
  }
  for (const [nodeId, parents] of parentMap) {
    if (parents.length > 1) diagnostics.push({
      kind: 'multiple-parent',
      nodeIds: [nodeId, ...parents],
      message: `Node ${nodeId} has multiple parents`
    });
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      diagnostics.push({ kind: 'cycle', nodeIds: [nodeId], message: `Cycle detected at ${nodeId}` });
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);
    for (const childId of children.get(nodeId) ?? []) walk(childId);
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  if (rootId) walk(rootId);

  const reachable = new Set(visited);
  for (const node of data.nodes) {
    if (!reachable.has(node.id)) diagnostics.push({
      kind: 'disconnected',
      nodeIds: [node.id],
      message: `Node ${node.id} is outside the selected tree`
    });
  }
  return diagnostics;
}

export function computeMindMapLayout(
  data: CanvasDocument,
  options: LayoutOptions = {}
): LayoutResult {
  const direction = options.direction ?? 'right';
  const gapX = options.gapX ?? DEFAULT_GAP_X;
  const gapY = options.gapY ?? DEFAULT_GAP_Y;
  const rootId = pickRoot(data, options.rootId);
  const children = childrenMap(data);
  const diagnostics = diagnosticsFor(data, rootId, children);
  const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));
  const positions = new Map<string, { x: number; y: number }>();
  const measuring = new Set<string>();
  const horizontal = direction === 'right' || direction === 'left';
  const mainGap = horizontal ? gapX : gapY;
  const crossGap = horizontal ? gapY : gapX;
  const mainSize = (node: CanvasNodeData) => horizontal ? node.width : node.height;
  const crossSize = (node: CanvasNodeData) => horizontal ? node.height : node.width;

  const subtreeCrossSize = (nodeId: string): number => {
    const node = nodeMap.get(nodeId);
    if (!node) return 0;
    if (measuring.has(nodeId)) return crossSize(node);
    measuring.add(nodeId);
    const childSizes = (children.get(nodeId) ?? [])
      .filter((childId) => !measuring.has(childId))
      .map(subtreeCrossSize);
    measuring.delete(nodeId);
    if (childSizes.length === 0) return crossSize(node);
    return Math.max(
      crossSize(node),
      childSizes.reduce((sum, size) => sum + size, 0) + crossGap * (childSizes.length - 1)
    );
  };

  const toPosition = (node: CanvasNodeData, main: number, cross: number): { x: number; y: number } => {
    switch (direction) {
      case 'left': return { x: -main - node.width, y: cross };
      case 'down': return { x: cross, y: main };
      case 'up': return { x: cross, y: -main - node.height };
      default: return { x: main, y: cross };
    }
  };

  const place = (nodeId: string, main: number, crossStart: number): void => {
    const node = nodeMap.get(nodeId);
    if (!node || positions.has(nodeId)) return;
    const childrenIds = (children.get(nodeId) ?? []).filter((childId) => nodeMap.has(childId) && !positions.has(childId));
    const span = subtreeCrossSize(nodeId);
    const childrenSpan = childrenIds.length === 0
      ? 0
      : childrenIds.reduce((sum, childId) => sum + subtreeCrossSize(childId), 0) + crossGap * (childrenIds.length - 1);
    const nodeCross = crossStart + (span - crossSize(node)) / 2;
    positions.set(nodeId, toPosition(node, main, nodeCross));
    let childCross = crossStart + (span - childrenSpan) / 2;
    for (const childId of childrenIds) {
      place(childId, main + mainSize(node) + mainGap, childCross);
      childCross += subtreeCrossSize(childId) + crossGap;
    }
  };

  if (rootId) {
    place(rootId, 0, 0);
    const root = nodeMap.get(rootId);
    const rootPosition = positions.get(rootId);
    if (root && rootPosition) {
      const deltaX = root.x - rootPosition.x;
      const deltaY = root.y - rootPosition.y;
      for (const [nodeId, position] of positions) {
        positions.set(nodeId, { x: position.x + deltaX, y: position.y + deltaY });
      }
    }
  }
  return { positions, rootId, diagnostics };
}

export function moveNodesToLayout(
  data: CanvasDocument,
  layout: LayoutResult
): CanvasDocument {
  return {
    ...data,
    nodes: data.nodes.map((node: CanvasNodeData) => {
      const position = layout.positions.get(node.id);
      return position ? { ...node, ...position } : node;
    })
  };
}
