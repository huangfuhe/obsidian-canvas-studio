import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeEdgePresentation, mergeEdgeStyle, mergeNodeStyle, parseCanvasDocument, safeInsertionOrigin, serializeCanvasDocument } from '../src/canvas-data';

test('preserves unknown top-level and node fields through canvas round-trip', () => {
  const source = JSON.stringify({
    customTopLevel: { keep: true },
    nodes: [{ id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 80, text: 'A', futureNodeField: 7 }],
    edges: [],
    metadata: { canvasStudio: { schema: 1 } }
  });
  const data = parseCanvasDocument(source);
  const roundTrip = parseCanvasDocument(serializeCanvasDocument(data));
  assert.deepEqual(roundTrip, data);
  assert.equal((roundTrip.nodes[0] as Record<string, unknown>).futureNodeField, 7);
});

test('merges and removes style attributes without mutating the source node', () => {
  const source = { id: 'a', type: 'text' as const, x: 0, y: 0, width: 100, height: 80, styleAttributes: { fontSize: 16, shape: 'pill' } };
  const updated = mergeNodeStyle(source, { fontSize: 20, shape: null, textAlign: 'center', opacity: 0.6 });
  assert.deepEqual(source.styleAttributes, { fontSize: 16, shape: 'pill' });
  assert.deepEqual(updated.styleAttributes, { fontSize: 20, textAlign: 'center', opacity: 0.6 });
});

test('rejects malformed canvas nodes', () => {
  assert.throws(() => parseCanvasDocument(JSON.stringify({ nodes: [{ id: 'missing-size' }], edges: [] })));
});

test('merges edge styles while preserving unrelated edge fields', () => {
  const edge = { id: 'e', fromNode: 'a', toNode: 'b', label: 'kept', styleAttributes: { path: 'dotted' } };
  assert.deepEqual(mergeEdgeStyle(edge, { path: null, arrow: 'diamond' }), {
    id: 'e', fromNode: 'a', toNode: 'b', label: 'kept', styleAttributes: { arrow: 'diamond' }
  });
});

test('writes edge arrow endpoints at the native edge level', () => {
  const edge = { id: 'e', fromNode: 'a', toNode: 'b', styleAttributes: { path: 'solid' } };
  const result = mergeEdgePresentation(edge, { fromEnd: 'arrow', toEnd: 'none' });
  assert.equal(result.fromEnd, 'arrow');
  assert.equal(result.toEnd, 'none');
  assert.deepEqual(result.styleAttributes, { path: 'solid' });
});

test('places imported structures outside the current canvas bounds', () => {
  const data = parseCanvasDocument(JSON.stringify({
    nodes: [
      { id: 'a', type: 'text', x: -200, y: -80, width: 100, height: 60 },
      { id: 'b', type: 'text', x: 500, y: 40, width: 300, height: 100 }
    ],
    edges: []
  }));
  assert.deepEqual(safeInsertionOrigin(data), { x: 960, y: -80 });
  assert.deepEqual(safeInsertionOrigin(data, true), { x: 1220, y: -80 });
});
