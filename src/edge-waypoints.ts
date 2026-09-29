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

interface GridPoint extends EdgeWaypoint {
  key: string;
}

interface GridState {
  key: string;
  cost: number;
  estimate: number;
  previous?: string;
}

function expandedObstacle(obstacle: EdgeObstacle, margin: number): EdgeObstacle {
  return {
    x: obstacle.x - margin,
    y: obstacle.y - margin,
    width: obstacle.width + margin * 2,
    height: obstacle.height + margin * 2
  };
}

function pointInside(point: EdgeWaypoint, obstacle: EdgeObstacle): boolean {
  return point.x > obstacle.x && point.x < obstacle.x + obstacle.width
    && point.y > obstacle.y && point.y < obstacle.y + obstacle.height;
}

function axisSegmentBlocked(from: EdgeWaypoint, to: EdgeWaypoint, obstacle: EdgeObstacle): boolean {
  if (from.x !== to.x && from.y !== to.y) return true;
  if (from.x === to.x) {
    const low = Math.min(from.y, to.y);
    const high = Math.max(from.y, to.y);
    return from.x > obstacle.x
      && from.x < obstacle.x + obstacle.width
      && low < obstacle.y + obstacle.height
      && high > obstacle.y;
  }
  const low = Math.min(from.x, to.x);
  const high = Math.max(from.x, to.x);
  return from.y > obstacle.y
    && from.y < obstacle.y + obstacle.height
    && low < obstacle.x + obstacle.width
    && high > obstacle.x;
}

function segmentBlocked(from: EdgeWaypoint, to: EdgeWaypoint, obstacles: EdgeObstacle[]): boolean {
  return obstacles.some((obstacle) => axisSegmentBlocked(from, to, obstacle));
}

function coordinateKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function uniqueCoordinates(values: number[]): number[] {
  return [...new Set(values.filter(Number.isFinite))].sort((first, second) => first - second);
}

function simplifyOrthogonalPath(points: EdgeWaypoint[]): EdgeWaypoint[] {
  const result: EdgeWaypoint[] = [];
  for (const point of points) {
    const previous = result[result.length - 1];
    if (previous && previous.x === point.x && previous.y === point.y) continue;
    const beforePrevious = result[result.length - 2];
    if (beforePrevious && previous
      && (beforePrevious.x === previous.x && previous.x === point.x
        || beforePrevious.y === previous.y && previous.y === point.y)) {
      result[result.length - 1] = point;
      continue;
    }
    result.push(point);
  }
  return result;
}

function routeOrthogonalSegment(
  from: EdgeWaypoint,
  to: EdgeWaypoint,
  obstacles: EdgeObstacle[],
  margin: number
): EdgeWaypoint[] {
  if (from.x === to.x && from.y === to.y) return [from];
  const expanded = obstacles.map((obstacle) => expandedObstacle(obstacle, margin));
  const columns = uniqueCoordinates([
    from.x,
    to.x,
    ...expanded.flatMap((obstacle) => [obstacle.x, obstacle.x + obstacle.width])
  ]);
  const rows = uniqueCoordinates([
    from.y,
    to.y,
    ...expanded.flatMap((obstacle) => [obstacle.y, obstacle.y + obstacle.height])
  ]);
  const columnIndex = new Map(columns.map((value, index) => [value, index]));
  const rowIndex = new Map(rows.map((value, index) => [value, index]));
  const points = new Map<string, GridPoint>();
  for (const x of columns) {
    for (const y of rows) {
      const point = { x, y, key: coordinateKey(x, y) };
      if (!expanded.some((obstacle) => pointInside(point, obstacle))) {
        points.set(point.key, point);
      }
    }
  }
  const startKey = coordinateKey(from.x, from.y);
  const endKey = coordinateKey(to.x, to.y);
  points.set(startKey, { ...from, key: startKey });
  points.set(endKey, { ...to, key: endKey });
  const start = points.get(startKey);
  const end = points.get(endKey);
  if (!start || !end) return [from, to];

  const open = new Map<string, GridState>([[start.key, { key: start.key, cost: 0, estimate: Math.abs(to.x - from.x) + Math.abs(to.y - from.y) }]]);
  const closed = new Set<string>();
  const states = new Map<string, GridState>();
  states.set(start.key, { key: start.key, cost: 0, estimate: 0 });
  const neighbors = (point: GridPoint): GridPoint[] => {
    const result: GridPoint[] = [];
    const x = columnIndex.get(point.x);
    const y = rowIndex.get(point.y);
    if (x === undefined || y === undefined) return result;
    for (const [nextX, nextY] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]] as Array<[number, number]>) {
      const candidateX = columns[nextX];
      const candidateY = rows[nextY];
      if (candidateX === undefined || candidateY === undefined) continue;
      const candidate = points.get(coordinateKey(candidateX, candidateY));
      if (candidate && !segmentBlocked(point, candidate, expanded)) result.push(candidate);
    }
    return result.sort((first, second) => first.key.localeCompare(second.key));
  };
  while (open.size > 0) {
    const current = [...open.values()].sort((first, second) => first.estimate - second.estimate || first.key.localeCompare(second.key))[0];
    if (!current) break;
    open.delete(current.key);
    if (current.key === end.key) {
      const path: EdgeWaypoint[] = [];
      let cursor: string | undefined = end.key;
      while (cursor) {
        const point = points.get(cursor);
        if (!point) break;
        path.unshift({ x: point.x, y: point.y });
        cursor = states.get(cursor)?.previous;
      }
      return simplifyOrthogonalPath(path);
    }
    closed.add(current.key);
    const currentPoint = points.get(current.key);
    if (!currentPoint) continue;
    for (const candidate of neighbors(currentPoint)) {
      if (closed.has(candidate.key)) continue;
      const cost = current.cost + Math.abs(candidate.x - currentPoint.x) + Math.abs(candidate.y - currentPoint.y);
      const previous = states.get(candidate.key);
      if (previous && previous.cost <= cost) continue;
      const estimate = cost + Math.abs(to.x - candidate.x) + Math.abs(to.y - candidate.y);
      const nextState = { key: candidate.key, cost, estimate, previous: current.key };
      states.set(candidate.key, nextState);
      open.set(candidate.key, nextState);
    }
  }
  return [from, to];
}

export function routeEdgeWithObstacles(
  points: EdgeWaypoint[],
  obstacles: EdgeObstacle[],
  margin = 24
): RoutedEdgePoints {
  if (points.length < 2 || obstacles.length === 0) return { points, detours: 0 };
  const routed: EdgeWaypoint[] = [points[0]!];
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    if (!from || !to) continue;
    const segment = routeOrthogonalSegment(from, to, obstacles, margin);
    routed.push(...segment.slice(1));
  }
  const simplified = simplifyOrthogonalPath(routed);
  return { points: simplified, detours: Math.max(0, simplified.length - points.length) };
}
