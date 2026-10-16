import type { CanvasDocument, CanvasNodeData } from './types';

/** The axis on which fitted nodes are laid out. */
export type TextFitAxis = 'horizontal' | 'vertical';

/** Optional replacement dimensions for a selected text node. */
export interface TextFitSize {
  width?: number;
  height?: number;
}

interface SizedNode {
  index: number;
  node: CanvasNodeData;
  next: CanvasNodeData;
}

function overlaps(leftStart: number, leftSize: number, rightStart: number, rightSize: number): boolean {
  return leftStart < rightStart + rightSize && rightStart < leftStart + leftSize;
}

function dimension(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * Applies measured dimensions to selected text nodes and keeps their original
 * axis gaps when a node expands, moving later nodes out of the way only when
 * necessary. Only selected text nodes can be changed; all other nodes and the
 * cross-axis coordinates are preserved.
 *
 * Existing overlaps are treated as a zero gap because a negative gap cannot be
 * preserved while also guaranteeing that the selected nodes do not overlap.
 */
export function adjustSelectedTextNodeLayout(
  data: CanvasDocument,
  selectedIds: ReadonlySet<string>,
  sizes: ReadonlyMap<string, TextFitSize>,
  axis: TextFitAxis
): CanvasDocument {
  const selected: SizedNode[] = [];
  for (let index = 0; index < data.nodes.length; index += 1) {
    const node = data.nodes[index]!;
    if (node.type !== 'text' || !selectedIds.has(node.id) || !sizes.has(node.id)) continue;
    const size = sizes.get(node.id) ?? {};
    selected.push({
      index,
      node,
      next: {
        ...node,
        width: dimension(size.width, node.width),
        height: dimension(size.height, node.height)
      }
    });
  }
  if (selected.length === 0) return data;

  const coordinate = axis === 'horizontal' ? 'x' : 'y';
  const extent = axis === 'horizontal' ? 'width' : 'height';
  // Keep independent rows/columns independent. For a vertical fit, nodes in
  // different x ranges (and vice versa) must not be chained into one long
  // sequence merely because they were selected together.
  const crossCoordinate = axis === 'horizontal' ? 'y' : 'x';
  const crossExtent = axis === 'horizontal' ? 'height' : 'width';
  const groups: SizedNode[][] = [];
  for (const item of selected) {
    const group = groups.find((candidate) => candidate.some((other) =>
      overlaps(
        other.node[crossCoordinate],
        other.node[crossExtent],
        item.node[crossCoordinate],
        item.node[crossExtent]
      )));
    if (group) group.push(item);
    else groups.push([item]);
  }

  for (const group of groups) {
    const ordered = group.sort((left, right) => {
      const byCoordinate = left.node[coordinate] - right.node[coordinate];
      return byCoordinate === 0 ? left.index - right.index : byCoordinate;
    });
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1]!;
      const current = ordered[index]!;
      const originalGap = current.node[coordinate] - (previous.node[coordinate] + previous.node[extent]);
      const gap = Math.max(0, originalGap);
      current.next[coordinate] = Math.max(
        current.node[coordinate],
        previous.next[coordinate] + previous.next[extent] + gap
      );
    }
  }

  const updates = new Map(groups.flatMap((group) => group.map(({ index, next }) => [index, next] as const)));
  return {
    ...data,
    nodes: data.nodes.map((node, index) => updates.get(index) ?? node)
  };
}
