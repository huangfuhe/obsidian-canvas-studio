import assert from 'node:assert/strict';
import test from 'node:test';
import { computeMindMapLayout } from '../src/layout';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  nodes: [
    { id: 'root', type: 'text', x: 0, y: 0, width: 100, height: 50 },
    { id: 'child-a', type: 'text', x: 0, y: 0, width: 100, height: 50 },
    { id: 'child-b', type: 'text', x: 0, y: 0, width: 100, height: 50 }
  ],
  edges: [
    { id: 'e-a', fromNode: 'root', toNode: 'child-a' },
    { id: 'e-b', fromNode: 'root', toNode: 'child-b' }
  ]
};

test('lays out children to the right and keeps them separated', () => {
  const result = computeMindMapLayout(data, { rootId: 'root', direction: 'right', gapX: 40, gapY: 20 });
  assert.equal(result.rootId, 'root');
  assert.deepEqual(result.positions.get('root'), { x: 0, y: 0 });
  assert.equal(result.positions.get('child-a')?.x, 140);
  assert.equal(result.positions.get('child-b')?.x, 140);
  assert.equal(result.positions.get('child-b')?.y! - result.positions.get('child-a')?.y!, 70);
  assert.equal(result.diagnostics.length, 0);
});

test('keeps the root anchored and uses node heights for vertical depth', () => {
  const anchored: CanvasDocument = {
    nodes: [
      { id: 'root', type: 'text', x: 50, y: 75, width: 200, height: 100 },
      { id: 'child', type: 'text', x: 0, y: 0, width: 80, height: 40 }
    ],
    edges: [{ id: 'edge', fromNode: 'root', toNode: 'child' }]
  };
  const result = computeMindMapLayout(anchored, { rootId: 'root', direction: 'down', gapY: 30 });
  assert.deepEqual(result.positions.get('root'), { x: 50, y: 75 });
  assert.equal(result.positions.get('child')?.y, 205);
});

test('reports cycles and multiple parents', () => {
  const result = computeMindMapLayout({
    nodes: [
      { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50 },
      { id: 'b', type: 'text', x: 0, y: 0, width: 100, height: 50 },
      { id: 'c', type: 'text', x: 0, y: 0, width: 100, height: 50 }
    ],
    edges: [
      { id: 'ab', fromNode: 'a', toNode: 'b' },
      { id: 'bc', fromNode: 'b', toNode: 'c' },
      { id: 'ac', fromNode: 'a', toNode: 'c' },
      { id: 'ca', fromNode: 'c', toNode: 'a' }
    ]
  }, { rootId: 'a' });
  assert.ok(result.diagnostics.some((item) => item.kind === 'cycle'));
  assert.ok(result.diagnostics.some((item) => item.kind === 'multiple-parent'));
});
