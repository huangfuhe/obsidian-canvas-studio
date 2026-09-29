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

export function arrangeLanes(
  data: CanvasDocument,
  groupIds: ReadonlySet<string>,
  direction: 'horizontal' | 'vertical',
  gap = 40
): CanvasDocument {
  const groups = data.nodes.filter((node) => node.type === 'group' && groupIds.has(node.id));
  if (groups.length < 2) return data;
  const ordered = [...groups].sort((left, right) => direction === 'horizontal' ? left.x - right.x : left.y - right.y);
  const equalHeight = Math.max(...ordered.map((group) => group.height));
  const equalWidth = Math.max(...ordered.map((group) => group.width));
  const originX = Math.min(...ordered.map((group) => group.x));
  const originY = Math.min(...ordered.map((group) => group.y));
  const placements = new Map<string, { x: number; y: number; width: number; height: number }>();
  let cursor = direction === 'horizontal' ? originX : originY;
  for (const group of ordered) {
    const width = direction === 'horizontal' ? group.width : equalWidth;
    const height = direction === 'horizontal' ? equalHeight : group.height;
    placements.set(group.id, {
      x: direction === 'horizontal' ? cursor : originX,
      y: direction === 'horizontal' ? originY : cursor,
      width,
      height
    });
    cursor += (direction === 'horizontal' ? width : height) + gap;
  }

  const childMoves = new Map<string, { dx: number; dy: number }>();
  for (const group of ordered) {
    const placement = placements.get(group.id)!;
    const dx = placement.x - group.x;
    const dy = placement.y - group.y;
    for (const child of data.nodes.filter((node) => node.type !== 'group' && contains(group, node))) {
      childMoves.set(child.id, { dx, dy });
    }
  }
  return {
    ...data,
    nodes: data.nodes.map((node) => {
      const placement = placements.get(node.id);
      if (placement) return { ...node, ...placement };
      const move = childMoves.get(node.id);
      return move ? { ...node, x: node.x + move.dx, y: node.y + move.dy } : node;
    })
  };
}
