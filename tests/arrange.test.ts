import assert from 'node:assert/strict';
import test from 'node:test';
import { arrangeNodes } from '../src/arrange';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  nodes: [
    { id: 'a', type: 'text', x: 0, y: 30, width: 100, height: 50 },
    { id: 'b', type: 'text', x: 180, y: 0, width: 80, height: 70 },
    { id: 'c', type: 'text', x: 400, y: 90, width: 120, height: 40 }
  ],
  edges: []
};
const all = new Set(['a', 'b', 'c']);

test('aligns nodes without changing their dimensions', () => {
  const result = arrangeNodes(data, all, 'align-left');
  assert.deepEqual(result.nodes.map((node) => node.x), [0, 0, 0]);
  assert.deepEqual(result.nodes.map((node) => node.width), [100, 80, 120]);
});

test('distributes nodes while keeping the outer bounds fixed', () => {
  const result = arrangeNodes(data, all, 'distribute-horizontal');
  const [a, b, c] = result.nodes;
  assert.equal(a?.x, 0);
  assert.equal(c?.x, 400);
  assert.equal(b?.x, 210);
});

test('leaves data unchanged when fewer than two nodes are selected', () => {
  assert.equal(arrangeNodes(data, new Set(['a']), 'align-top'), data);
});
