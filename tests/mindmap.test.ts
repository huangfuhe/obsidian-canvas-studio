import assert from 'node:assert/strict';
import test from 'node:test';
import { mindMapRootId, setMindMapRoot } from '../src/mindmap';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  nodes: [
    { id: 'root', type: 'text', x: 0, y: 0, width: 120, height: 60 },
    { id: 'child', type: 'text', x: 200, y: 0, width: 120, height: 60 }
  ],
  edges: [],
  metadata: { canvasStudio: { grid: true } }
};

test('stores and reads a validated mind-map root without dropping metadata', () => {
  const marked = setMindMapRoot(data, 'root');
  assert.equal(mindMapRootId(marked), 'root');
  assert.equal((marked.metadata as { canvasStudio: { grid: boolean } }).canvasStudio.grid, true);
  assert.equal(mindMapRootId(setMindMapRoot(marked, null)), null);
});

test('ignores a missing root node', () => {
  assert.equal(setMindMapRoot(data, 'missing'), data);
});
