import type { CanvasDocument } from './types';

export function duplicateSelection(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  idFactory: (prefix: string) => string,
  offset = 40
): CanvasDocument {
  const selected = data.nodes.filter((node) => nodeIds.has(node.id));
  if (selected.length === 0) return data;
  const idMap = new Map(selected.map((node) => [node.id, idFactory(node.type === 'group' ? 'group' : node.type)]));
  const nodes = selected.map((node) => ({
    ...node,
    id: idMap.get(node.id)!,
    x: node.x + offset,
    y: node.y + offset
  }));
  const edges = data.edges
    .filter((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode))
    .map((edge) => ({
      ...edge,
      id: idFactory('edge'),
      fromNode: idMap.get(edge.fromNode)!,
      toNode: idMap.get(edge.toNode)!
    }));
  return { ...data, nodes: [...data.nodes, ...nodes], edges: [...data.edges, ...edges] };
}

export function deleteSelection(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  edgeIds: ReadonlySet<string>
): CanvasDocument {
  if (nodeIds.size === 0 && edgeIds.size === 0) return data;
  return {
    ...data,
    nodes: data.nodes.filter((node) => !nodeIds.has(node.id)),
    edges: data.edges.filter((edge) => !edgeIds.has(edge.id)
      && !nodeIds.has(edge.fromNode)
      && !nodeIds.has(edge.toNode))
  };
}
