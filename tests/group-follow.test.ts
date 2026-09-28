import assert from 'node:assert/strict';
import test from 'node:test';
import { moveGroupChildren } from '../src/group-follow';

test('moves nodes contained by a group with the group delta', () => {
  const data = {
    nodes: [
      { id: 'group', type: 'group' as const, x: 0, y: 0, width: 400, height: 300 },
      { id: 'inside', type: 'text' as const, x: 40, y: 50, width: 120, height: 60 },
      { id: 'outside', type: 'text' as const, x: 600, y: 50, width: 120, height: 60 }
    ],
    edges: []
  };
  const result = moveGroupChildren(data, 'group', { x: 0, y: 0 }, { x: 100, y: 80 });
  assert.deepEqual(result.nodes.find((node) => node.id === 'inside'), { id: 'inside', type: 'text', x: 140, y: 130, width: 120, height: 60 });
  assert.deepEqual(result.nodes.find((node) => node.id === 'outside'), data.nodes[2]);
});

test('does not move a group when the position did not change', () => {
  const data = { nodes: [{ id: 'group', type: 'group' as const, x: 0, y: 0, width: 200, height: 200 }], edges: [] };
  assert.equal(moveGroupChildren(data, 'group', { x: 0, y: 0 }, { x: 0, y: 0 }), data);
});
