import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeRotation, reorderNodes, transformNodes } from '../src/object-actions';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  nodes: [
    { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50 },
    { id: 'b', type: 'text', x: 120, y: 0, width: 100, height: 50 },
    { id: 'c', type: 'text', x: 240, y: 0, width: 100, height: 50 }
  ],
  edges: []
};

test('reorders selected nodes at the requested layer position', () => {
  assert.deepEqual(reorderNodes(data, new Set(['b']), 'front').nodes.map((node) => node.id), ['a', 'c', 'b']);
  assert.deepEqual(reorderNodes(data, new Set(['b']), 'back').nodes.map((node) => node.id), ['b', 'a', 'c']);
  assert.deepEqual(reorderNodes(data, new Set(['b']), 'forward').nodes.map((node) => node.id), ['a', 'c', 'b']);
  assert.deepEqual(reorderNodes(data, new Set(['b']), 'backward').nodes.map((node) => node.id), ['b', 'a', 'c']);
});

test('normalizes rotations and stores node transforms without moving geometry', () => {
  assert.equal(normalizeRotation(-90), 270);
  const result = transformNodes(data, new Set(['a']), { rotation: -90, flipX: true });
  assert.equal(result.nodes[0]?.x, 0);
  assert.deepEqual(result.nodes[0]?.styleAttributes, { rotation: 270, flipX: true });
});
