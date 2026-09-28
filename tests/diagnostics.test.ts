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
