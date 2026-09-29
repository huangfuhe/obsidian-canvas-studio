import type { CanvasEdgeData, CanvasNodeData } from './types';

export interface EdgeWaypoint {
  x: number;
  y: number;
}

export interface EdgeObstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoutedEdgePoints {
  points: EdgeWaypoint[];
  detours: number;
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

function inside(point: EdgeWaypoint, rect: EdgeObstacle): boolean {
  return point.x > rect.x && point.x < rect.x + rect.width
    && point.y > rect.y && point.y < rect.y + rect.height;
}

function orientation(a: EdgeWaypoint, b: EdgeWaypoint, c: EdgeWaypoint): number {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(a: EdgeWaypoint, b: EdgeWaypoint, c: EdgeWaypoint): boolean {
  return Math.min(a.x, c.x) <= b.x && b.x <= Math.max(a.x, c.x)
    && Math.min(a.y, c.y) <= b.y && b.y <= Math.max(a.y, c.y);
}

function segmentsIntersect(a: EdgeWaypoint, b: EdgeWaypoint, c: EdgeWaypoint, d: EdgeWaypoint): boolean {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  if ((first > 0 && second < 0 || first < 0 && second > 0)
    && (third > 0 && fourth < 0 || third < 0 && fourth > 0)) return true;
  return first === 0 && onSegment(a, c, b)
    || second === 0 && onSegment(a, d, b)
    || third === 0 && onSegment(c, a, d)
    || fourth === 0 && onSegment(c, b, d);
}

function segmentCrossesInterior(from: EdgeWaypoint, to: EdgeWaypoint, obstacle: EdgeObstacle): boolean {
  if (inside(from, obstacle) || inside(to, obstacle)) return true;
  const topLeft = { x: obstacle.x, y: obstacle.y };
  const topRight = { x: obstacle.x + obstacle.width, y: obstacle.y };
  const bottomRight = { x: obstacle.x + obstacle.width, y: obstacle.y + obstacle.height };
  const bottomLeft = { x: obstacle.x, y: obstacle.y + obstacle.height };
  return segmentsIntersect(from, to, topLeft, topRight)
    || segmentsIntersect(from, to, topRight, bottomRight)
    || segmentsIntersect(from, to, bottomRight, bottomLeft)
    || segmentsIntersect(from, to, bottomLeft, topLeft);
}

function pathLength(points: EdgeWaypoint[]): number {
  let length = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (from && to) length += Math.hypot(to.x - from.x, to.y - from.y);
  }
  return length;
}

function chooseDetour(from: EdgeWaypoint, to: EdgeWaypoint, obstacle: EdgeObstacle, obstacles: EdgeObstacle[], margin: number): EdgeWaypoint[] {
  const left = obstacle.x - margin;
  const right = obstacle.x + obstacle.width + margin;
  const top = obstacle.y - margin;
  const bottom = obstacle.y + obstacle.height + margin;
  const candidates = [
    [{ x: from.x, y: top }, { x: to.x, y: top }],
    [{ x: from.x, y: bottom }, { x: to.x, y: bottom }],
    [{ x: left, y: from.y }, { x: left, y: to.y }],
    [{ x: right, y: from.y }, { x: right, y: to.y }]
  ];
  const scored = candidates.map((candidate) => {
    const route = [from, ...candidate, to];
    const collisions = obstacles.reduce((count, item) => count + route.slice(0, -1).filter((_, index) => {
      const start = route[index];
      const end = route[index + 1];
      return start && end && segmentCrossesInterior(start, end, item);
    }).length, 0);
    return { candidate, score: collisions * 1000000 + pathLength(route) };
  });
  scored.sort((first, second) => first.score - second.score);
  return scored[0]?.candidate ?? [];
}

export function routeEdgeWithObstacles(
  points: EdgeWaypoint[],
  obstacles: EdgeObstacle[],
  margin = 24
): RoutedEdgePoints {
  if (points.length < 2 || obstacles.length === 0) return { points, detours: 0 };
  const routed = [...points];
  let detours = 0;
  let attempts = 0;
  let index = 0;
  const maxAttempts = Math.max(4, obstacles.length * 4);
  while (index < routed.length - 1 && attempts < maxAttempts) {
    const from = routed[index];
    const to = routed[index + 1];
    if (!from || !to) {
      index += 1;
      continue;
    }
    const obstacle = obstacles.find((item) => segmentCrossesInterior(from, to, item));
    if (!obstacle) {
      index += 1;
      continue;
    }
    const detour = chooseDetour(from, to, obstacle, obstacles, margin);
    routed.splice(index + 1, 0, ...detour);
    detours += detour.length;
    attempts += 1;
  }
  return { points: routed, detours };
}
