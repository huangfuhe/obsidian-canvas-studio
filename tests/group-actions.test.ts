import assert from 'node:assert/strict';
import test from 'node:test';
import { groupNodes, resizeGroups, ungroupNodes, updateGroupProperties } from '../src/group-actions';
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

test('updates only selected group properties', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'group-a', type: 'group', x: 0, y: 0, width: 200, height: 100, label: '旧标题' },
      { id: 'group-b', type: 'group', x: 300, y: 0, width: 200, height: 100, label: '保留' }
    ],
    edges: []
  };
  const result = updateGroupProperties(data, new Set(['group-a']), { label: '需求方', color: '5', locked: true });
  assert.equal(result.nodes[0]?.label, '需求方');
  assert.equal(result.nodes[0]?.color, '5');
  assert.equal(result.nodes[0]?.locked, true);
  assert.equal(result.nodes[1]?.label, '保留');
});

test('resizes selected groups with minimum dimensions', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'group-a', type: 'group', x: 0, y: 0, width: 200, height: 100 },
      { id: 'group-b', type: 'group', x: 300, y: 0, width: 200, height: 100 }
    ],
    edges: []
  };
  const result = resizeGroups(data, new Set(['group-a']), { width: 420, height: 40 });
  assert.equal(result.nodes[0]?.width, 420);
  assert.equal(result.nodes[0]?.height, 80);
  assert.equal(result.nodes[1]?.width, 200);
});
