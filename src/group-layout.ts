import type { CanvasDocument, CanvasNodeData } from './types';

export interface GroupFitOptions {
  padding?: number;
  header?: number;
  minWidth?: number;
  minHeight?: number;
}

function isInside(group: CanvasNodeData, node: CanvasNodeData): boolean {
  return node.x >= group.x
    && node.y >= group.y
    && node.x + node.width <= group.x + group.width
    && node.y + node.height <= group.y + group.height;
}

export function fitGroupsToChildren(
  data: CanvasDocument,
  groupIds: ReadonlySet<string>,
  options: GroupFitOptions = {}
): CanvasDocument {
  const padding = options.padding ?? 32;
  const header = options.header ?? 40;
  const minWidth = options.minWidth ?? 240;
  const minHeight = options.minHeight ?? 120;
  if (groupIds.size === 0) return data;

  const nodes = data.nodes.map((node) => {
    if (node.type !== 'group' || !groupIds.has(node.id)) return node;
    const children = data.nodes.filter((candidate) => candidate.type !== 'group'
      && candidate.id !== node.id
      && isInside(node, candidate));
    if (children.length === 0) return node;

    const minX = Math.min(...children.map((child) => child.x));
    const minY = Math.min(...children.map((child) => child.y));
    const maxX = Math.max(...children.map((child) => child.x + child.width));
    const maxY = Math.max(...children.map((child) => child.y + child.height));
    return {
      ...node,
      x: minX - padding,
      y: minY - header,
      width: Math.max(minWidth, maxX - minX + padding * 2),
      height: Math.max(minHeight, maxY - minY + header + padding)
    };
  });
  return { ...data, nodes };
}
