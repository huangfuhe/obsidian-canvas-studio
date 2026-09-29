import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMindMapTheme, mindMapDepths, mindMapRootId, MIND_MAP_THEMES, setMindMapRoot } from '../src/mindmap';
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

test('applies a depth-aware mind-map theme while preserving unrelated nodes', () => {
  const tree: CanvasDocument = {
    ...data,
    nodes: [...data.nodes, { id: 'leaf', type: 'text', x: 400, y: 0, width: 120, height: 60 }],
    edges: [{ id: 'e1', fromNode: 'root', toNode: 'child' }]
  };
  assert.deepEqual([...mindMapDepths(tree, 'root').entries()], [['root', 0], ['child', 1]]);
  const themed = applyMindMapTheme(tree, 'root', MIND_MAP_THEMES[0]!);
  assert.equal(themed.nodes[0]?.color, '5');
  assert.equal(themed.nodes[1]?.styleAttributes?.canvasStudioMindMapDepth, 1);
  assert.equal(themed.nodes[2]?.color, undefined);
  assert.equal((themed.metadata as { canvasStudio: { mindMapTheme: string } }).canvasStudio.mindMapTheme, 'ocean');
});
