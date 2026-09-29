import type { CanvasDocument, CanvasEdgeData, CanvasNodeData } from './types';

function sides(from: CanvasNodeData, to: CanvasNodeData): Pick<CanvasEdgeData, 'fromSide' | 'toSide'> {
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const toCenter = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const horizontal = Math.abs(toCenter.x - fromCenter.x) >= Math.abs(toCenter.y - fromCenter.y);
  const forward = horizontal ? toCenter.x >= fromCenter.x : toCenter.y >= fromCenter.y;
  return horizontal
    ? { fromSide: forward ? 'right' : 'left', toSide: forward ? 'left' : 'right' }
    : { fromSide: forward ? 'bottom' : 'top', toSide: forward ? 'top' : 'bottom' };
}

export function connectNodes(
  data: CanvasDocument,
  fromNodeId: string,
  toNodeId: string,
  idFactory: (prefix: string) => string
): CanvasDocument {
  if (fromNodeId === toNodeId) return data;
  const from = data.nodes.find((node) => node.id === fromNodeId);
  const to = data.nodes.find((node) => node.id === toNodeId);
  if (!from || !to) return data;
  if (data.edges.some((edge) => edge.fromNode === fromNodeId && edge.toNode === toNodeId)) return data;
  const edge: CanvasEdgeData = {
    id: idFactory('edge'),
    fromNode: fromNodeId,
    toNode: toNodeId,
    ...sides(from, to),
    toEnd: 'arrow',
    styleAttributes: { pathfindingMethod: 'square' }
  };
  return { ...data, edges: [...data.edges, edge] };
}
