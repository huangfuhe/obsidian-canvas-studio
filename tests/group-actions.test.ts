import assert from 'node:assert/strict';
import test from 'node:test';
import { groupNodes, ungroupNodes } from '../src/group-actions';
import type { CanvasDocument } from '../src/types';

test('groups selected nodes in a native group without moving them', () => {
  const data: CanvasDocument = {
    metadata: { keep: true },
    nodes: [
      { id: 'a', type: 'text', x: 100, y: 100, width: 120, height: 60, text: 'A' },
      { id: 'b', type: 'file', x: 300, y: 220, width: 80, height: 40, file: 'image.png' },
      { id: 'outside', type: 'text', x: 800, y: 80, width: 100, height: 50, text: '外部' }
    ],
    edges: [{ id: 'edge', fromNode: 'a', toNode: 'b' }]
  };
  const grouped = groupNodes(data, new Set(['a', 'b']), { id: 'group', label: '分组', padding: 20, header: 30, minWidth: 0, minHeight: 0 });
  assert.deepEqual(grouped.nodes[0], {
    id: 'group', type: 'group', x: 80, y: 70, width: 320, height: 210,
    label: '分组', styleAttributes: { border: 'solid' }
  });
  assert.deepEqual(grouped.nodes.slice(1), data.nodes);
  assert.deepEqual(grouped.edges, data.edges);
  assert.deepEqual(grouped.metadata, data.metadata);
});

test('ungroups selected groups and leaves child nodes and edges intact', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'group', type: 'group', x: 0, y: 0, width: 500, height: 300 },
      { id: 'child', type: 'text', x: 40, y: 60, width: 120, height: 50, text: '子节点' }
    ],
    edges: [{ id: 'edge', fromNode: 'child', toNode: 'child' }]
  };
  const ungrouped = ungroupNodes(data, new Set(['group']));
  assert.deepEqual(ungrouped.nodes, [data.nodes[1]]);
  assert.deepEqual(ungrouped.edges, data.edges);
});
