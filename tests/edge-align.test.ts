import assert from 'node:assert/strict';
import test from 'node:test';
import { alignCanvasEdges } from '../src/canvas-data';

test('aligns horizontal and vertical edges to the nearest cardinal anchors', () => {
  const result = alignCanvasEdges({
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 60 },
      { id: 'b', type: 'text', x: 220, y: 10, width: 100, height: 60 },
      { id: 'c', type: 'text', x: 20, y: 180, width: 100, height: 60 }
    ],
    edges: [
      { id: 'ab', fromNode: 'a', toNode: 'b' },
      { id: 'ac', fromNode: 'a', toNode: 'c' }
    ]
  });
  assert.deepEqual([result.edges[0]?.fromSide, result.edges[0]?.toSide], ['right', 'left']);
  assert.deepEqual([result.edges[1]?.fromSide, result.edges[1]?.toSide], ['bottom', 'top']);
  assert.equal(result.edges[0]?.styleAttributes?.pathfindingMethod, 'square');
});

test('can align only a selected subset of edges', () => {
  const data = {
    nodes: [
      { id: 'a', type: 'text' as const, x: 0, y: 0, width: 100, height: 60 },
      { id: 'b', type: 'text' as const, x: 220, y: 0, width: 100, height: 60 },
      { id: 'c', type: 'text' as const, x: 0, y: 180, width: 100, height: 60 }
    ],
    edges: [
      { id: 'ab', fromNode: 'a', toNode: 'b', fromSide: 'top' as const, toSide: 'bottom' as const },
      { id: 'ac', fromNode: 'a', toNode: 'c', fromSide: 'left' as const, toSide: 'right' as const }
    ]
  };
  const result = alignCanvasEdges(data, new Set(['ab']));
  assert.deepEqual([result.edges[0]?.fromSide, result.edges[0]?.toSide], ['right', 'left']);
  assert.deepEqual([result.edges[1]?.fromSide, result.edges[1]?.toSide], ['left', 'right']);
});
