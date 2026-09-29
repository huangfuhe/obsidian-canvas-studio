import assert from 'node:assert/strict';
import test from 'node:test';
import { addWaypointAtLongestSegment, edgeRoutePoints, parseEdgeWaypoints, polylinePath, serializeEdgeWaypoints } from '../src/edge-waypoints';
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
