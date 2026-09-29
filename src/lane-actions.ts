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

export function removeGroupContainer(data: CanvasDocument, groupId: string): CanvasDocument {
  const exists = data.nodes.some((node) => node.type === 'group' && node.id === groupId);
  if (!exists) return data;
  return { ...data, nodes: data.nodes.filter((node) => node.id !== groupId) };
}

export function moveGroupLane(
  data: CanvasDocument,
  groupId: string,
  direction: 'left' | 'right'
): CanvasDocument {
  const group = data.nodes.find((node) => node.type === 'group' && node.id === groupId);
  if (!group) return data;
  const groups = data.nodes.filter((node) => node.type === 'group' && node.id !== groupId);
  const sameRow = groups.filter((candidate) => {
    const groupCenter = group.y + group.height / 2;
    const candidateCenter = candidate.y + candidate.height / 2;
    return Math.abs(candidateCenter - groupCenter) <= Math.max(group.height, candidate.height) / 2;
  });
  const target = direction === 'left'
    ? sameRow.filter((candidate) => candidate.x < group.x).sort((a, b) => b.x - a.x)[0]
    : sameRow.filter((candidate) => candidate.x > group.x).sort((a, b) => a.x - b.x)[0];
  if (!target) return data;

  const childIds = new Set(data.nodes.filter((node) => node.type !== 'group' && contains(group, node)).map((node) => node.id));
  const targetChildIds = new Set(data.nodes.filter((node) => node.type !== 'group' && contains(target, node)).map((node) => node.id));
  const groupDelta = { x: target.x - group.x, y: target.y - group.y };
  const targetDelta = { x: group.x - target.x, y: group.y - target.y };
  return {
    ...data,
    nodes: data.nodes.map((node) => {
      if (node.id === group.id) return { ...node, x: target.x, y: target.y };
      if (node.id === target.id) return { ...node, x: group.x, y: group.y };
      if (childIds.has(node.id)) return { ...node, x: node.x + groupDelta.x, y: node.y + groupDelta.y };
      if (targetChildIds.has(node.id)) return { ...node, x: node.x + targetDelta.x, y: node.y + targetDelta.y };
      return node;
    })
  };
}
