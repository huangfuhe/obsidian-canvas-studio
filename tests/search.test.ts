import assert from 'node:assert/strict';
import test from 'node:test';
import { findCanvasMatches, replaceAllMatches, replaceCurrentMatch } from '../src/search';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  nodes: [
    { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50, text: 'Canvas canvas' },
    { id: 'b', type: 'text', x: 0, y: 0, width: 100, height: 50, text: '格式和 Canvas' },
    { id: 'c', type: 'file', x: 0, y: 0, width: 100, height: 50, file: 'note.md' }
  ],
  edges: []
};

test('finds all matches across text nodes with case control', () => {
  assert.equal(findCanvasMatches(data, 'canvas').length, 3);
  assert.equal(findCanvasMatches(data, 'canvas', true).length, 1);
  assert.deepEqual(findCanvasMatches(data, 'canvas')[0], { nodeId: 'a', text: 'Canvas canvas', index: 0 });
});

test('replaces one selected match without touching unrelated nodes', () => {
  const match = findCanvasMatches(data, 'canvas')[1]!;
  const result = replaceCurrentMatch(data, match, 'canvas', 'Canvas Studio');
  assert.equal(result.nodes[0]?.text, 'Canvas Canvas Studio');
  assert.equal(result.nodes[1]?.text, '格式和 Canvas');
});

test('replaces all matches and reports replacement count', () => {
  const result = replaceAllMatches(data, 'canvas', 'board');
  assert.equal(result.replacements, 3);
  assert.equal(result.data.nodes[0]?.text, 'board board');
  assert.equal(result.data.nodes[1]?.text, '格式和 board');
});

test('does not mutate the source when query is empty', () => {
  const result = replaceAllMatches(data, '', 'x');
  assert.equal(result.replacements, 0);
  assert.equal(result.data, data);
});
