import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateSelection } from '../src/selection-actions';
import type { CanvasDocument } from '../src/types';

test('duplicates selected nodes and internal edges with fresh IDs', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50, text: 'A' },
      { id: 'b', type: 'text', x: 200, y: 0, width: 100, height: 50, text: 'B' },
      { id: 'outside', type: 'text', x: 500, y: 0, width: 100, height: 50, text: 'O' }
    ],
    edges: [
      { id: 'inside', fromNode: 'a', toNode: 'b' },
      { id: 'external', fromNode: 'a', toNode: 'outside' }
    ]
  };
  let next = 0;
  const result = duplicateSelection(data, new Set(['a', 'b']), (prefix) => `${prefix}-${++next}`);
  assert.equal(result.nodes.length, 5);
  assert.equal(result.edges.length, 3);
  assert.deepEqual(result.nodes[3], { id: 'text-1', type: 'text', x: 40, y: 40, width: 100, height: 50, text: 'A' });
  assert.equal(result.edges[2]?.fromNode, 'text-1');
  assert.equal(result.edges[2]?.toNode, 'text-2');
});

test('leaves data identity unchanged when no nodes are selected', () => {
  const data: CanvasDocument = { nodes: [], edges: [] };
  assert.equal(duplicateSelection(data, new Set(), () => 'id'), data);
});
