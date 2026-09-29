import type { CanvasDocument, CanvasNodeData } from './types';

export interface CreateGroupOptions {
  id: string;
  label?: string;
  padding?: number;
  header?: number;
  minWidth?: number;
  minHeight?: number;
}

export function groupNodes(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  options: CreateGroupOptions
): CanvasDocument {
  const selected = data.nodes.filter((node) => nodeIds.has(node.id) && node.type !== 'group');
  if (selected.length === 0 || data.nodes.some((node) => node.id === options.id)) return data;

  const padding = options.padding ?? 32;
  const header = options.header ?? 40;
  const minWidth = options.minWidth ?? 240;
  const minHeight = options.minHeight ?? 120;
  const minX = Math.min(...selected.map((node) => node.x));
  const minY = Math.min(...selected.map((node) => node.y));
  const maxX = Math.max(...selected.map((node) => node.x + node.width));
  const maxY = Math.max(...selected.map((node) => node.y + node.height));
  const group: CanvasNodeData = {
    id: options.id,
    type: 'group',
    x: minX - padding,
    y: minY - header,
    width: Math.max(minWidth, maxX - minX + padding * 2),
    height: Math.max(minHeight, maxY - minY + header + padding),
    ...(options.label ? { label: options.label } : {}),
    styleAttributes: { border: 'solid' }
  };
  const firstSelectedIndex = data.nodes.findIndex((node) => nodeIds.has(node.id));
  const nodes = [...data.nodes];
  nodes.splice(Math.max(0, firstSelectedIndex), 0, group);
  return { ...data, nodes };
}

export function ungroupNodes(data: CanvasDocument, groupIds: ReadonlySet<string>): CanvasDocument {
  if (groupIds.size === 0) return data;
  const nodes = data.nodes.filter((node) => !(node.type === 'group' && groupIds.has(node.id)));
  return nodes.length === data.nodes.length ? data : { ...data, nodes };
}

export function updateGroupProperties(
  data: CanvasDocument,
  groupIds: ReadonlySet<string>,
  patch: Pick<CanvasNodeData, 'label' | 'color' | 'locked'>
): CanvasDocument {
  return {
    ...data,
    nodes: data.nodes.map((node) => node.type === 'group' && groupIds.has(node.id)
      ? { ...node, ...patch }
      : node)
  };
}
