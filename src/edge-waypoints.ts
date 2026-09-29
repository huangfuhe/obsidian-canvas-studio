import type { CanvasEdgeData, CanvasNodeData } from './types';

export interface EdgeWaypoint {
  x: number;
  y: number;
}

export const EDGE_WAYPOINTS_KEY = 'canvasStudioWaypoints';

export function parseEdgeWaypoints(edge: CanvasEdgeData): EdgeWaypoint[] {
  const raw = edge.styleAttributes?.[EDGE_WAYPOINTS_KEY];
  if (typeof raw !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((point): point is EdgeWaypoint => typeof point === 'object'
      && point !== null
      && typeof (point as EdgeWaypoint).x === 'number'
      && Number.isFinite((point as EdgeWaypoint).x)
      && typeof (point as EdgeWaypoint).y === 'number'
      && Number.isFinite((point as EdgeWaypoint).y));
  } catch {
    return [];
  }
}

export function serializeEdgeWaypoints(points: EdgeWaypoint[]): string | null {
  return points.length > 0 ? JSON.stringify(points.map((point) => ({ x: point.x, y: point.y }))) : null;
}

function sidePoint(node: CanvasNodeData, side?: CanvasEdgeData['fromSide']): EdgeWaypoint {
  switch (side) {
    case 'top': return { x: node.x + node.width / 2, y: node.y };
    case 'right': return { x: node.x + node.width, y: node.y + node.height / 2 };
    case 'bottom': return { x: node.x + node.width / 2, y: node.y + node.height };
    case 'left': return { x: node.x, y: node.y + node.height / 2 };
    default: return { x: node.x + node.width / 2, y: node.y + node.height / 2 };
  }
}

export function edgeRoutePoints(
  edge: CanvasEdgeData,
  nodes: ReadonlyMap<string, CanvasNodeData>,
  waypoints: EdgeWaypoint[] = parseEdgeWaypoints(edge)
): EdgeWaypoint[] {
  const from = nodes.get(edge.fromNode);
  const to = nodes.get(edge.toNode);
  if (!from || !to) return waypoints;
  return [sidePoint(from, edge.fromSide), ...waypoints, sidePoint(to, edge.toSide)];
}

export function polylinePath(points: EdgeWaypoint[]): string {
  if (points.length === 0) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function addWaypointAtLongestSegment(points: EdgeWaypoint[]): EdgeWaypoint[] {
  if (points.length < 2) return points;
  let segment = 0;
  let length = -1;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    if (!current || !next) continue;
    const candidate = Math.hypot(next.x - current.x, next.y - current.y);
    if (candidate > length) {
      length = candidate;
      segment = index;
    }
  }
  const from = points[segment];
  const to = points[segment + 1];
  if (!from || !to) return points;
  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  return [...points.slice(0, segment + 1), midpoint, ...points.slice(segment + 1)];
}
