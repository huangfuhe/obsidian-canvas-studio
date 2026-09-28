import type { CanvasDocument, CanvasNodeData } from './types';

function inside(group: CanvasNodeData, node: CanvasNodeData): boolean {
  const padding = 16;
  return node.x >= group.x + padding
    && node.y >= group.y + padding
    && node.x + node.width <= group.x + group.width - padding
    && node.y + node.height <= group.y + group.height - padding;
}

export function moveGroupChildren(
  data: CanvasDocument,
  groupId: string,
  previousPosition: { x: number; y: number },
  nextPosition: { x: number; y: number }
): CanvasDocument {
  const group = data.nodes.find((node) => node.id === groupId && node.type === 'group');
  if (!group) return data;
  const dx = nextPosition.x - previousPosition.x;
  const dy = nextPosition.y - previousPosition.y;
  if (dx === 0 && dy === 0) return data;
  const previousGroup = { ...group, x: previousPosition.x, y: previousPosition.y };
  const childIds = new Set(data.nodes
    .filter((node) => node.id !== groupId && node.type !== 'group' && inside(previousGroup, node))
    .map((node) => node.id));
  return {
    ...data,
    nodes: data.nodes.map((node) => childIds.has(node.id) ? { ...node, x: node.x + dx, y: node.y + dy } : node)
  };
}
