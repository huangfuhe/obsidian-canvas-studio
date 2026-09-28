import assert from 'node:assert/strict';
import test from 'node:test';
import { createSavedComponent, instantiateSavedComponent } from '../src/saved-components';

const data = {
  nodes: [
    { id: 'a', type: 'text' as const, x: 100, y: 200, width: 100, height: 60, text: 'A' },
    { id: 'b', type: 'text' as const, x: 260, y: 260, width: 100, height: 60, text: 'B' },
    { id: 'outside', type: 'text' as const, x: 800, y: 800, width: 100, height: 60, text: 'Outside' }
  ],
  edges: [{ id: 'ab', fromNode: 'a', toNode: 'b' }]
};

test('saves selected nodes and internal edges in normalized coordinates', () => {
  const component = createSavedComponent(data, new Set(['a', 'b']), 'saved-1', 'AB');
  assert.deepEqual(component.nodes.map((node) => [node.id, node.x, node.y]), [['a', 0, 0], ['b', 160, 60]]);
  assert.equal(component.edges.length, 1);
});

test('re-instantiates saved components with fresh IDs and mapped edges', () => {
  const component = createSavedComponent(data, new Set(['a', 'b']), 'saved-1', 'AB');
  let index = 0;
  const result = instantiateSavedComponent(component, { x: 1000, y: 2000 }, (prefix) => `${prefix}-${++index}`);
  assert.deepEqual(result.nodes.map((node) => [node.id, node.x, node.y]), [['node-1', 1000, 2000], ['node-2', 1160, 2060]]);
  assert.deepEqual(result.edges[0], { id: 'edge-3', fromNode: 'node-1', toNode: 'node-2' });
});
