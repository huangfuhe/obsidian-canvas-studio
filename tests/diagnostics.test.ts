import assert from 'node:assert/strict';
import test from 'node:test';
import { diagnoseCanvas } from '../src/diagnostics';
import type { CanvasDocument } from '../src/types';

test('detects invalid references, cycles, overlaps, and group overflow', () => {
  const data: CanvasDocument = {
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 120, height: 80 },
      { id: 'b', type: 'text', x: 80, y: 40, width: 120, height: 80 },
      { id: 'a', type: 'text', x: 400, y: 0, width: 120, height: 80 },
      { id: 'group', type: 'group', x: 380, y: -10, width: 160, height: 100, label: '分区' }
    ],
    edges: [
      { id: 'missing', fromNode: 'a', toNode: 'missing' },
      { id: 'ab', fromNode: 'a', toNode: 'b' },
      { id: 'ba', fromNode: 'b', toNode: 'a' }
    ]
  };
  const issues = diagnoseCanvas(data);
  assert.ok(issues.some((issue) => issue.kind === 'duplicate-id'));
  assert.ok(issues.some((issue) => issue.kind === 'orphan-edge'));
  assert.ok(issues.some((issue) => issue.kind === 'cycle'));
  assert.ok(issues.some((issue) => issue.kind === 'overlap'));
  assert.ok(issues.some((issue) => issue.kind === 'outside-group'));
});

test('returns no issues for a clean linear canvas', () => {
  const issues = diagnoseCanvas({
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 60 },
      { id: 'b', type: 'text', x: 200, y: 0, width: 100, height: 60 }
    ],
    edges: [{ id: 'e', fromNode: 'a', toNode: 'b' }]
  });
  assert.deepEqual(issues, []);
});

test('detects stale Canvas Studio semantic references', () => {
  const issues = diagnoseCanvas({
    metadata: { canvasStudio: { mindMapRootId: 'missing-root', collapsedMindMapNodeIds: ['missing-branch'] } },
    nodes: [
      { id: 'lane-child', type: 'text', x: 0, y: 0, width: 100, height: 60, styleAttributes: { canvasStudioLaneId: 'missing-lane' } },
      { id: 'cell', type: 'text', x: 200, y: 0, width: 100, height: 60, styleAttributes: { canvasStudioTableId: 'missing-table' } }
    ],
    edges: []
  });
  const semantic = issues.filter((issue) => issue.kind === 'invalid-semantic-reference');
  assert.equal(semantic.length, 4);
  assert.ok(semantic.some((issue) => issue.message.includes('思维导图根节点')));
  assert.ok(semantic.some((issue) => issue.message.includes('泳道')));
  assert.ok(semantic.some((issue) => issue.message.includes('表格')));
});
