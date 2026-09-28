import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCanvasTheme, CANVAS_THEMES } from '../src/themes';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  metadata: { existing: 'kept', canvasStudio: { schema: 1 } },
  nodes: [
    { id: 'start', type: 'text', x: 0, y: 0, width: 100, height: 50, text: '开始', styleAttributes: { shape: 'pill', custom: 'kept' } },
    { id: 'decision', type: 'text', x: 200, y: 0, width: 100, height: 50, text: '判断', styleAttributes: { shape: 'diamond' } },
    { id: 'doc', type: 'text', x: 400, y: 0, width: 100, height: 50, text: '文档', styleAttributes: { shape: 'document' } },
    { id: 'lane', type: 'group', x: 600, y: 0, width: 200, height: 300, label: '泳道', color: '2' }
  ],
  edges: [
    { id: 'a', fromNode: 'start', toNode: 'decision', styleAttributes: { custom: 'kept' } },
    { id: 'b', fromNode: 'decision', toNode: 'doc' }
  ],
  unknown: 'kept'
};

test('applies a semantic whole-canvas theme while preserving unknown fields', () => {
  const theme = CANVAS_THEMES[0]!;
  const result = applyCanvasTheme(data, theme);
  assert.equal(result.unknown, 'kept');
  assert.equal((result.metadata as Record<string, unknown>).existing, 'kept');
  assert.equal(result.nodes[0]?.color, theme.colors.primary);
  assert.equal(result.nodes[1]?.color, theme.colors.decision);
  assert.equal(result.nodes[2]?.color, theme.colors.warning);
  assert.equal(result.nodes[3]?.color, '2');
  assert.equal(result.nodes[0]?.styleAttributes?.custom, 'kept');
  assert.equal(result.edges[0]?.styleAttributes?.custom, 'kept');
  assert.equal(((result.metadata as Record<string, unknown>).canvasStudio as Record<string, unknown>).theme, theme.id);
});

test('applies a theme only to selected nodes and internal edges', () => {
  const theme = CANVAS_THEMES[1]!;
  const result = applyCanvasTheme(data, theme, new Set(['start', 'decision']));
  assert.equal(result.nodes[0]?.color, theme.colors.primary);
  assert.equal(result.nodes[1]?.color, theme.colors.decision);
  assert.equal(result.nodes[2]?.color, undefined);
  assert.equal(result.edges[0]?.styleAttributes?.pathfindingMethod, 'square');
  assert.equal(result.edges[1]?.styleAttributes, undefined);
  assert.deepEqual(result.metadata, data.metadata);
});
