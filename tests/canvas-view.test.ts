import assert from 'node:assert/strict';
import test from 'node:test';
import { canvasBackground, canvasGridEnabled, setCanvasBackground, setCanvasGrid } from '../src/canvas-view';
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

test('persists a canvas background preset alongside the grid flag', () => {
  const data: CanvasDocument = { nodes: [], edges: [] };
  const result = setCanvasBackground(setCanvasGrid(data, true), 'cool');
  assert.equal(canvasBackground(result), 'cool');
  assert.equal(canvasGridEnabled(result), true);
});
