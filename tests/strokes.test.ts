import assert from 'node:assert/strict';
import test from 'node:test';
import { addCanvasStroke, canvasStrokes, clearCanvasStrokes, removeLastCanvasStroke, removeStrokeNearPoint } from '../src/strokes';
import type { CanvasDocument } from '../src/types';

test('persists strokes in optional Canvas Studio metadata', () => {
  const data: CanvasDocument = { metadata: { keep: true }, nodes: [], edges: [] };
  const result = addCanvasStroke(data, { id: 'stroke-1', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }], width: 3 });
  assert.deepEqual(canvasStrokes(result), [{ id: 'stroke-1', points: [{ x: 1, y: 2 }, { x: 3, y: 4 }], width: 3 }]);
  assert.equal((result.metadata as Record<string, unknown>).keep, true);
});

test('clears strokes without removing other metadata', () => {
  const data = addCanvasStroke({ metadata: { keep: true }, nodes: [], edges: [] }, { id: 's', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
  const cleared = clearCanvasStrokes(data);
  assert.deepEqual(canvasStrokes(cleared), []);
  assert.equal((cleared.metadata as Record<string, unknown>).keep, true);
});

test('removes only the latest stroke', () => {
  const first = addCanvasStroke({ nodes: [], edges: [] }, { id: 'a', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] });
  const second = addCanvasStroke(first, { id: 'b', points: [{ x: 2, y: 2 }, { x: 3, y: 3 }] });
  assert.deepEqual(canvasStrokes(removeLastCanvasStroke(second)).map((stroke) => stroke.id), ['a']);
  assert.equal(removeLastCanvasStroke({ nodes: [], edges: [] }).nodes.length, 0);
});

test('erases the nearest stroke within tolerance', () => {
  const first = addCanvasStroke({ nodes: [], edges: [] }, { id: 'a', points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], width: 4 });
  const second = addCanvasStroke(first, { id: 'b', points: [{ x: 0, y: 50 }, { x: 100, y: 50 }], width: 4 });
  assert.deepEqual(canvasStrokes(removeStrokeNearPoint(second, { x: 40, y: 7 }, 6)).map((stroke) => stroke.id), ['b']);
  assert.equal(removeStrokeNearPoint(second, { x: 40, y: 25 }, 4), second);
});
