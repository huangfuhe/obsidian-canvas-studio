import type { CanvasDocument, CanvasStyleAttributes } from './types';

export type LayerAction = 'front' | 'back' | 'forward' | 'backward';

export function reorderNodes(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  action: LayerAction
): CanvasDocument {
  if (nodeIds.size === 0) return data;
  const selected = data.nodes.filter((node) => nodeIds.has(node.id));
  if (selected.length === 0) return data;
  if (action === 'front') return { ...data, nodes: [...data.nodes.filter((node) => !nodeIds.has(node.id)), ...selected] };
  if (action === 'back') return { ...data, nodes: [...selected, ...data.nodes.filter((node) => !nodeIds.has(node.id))] };

  const nodes = [...data.nodes];
  if (action === 'forward') {
    for (let index = nodes.length - 2; index >= 0; index -= 1) {
      const current = nodes[index];
      const next = nodes[index + 1];
      if (current && next && nodeIds.has(current.id) && !nodeIds.has(next.id)) {
        nodes[index] = next;
        nodes[index + 1] = current;
      }
    }
  } else {
    for (let index = 1; index < nodes.length; index += 1) {
      const current = nodes[index];
      const previous = nodes[index - 1];
      if (current && previous && nodeIds.has(current.id) && !nodeIds.has(previous.id)) {
        nodes[index - 1] = current;
        nodes[index] = previous;
      }
    }
  }
  return { ...data, nodes };
}

export function normalizeRotation(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function transformNodes(
  data: CanvasDocument,
  nodeIds: ReadonlySet<string>,
  transform: Partial<Pick<CanvasStyleAttributes, 'rotation' | 'flipX' | 'flipY'>>
): CanvasDocument {
  if (nodeIds.size === 0) return data;
  return {
    ...data,
    nodes: data.nodes.map((node) => {
      if (!nodeIds.has(node.id)) return node;
      const styleAttributes = { ...(node.styleAttributes ?? {}) };
      if (transform.rotation !== undefined) styleAttributes.rotation = normalizeRotation(Number(transform.rotation));
      if (transform.flipX !== undefined) styleAttributes.flipX = transform.flipX;
      if (transform.flipY !== undefined) styleAttributes.flipY = transform.flipY;
      return { ...node, styleAttributes };
    })
  };
}
