import assert from 'node:assert/strict';
import test from 'node:test';
import { adjustSelectedTextNodeLayout } from '../src/text-fit';
import type { CanvasDocument } from '../src/types';

function documentWithNodes(...nodes: CanvasDocument['nodes']): CanvasDocument {
  return { nodes, edges: [] };
}

test('fits selected nodes horizontally and preserves their original gaps', () => {
  const data = documentWithNodes(
    { id: 'a', type: 'text', x: 0, y: 10, width: 100, height: 40, text: 'A' },
    { id: 'b', type: 'text', x: 140, y: 20, width: 80, height: 40, text: 'B' },
    { id: 'outside', type: 'text', x: 500, y: 30, width: 60, height: 40, text: 'O' }
  );
  const result = adjustSelectedTextNodeLayout(
    data,
    new Set(['a', 'b']),
    new Map([
      ['a', { width: 160 }],
      ['b', { width: 40 }]
    ]),
    'horizontal'
  );

  assert.deepEqual(result.nodes[0], { id: 'a', type: 'text', x: 0, y: 10, width: 160, height: 40, text: 'A' });
  assert.deepEqual(result.nodes[1], { id: 'b', type: 'text', x: 200, y: 20, width: 40, height: 40, text: 'B' });
  assert.deepEqual(result.nodes[2], data.nodes[2]);
});

test('fits selected nodes vertically, removes old overlap, and keeps order stable for ties', () => {
  const data = documentWithNodes(
    { id: 'first', type: 'text', x: 10, y: 0, width: 100, height: 80, text: '1' },
    { id: 'tie-a', type: 'text', x: 30, y: 100, width: 100, height: 40, text: '2' },
    { id: 'tie-b', type: 'text', x: 40, y: 100, width: 100, height: 40, text: '3' }
  );
  const result = adjustSelectedTextNodeLayout(
    data,
    new Set(['tie-b', 'first', 'tie-a']),
    new Map([
      ['first', { height: 140 }],
      ['tie-a', { height: 20 }],
      ['tie-b', { height: 60 }]
    ]),
    'vertical'
  );

  assert.equal(result.nodes[0]?.y, 0);
  assert.equal(result.nodes[0]?.height, 140);
  assert.equal(result.nodes[1]?.y, 160);
  assert.equal(result.nodes[1]?.height, 20);
  assert.equal(result.nodes[2]?.y, 180);
  assert.equal(result.nodes[2]?.height, 60);
  assert.equal(result.nodes[1]?.x, data.nodes[1]?.x);
  assert.equal(result.nodes[2]?.x, data.nodes[2]?.x);
});

test('keeps independent vertical columns independent', () => {
  const data = documentWithNodes(
    { id: 'a1', type: 'text', x: 0, y: 0, width: 100, height: 40, text: 'a1' },
    { id: 'b1', type: 'text', x: 300, y: 0, width: 100, height: 40, text: 'b1' },
    { id: 'a2', type: 'text', x: 0, y: 100, width: 100, height: 40, text: 'a2' },
    { id: 'b2', type: 'text', x: 300, y: 100, width: 100, height: 40, text: 'b2' }
  );
  const result = adjustSelectedTextNodeLayout(
    data,
    new Set(data.nodes.map((node) => node.id)),
    new Map([['a1', { height: 80 }], ['b1', { height: 80 }], ['a2', { height: 40 }], ['b2', { height: 40 }]]),
    'vertical'
  );

  assert.equal(result.nodes[2]?.y, 140);
  assert.equal(result.nodes[3]?.y, 140);
});

test('does not pull later nodes upward when a fitted node becomes shorter', () => {
  const data = documentWithNodes(
    { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 100, text: 'A' },
    { id: 'b', type: 'text', x: 0, y: 140, width: 100, height: 40, text: 'B' }
  );
  const result = adjustSelectedTextNodeLayout(data, new Set(['a', 'b']), new Map([['a', { height: 40 }], ['b', { height: 40 }]]), 'vertical');
  assert.equal(result.nodes[1]?.y, 140);
});

test('is idempotent when the same measurements are applied again', () => {
  const data = documentWithNodes(
    { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 40, text: 'A' },
    { id: 'b', type: 'text', x: 0, y: 100, width: 100, height: 40, text: 'B' }
  );
  const sizes = new Map([['a', { height: 80 }], ['b', { height: 40 }]]);
  const once = adjustSelectedTextNodeLayout(data, new Set(['a', 'b']), sizes, 'vertical');
  const twice = adjustSelectedTextNodeLayout(once, new Set(['a', 'b']), sizes, 'vertical');
  assert.deepEqual(twice, once);
});

test('ignores unselected and non-text nodes and leaves invalid measurements unchanged', () => {
  const data = documentWithNodes(
    { id: 'text', type: 'text', x: 0, y: 0, width: 100, height: 40, text: 'text' },
    { id: 'file', type: 'file', x: 100, y: 0, width: 100, height: 40, file: 'note.md' },
    { id: 'other', type: 'text', x: 220, y: 0, width: 100, height: 40, text: 'other' }
  );
  const result = adjustSelectedTextNodeLayout(
    data,
    new Set(['text', 'file']),
    new Map([['text', { height: Number.NaN, width: -1 }]]),
    'vertical'
  );

  assert.deepEqual(result, data);
});
