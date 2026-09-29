import assert from 'node:assert/strict';
import test from 'node:test';
import { addEmptyLane, arrangeLanes, deleteGroupWithContents, duplicateGroupAsLane, moveGroupLane, moveNodesIntoGroup, removeGroupContainer, setLaneAxis } from '../src/lane-actions';
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

test('arranges selected horizontal lanes and moves their children', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'a', type: 'group', x: 0, y: 40, width: 200, height: 120 },
      { id: 'a-child', type: 'text', x: 40, y: 80, width: 80, height: 40, text: 'A' },
      { id: 'b', type: 'group', x: 280, y: 80, width: 240, height: 180 },
      { id: 'b-child', type: 'text', x: 320, y: 120, width: 80, height: 40, text: 'B' }
    ],
    edges: []
  };
  const result = arrangeLanes(data, new Set(['a', 'b']), 'horizontal', 40);
  assert.equal(result.nodes[0]?.x, 0);
  assert.equal(result.nodes[0]?.y, 40);
  assert.equal(result.nodes[0]?.height, 180);
  assert.equal(result.nodes[2]?.x, 240);
  assert.equal(result.nodes[2]?.y, 40);
  assert.equal(result.nodes[1]?.y, 80);
  assert.equal(result.nodes[3]?.x, 280);
});

test('switches selected lanes to row axis and keeps children with their groups', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'a', type: 'group', x: 0, y: 0, width: 220, height: 140 },
      { id: 'a-child', type: 'text', x: 40, y: 40, width: 80, height: 40, text: 'A' },
      { id: 'b', type: 'group', x: 300, y: 20, width: 260, height: 180 },
      { id: 'b-child', type: 'text', x: 340, y: 70, width: 80, height: 40, text: 'B' }
    ],
    edges: []
  };
  const result = setLaneAxis(data, new Set(['a', 'b']), 'row', 40);
  assert.equal(result.nodes[0]?.x, 0);
  assert.equal(result.nodes[0]?.y, 0);
  assert.equal(result.nodes[2]?.x, 0);
  assert.equal(result.nodes[2]?.y, 180);
  assert.equal(result.nodes[0]?.styleAttributes?.canvasStudioLaneAxis, 'row');
  assert.equal(result.nodes[2]?.styleAttributes?.canvasStudioLaneAxis, 'row');
  assert.equal(result.nodes[1]?.x, 40);
  assert.equal(result.nodes[1]?.y, 40);
  assert.equal(result.nodes[3]?.x, 40);
  assert.equal(result.nodes[3]?.y, 230);
});

test('moves selected nodes into a target lane while preserving their relative layout', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'lane', type: 'group', x: 100, y: 100, width: 300, height: 240 },
      { id: 'a', type: 'text', x: 500, y: 350, width: 80, height: 40, text: 'A' },
      { id: 'b', type: 'text', x: 620, y: 430, width: 80, height: 40, text: 'B' }
    ],
    edges: []
  };
  const result = moveNodesIntoGroup(data, 'lane', new Set(['a', 'b']));
  assert.equal(result.nodes[1]?.x, 116);
  assert.equal(result.nodes[1]?.y, 116);
  assert.equal(result.nodes[2]?.x, 236);
  assert.equal(result.nodes[2]?.y, 196);
});

test('adds an empty lane beside the source without copying its contents', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'lane', type: 'group', x: 0, y: 0, width: 240, height: 160, label: '需求方', styleAttributes: { canvasStudioLaneAxis: 'column' } },
      { id: 'child', type: 'text', x: 40, y: 50, width: 80, height: 40, text: '保留在原泳道' }
    ],
    edges: []
  };
  const result = addEmptyLane(data, 'lane', 'right', (prefix) => `${prefix}-2`);
  assert.equal(result.nodes.length, 3);
  assert.deepEqual(result.nodes[2], {
    id: 'group-2', type: 'group', x: 280, y: 0, width: 240, height: 160, label: '需求方 2',
    styleAttributes: { canvasStudioLaneAxis: 'column' }
  });
});

test('deletes a lane, its contained nodes, and connected edges while preserving outside content', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'lane', type: 'group', x: 0, y: 0, width: 240, height: 160 },
      { id: 'inside-a', type: 'text', x: 40, y: 50, width: 80, height: 40, text: 'A' },
      { id: 'inside-b', type: 'text', x: 140, y: 80, width: 80, height: 40, text: 'B' },
      { id: 'outside', type: 'text', x: 400, y: 50, width: 80, height: 40, text: '外部' }
    ],
    edges: [
      { id: 'internal', fromNode: 'inside-a', toNode: 'inside-b' },
      { id: 'crossing', fromNode: 'inside-a', toNode: 'outside' },
      { id: 'outside-edge', fromNode: 'outside', toNode: 'outside' }
    ]
  };
  const result = deleteGroupWithContents(data, 'lane');
  assert.deepEqual(result.nodes.map((node) => node.id), ['outside']);
  assert.deepEqual(result.edges.map((edge) => edge.id), ['outside-edge']);
});
