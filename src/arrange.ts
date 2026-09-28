import type { CanvasDocument, CanvasNodeData } from './types';

export type ArrangeMode =
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-top'
  | 'align-middle'
  | 'align-bottom'
  | 'distribute-horizontal'
  | 'distribute-vertical';

function updateSelected(
  data: CanvasDocument,
  selected: ReadonlyMap<string, CanvasNodeData>
): CanvasDocument {
  return {
    ...data,
    nodes: data.nodes.map((node) => selected.get(node.id) ?? node)
  };
}

export function arrangeNodes(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  mode: ArrangeMode
): CanvasDocument {
  const nodes = data.nodes.filter((node) => nodeIds.has(node.id));
  if (nodes.length < 2) return data;

  const updated = new Map(nodes.map((node) => [node.id, { ...node }]));
  const minX = Math.min(...nodes.map((node) => node.x));
  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  for (const node of updated.values()) {
    switch (mode) {
      case 'align-left': node.x = minX; break;
      case 'align-center': node.x = centerX - node.width / 2; break;
      case 'align-right': node.x = maxX - node.width; break;
      case 'align-top': node.y = minY; break;
      case 'align-middle': node.y = centerY - node.height / 2; break;
      case 'align-bottom': node.y = maxY - node.height; break;
    }
  }

  if (mode === 'distribute-horizontal' && nodes.length > 2) {
    const sorted = [...nodes].sort((a, b) => a.x - b.x);
    const totalWidth = sorted.reduce((sum, node) => sum + node.width, 0);
    const gap = (maxX - minX - totalWidth) / (sorted.length - 1);
    let x = minX;
    for (const source of sorted) {
      const node = updated.get(source.id);
      if (node) node.x = x;
      x += source.width + gap;
    }
  }

  if (mode === 'distribute-vertical' && nodes.length > 2) {
    const sorted = [...nodes].sort((a, b) => a.y - b.y);
    const totalHeight = sorted.reduce((sum, node) => sum + node.height, 0);
    const gap = (maxY - minY - totalHeight) / (sorted.length - 1);
    let y = minY;
    for (const source of sorted) {
      const node = updated.get(source.id);
      if (node) node.y = y;
      y += source.height + gap;
    }
  }

  return updateSelected(data, updated);
}
