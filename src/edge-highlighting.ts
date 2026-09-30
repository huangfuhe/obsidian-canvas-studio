import type { CanvasEdgeData } from './types';

export function associatedEdgeIds(edges: CanvasEdgeData[], nodeIds: Iterable<string>): Set<string> {
  const selected = new Set(nodeIds);
  if (selected.size === 0) return new Set();
  return new Set(edges
    .filter((edge) => selected.has(edge.fromNode) || selected.has(edge.toNode))
    .map((edge) => edge.id));
}
