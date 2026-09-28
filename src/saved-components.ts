import type { CanvasDocument, CanvasEdgeData, CanvasNodeData } from './types';

export interface SavedCanvasComponent {
  id: string;
  name: string;
  nodes: CanvasNodeData[];
  edges: CanvasEdgeData[];
}

export function createSavedComponent(data: CanvasDocument, nodeIds: ReadonlySet<string>, id: string, name: string): SavedCanvasComponent {
  const selected = data.nodes.filter((node) => nodeIds.has(node.id));
  if (selected.length === 0) throw new Error('至少选择一个节点');
  const minX = Math.min(...selected.map((node) => node.x));
  const minY = Math.min(...selected.map((node) => node.y));
  const nodes = selected.map((node) => ({ ...node, x: node.x - minX, y: node.y - minY }));
  const selectedIds = new Set(selected.map((node) => node.id));
  const edges = data.edges.filter((edge) => selectedIds.has(edge.fromNode) && selectedIds.has(edge.toNode));
  return { id, name, nodes, edges };
}

export function instantiateSavedComponent(component: SavedCanvasComponent, origin: { x: number; y: number }, idFactory: (prefix: string) => string): CanvasDocument {
  const idMap = new Map<string, string>();
  const nodes = component.nodes.map((node) => {
    const id = idFactory(node.type === 'group' ? 'group' : 'node');
    idMap.set(node.id, id);
    return { ...node, id, x: node.x + origin.x, y: node.y + origin.y };
  });
  const edges = component.edges.map((edge) => ({
    ...edge,
    id: idFactory('edge'),
    fromNode: idMap.get(edge.fromNode) ?? edge.fromNode,
    toNode: idMap.get(edge.toNode) ?? edge.toNode
  }));
  return { nodes, edges };
}
