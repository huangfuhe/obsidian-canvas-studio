import assert from 'node:assert/strict';
import test from 'node:test';
import { associatedEdgeIds } from '../src/edge-highlighting';

test('finds every edge attached to a selected node without changing edge data', () => {
  const edges = [
    { id: 'a', fromNode: 'one', toNode: 'two' },
    { id: 'b', fromNode: 'two', toNode: 'three' },
    { id: 'c', fromNode: 'four', toNode: 'five' }
  ];
  assert.deepEqual([...associatedEdgeIds(edges, ['two'])], ['a', 'b']);
  assert.deepEqual(edges, [
    { id: 'a', fromNode: 'one', toNode: 'two' },
    { id: 'b', fromNode: 'two', toNode: 'three' },
    { id: 'c', fromNode: 'four', toNode: 'five' }
  ]);
});

test('returns no associated edges for an empty selection', () => {
  assert.deepEqual(associatedEdgeIds([{ id: 'a', fromNode: 'one', toNode: 'two' }], []), new Set());
});
