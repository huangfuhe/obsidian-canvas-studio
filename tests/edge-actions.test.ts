import assert from 'node:assert/strict';
import test from 'node:test';
import { connectNodes } from '../src/edge-actions';
import type { CanvasDocument } from '../src/types';

test('connects two nodes with geometry-aware anchors', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', type: 'text', x: 240, y: 0, width: 100, height: 50 }
    ],
    edges: []
  };
  const result = connectNodes(data, 'a', 'b', (prefix) => `${prefix}-1`);
  assert.deepEqual(result.edges[0], {
    id: 'edge-1', fromNode: 'a', toNode: 'b', fromSide: 'right', toSide: 'left',
    toEnd: 'arrow', styleAttributes: { pathfindingMethod: 'square' }
  });
});

test('does not add duplicate or self edges', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', type: 'text', x: 0, y: 200, width: 100, height: 50 }
    ],
    edges: [{ id: 'existing', fromNode: 'a', toNode: 'b' }]
  };
  assert.equal(connectNodes(data, 'a', 'b', () => 'new').edges.length, 1);
  assert.equal(connectNodes(data, 'a', 'a', () => 'new').edges.length, 1);
});
