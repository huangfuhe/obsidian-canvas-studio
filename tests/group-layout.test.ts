import assert from 'node:assert/strict';
import test from 'node:test';
import { fitGroupsToChildren } from '../src/group-layout';
import type { CanvasDocument } from '../src/types';

test('fits selected groups to their contained nodes without moving children', () => {
  const data: CanvasDocument = {
    metadata: { keep: true },
    nodes: [
      { id: 'group', type: 'group', x: 0, y: 0, width: 800, height: 600, label: '泳道' },
      { id: 'inside-a', type: 'text', x: 100, y: 80, width: 120, height: 60, text: 'A' },
      { id: 'inside-b', type: 'file', x: 320, y: 250, width: 80, height: 40, file: 'a.png' },
      { id: 'outside', type: 'text', x: 900, y: 100, width: 100, height: 50, text: '外部' }
    ],
    edges: []
  };

  const fitted = fitGroupsToChildren(data, new Set(['group']), {
    padding: 20,
    header: 30,
    minWidth: 0,
    minHeight: 0
  });
  assert.deepEqual(fitted.nodes[0], {
    id: 'group',
    type: 'group',
    x: 80,
    y: 50,
    width: 340,
    height: 260,
    label: '泳道'
  });
  assert.deepEqual(fitted.nodes[1], data.nodes[1]);
  assert.deepEqual(fitted.nodes[2], data.nodes[2]);
  assert.deepEqual(fitted.nodes[3], data.nodes[3]);
  assert.deepEqual(fitted.metadata, data.metadata);
});

test('leaves groups with no contained nodes unchanged', () => {
  const data: CanvasDocument = {
    nodes: [{ id: 'group', type: 'group', x: 10, y: 20, width: 300, height: 160 }],
    edges: []
  };
  assert.deepEqual(fitGroupsToChildren(data, new Set(['group'])), data);
});
