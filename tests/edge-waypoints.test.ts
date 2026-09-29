import assert from 'node:assert/strict';
import test from 'node:test';
import { addWaypointAtLongestSegment, edgeRoutePoints, parseEdgeWaypoints, polylinePath, routeEdgeWithObstacles, serializeEdgeWaypoints } from '../src/edge-waypoints';
import type { CanvasEdgeData, CanvasNodeData } from '../src/types';

const nodes = new Map<string, CanvasNodeData>([
  ['a', { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50 }],
  ['b', { id: 'b', type: 'text', x: 300, y: 200, width: 100, height: 50 }]
]);
const edge: CanvasEdgeData = { id: 'e', fromNode: 'a', toNode: 'b', fromSide: 'right', toSide: 'left' };

test('round-trips edge waypoints through an optional style field', () => {
  const points = [{ x: 160, y: 25 }, { x: 160, y: 225 }];
  const encoded = serializeEdgeWaypoints(points);
  assert.equal(encoded, '[{"x":160,"y":25},{"x":160,"y":225}]');
  assert.deepEqual(parseEdgeWaypoints({ ...edge, styleAttributes: { canvasStudioWaypoints: encoded } }), points);
});

test('builds a route from node anchors and waypoints', () => {
  assert.deepEqual(edgeRoutePoints(edge, nodes, [{ x: 160, y: 25 }]), [
    { x: 100, y: 25 }, { x: 160, y: 25 }, { x: 300, y: 225 }
  ]);
  assert.equal(polylinePath(edgeRoutePoints(edge, nodes, [{ x: 160, y: 25 }])), 'M 100 25 L 160 25 L 300 225');
});

test('adds a waypoint to the longest route segment', () => {
  assert.deepEqual(addWaypointAtLongestSegment([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 100 }]), [
    { x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 50 }, { x: 20, y: 100 }
  ]);
});

test('routes a manual segment around a blocking node without changing saved waypoints', () => {
  const result = routeEdgeWithObstacles([
    { x: 0, y: 50 },
    { x: 300, y: 50 }
  ], [{ x: 120, y: 0, width: 80, height: 100 }], 20);
  assert.ok(result.detours > 0);
  assert.ok(result.points.some((point) => point.y < 0 || point.y > 100));
});

test('routes around multiple blocking nodes with orthogonal segments', () => {
  const obstacles = [
    { x: 120, y: 0, width: 80, height: 100 },
    { x: 260, y: 0, width: 80, height: 100 }
  ];
  const result = routeEdgeWithObstacles([
    { x: 0, y: 50 },
    { x: 500, y: 50 }
  ], obstacles, 20);
  assert.ok(result.detours >= 2);
  for (let index = 0; index < result.points.length - 1; index += 1) {
    const from = result.points[index]!;
    const to = result.points[index + 1]!;
    assert.ok(from.x === to.x || from.y === to.y, 'route segments must be orthogonal');
    for (const obstacle of obstacles) {
      if (from.x === to.x) {
        assert.ok(!(from.x > obstacle.x && from.x < obstacle.x + obstacle.width
          && Math.min(from.y, to.y) < obstacle.y + obstacle.height
          && Math.max(from.y, to.y) > obstacle.y));
      } else {
        assert.ok(!(from.y > obstacle.y && from.y < obstacle.y + obstacle.height
          && Math.min(from.x, to.x) < obstacle.x + obstacle.width
          && Math.max(from.x, to.x) > obstacle.x));
      }
    }
  }
});
