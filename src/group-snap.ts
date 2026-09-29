import type { CanvasNodeData } from './types';

export interface GroupSnapOptions {
  padding?: number;
  threshold?: number;
}

export interface GroupSnapResult {
  node: CanvasNodeData;
  groupId?: string;
}

function containsCenter(group: CanvasNodeData, node: CanvasNodeData): boolean {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  return centerX >= group.x && centerX <= group.x + group.width
    && centerY >= group.y && centerY <= group.y + group.height;
}

export function snapNodeIntoGroup(
  moving: CanvasNodeData,
  groups: CanvasNodeData[],
  options: GroupSnapOptions = {}
): GroupSnapResult {
  const padding = options.padding ?? 16;
  const threshold = options.threshold ?? 12;
  const group = groups.find((candidate) => candidate.id !== moving.id && candidate.type === 'group' && containsCenter(candidate, moving));
  if (!group) return { node: moving };

  const minX = group.x + padding;
  const minY = group.y + padding;
  const maxX = Math.max(minX, group.x + group.width - padding - moving.width);
  const maxY = Math.max(minY, group.y + group.height - padding - moving.height);
  const x = Math.min(maxX, Math.max(minX, moving.x));
  const y = Math.min(maxY, Math.max(minY, moving.y));
  const closeToBoundary = Math.abs(x - moving.x) <= threshold || Math.abs(y - moving.y) <= threshold;
  if (!closeToBoundary && x === moving.x && y === moving.y) return { node: moving, groupId: group.id };
  return { node: { ...moving, x, y }, groupId: group.id };
}

export function snapFragmentIntoGroup(
  nodes: CanvasNodeData[],
  groups: CanvasNodeData[],
  origin: { x: number; y: number },
  options: GroupSnapOptions = {}
): { origin: { x: number; y: number }; groupId?: string } {
  const padding = options.padding ?? 16;
  const bounds = nodes.reduce((result, node) => ({
    minX: Math.min(result.minX, node.x),
    minY: Math.min(result.minY, node.y),
    maxX: Math.max(result.maxX, node.x + node.width),
    maxY: Math.max(result.maxY, node.y + node.height)
  }), { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY });
  const pointNode: CanvasNodeData = { id: '__drop__', type: 'text', x: origin.x, y: origin.y, width: 1, height: 1 };
  const group = groups.find((candidate) => candidate.type === 'group' && containsCenter(candidate, pointNode));
  if (!group || nodes.length === 0) return { origin };
  const dxMin = group.x + padding - bounds.minX;
  const dyMin = group.y + padding - bounds.minY;
  const dxMax = group.x + group.width - padding - bounds.maxX;
  const dyMax = group.y + group.height - padding - bounds.maxY;
  return {
    origin: { x: origin.x + Math.min(dxMax, Math.max(dxMin, 0)), y: origin.y + Math.min(dyMax, Math.max(dyMin, 0)) },
    groupId: group.id
  };
}
