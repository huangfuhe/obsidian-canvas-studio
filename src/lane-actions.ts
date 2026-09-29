import type { CanvasDocument, CanvasNodeData } from './types';

export type LaneDuplicateDirection = 'right' | 'down';

function contains(group: CanvasNodeData, node: CanvasNodeData): boolean {
  const padding = 16;
  return node.x >= group.x + padding
    && node.y >= group.y + padding
    && node.x + node.width <= group.x + group.width - padding
    && node.y + node.height <= group.y + group.height - padding;
}

export function duplicateGroupAsLane(
  data: CanvasDocument,
  groupId: string,
  direction: LaneDuplicateDirection,
  idFactory: (prefix: string) => string,
  gap = 40
): CanvasDocument {
  const group = data.nodes.find((node) => node.id === groupId && node.type === 'group');
  if (!group) return data;
  const children = data.nodes.filter((node) => node.type !== 'group' && contains(group, node));
  const childIds = new Set(children.map((node) => node.id));
  const idMap = new Map<string, string>([[group.id, idFactory('group')]]);
  for (const child of children) idMap.set(child.id, idFactory(child.type === 'file' ? 'file' : 'node'));
  const dx = direction === 'right' ? group.width + gap : 0;
  const dy = direction === 'down' ? group.height + gap : 0;
  const duplicateGroup: CanvasNodeData = {
    ...group,
    id: idMap.get(group.id)!,
    x: group.x + dx,
    y: group.y + dy,
    label: `${group.label ?? '泳道'} 2`
  };
  const duplicateChildren = children.map((child) => ({
    ...child,
    id: idMap.get(child.id)!,
    x: child.x + dx,
    y: child.y + dy
  }));
  const duplicateEdges = data.edges
    .filter((edge) => childIds.has(edge.fromNode) && childIds.has(edge.toNode))
    .map((edge) => ({
      ...edge,
      id: idFactory('edge'),
      fromNode: idMap.get(edge.fromNode)!,
      toNode: idMap.get(edge.toNode)!
    }));
  return {
    ...data,
    nodes: [...data.nodes, duplicateGroup, ...duplicateChildren],
    edges: [...data.edges, ...duplicateEdges]
  };
}
