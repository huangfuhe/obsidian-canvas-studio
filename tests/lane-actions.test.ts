import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateGroupAsLane, moveGroupLane, removeGroupContainer } from '../src/lane-actions';
import type { CanvasDocument } from '../src/types';

test('duplicates a group as a right-hand lane with internal edges remapped', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'lane', type: 'group', x: 0, y: 0, width: 300, height: 240, label: '需求方' },
      { id: 'a', type: 'text', x: 40, y: 70, width: 100, height: 50, text: 'A' },
      { id: 'b', type: 'text', x: 160, y: 150, width: 100, height: 50, text: 'B' },
      { id: 'outside', type: 'text', x: 500, y: 40, width: 100, height: 50, text: '外部' }
    ],
    edges: [
      { id: 'inside-edge', fromNode: 'a', toNode: 'b' },
      { id: 'external-edge', fromNode: 'a', toNode: 'outside' }
    ]
  };
  let next = 0;
  const result = duplicateGroupAsLane(data, 'lane', 'right', (prefix) => `${prefix}-${++next}`);
  assert.equal(result.nodes.length, 7);
  assert.equal(result.edges.length, 3);
  assert.deepEqual(result.nodes[4], { id: 'group-1', type: 'group', x: 340, y: 0, width: 300, height: 240, label: '需求方 2' });
  assert.equal(result.nodes[5]?.x, 380);
  assert.equal(result.edges[2]?.fromNode, 'node-2');
  assert.equal(result.edges[2]?.toNode, 'node-3');
});

test('leaves data unchanged when the source group is missing', () => {
  const data: CanvasDocument = { nodes: [], edges: [] };
  assert.deepEqual(duplicateGroupAsLane(data, 'missing', 'down', () => 'x'), data);
});

test('moves a lane left with its contained nodes', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'left', type: 'group', x: 0, y: 0, width: 200, height: 200 },
      { id: 'left-child', type: 'text', x: 40, y: 50, width: 80, height: 40, text: 'L' },
      { id: 'right', type: 'group', x: 260, y: 0, width: 200, height: 200 },
      { id: 'right-child', type: 'text', x: 300, y: 50, width: 80, height: 40, text: 'R' }
    ],
    edges: []
  };
  const result = moveGroupLane(data, 'right', 'left');
  assert.equal(result.nodes[2]?.x, 0);
  assert.equal(result.nodes[3]?.x, 40);
  assert.equal(result.nodes[0]?.x, 260);
  assert.equal(result.nodes[1]?.x, 300);
});

test('removes only the group container and keeps content', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'group', type: 'group', x: 0, y: 0, width: 200, height: 100 },
      { id: 'child', type: 'text', x: 30, y: 40, width: 80, height: 40, text: '保留' }
    ],
    edges: []
  };
  assert.deepEqual(removeGroupContainer(data, 'group').nodes, [data.nodes[1]]);
});
