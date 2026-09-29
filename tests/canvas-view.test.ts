import assert from 'node:assert/strict';
import test from 'node:test';
import { canvasGridEnabled, setCanvasGrid } from '../src/canvas-view';
import type { CanvasDocument } from '../src/types';

test('persists the canvas grid flag without dropping metadata', () => {
  const data: CanvasDocument = { metadata: { keep: true, canvasStudio: { theme: 'clear-work' } }, nodes: [], edges: [] };
  const enabled = setCanvasGrid(data, true);
  assert.equal(canvasGridEnabled(enabled), true);
  assert.equal((enabled.metadata as Record<string, unknown>).keep, true);
  assert.equal(((enabled.metadata as Record<string, unknown>).canvasStudio as Record<string, unknown>).theme, 'clear-work');
  assert.deepEqual(setCanvasGrid(enabled, false).metadata, {
    keep: true,
    canvasStudio: { theme: 'clear-work', grid: false }
  });
});
