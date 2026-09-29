import assert from 'node:assert/strict';
import test from 'node:test';
import { findCanvasMatches, replaceAllMatches, replaceCurrentMatch } from '../src/search';
import type { CanvasDocument } from '../src/types';

const data: CanvasDocument = {
  nodes: [
    { id: 'a', type: 'text', x: 0, y: 0, width: 100, height: 50, text: 'Canvas canvas' },
    { id: 'b', type: 'text', x: 0, y: 0, width: 100, height: 50, text: '格式和 Canvas' },
    { id: 'c', type: 'file', x: 0, y: 0, width: 100, height: 50, file: 'note.md' },
    { id: 'g', type: 'group', x: 0, y: 0, width: 100, height: 50, label: 'Canvas 泳道' }
  ],
  edges: []
};

test('finds all matches across text nodes with case control', () => {
  assert.equal(findCanvasMatches(data, 'canvas').length, 4);
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
  assert.equal(result.replacements, 4);
  assert.equal(result.data.nodes[0]?.text, 'board board');
  assert.equal(result.data.nodes[1]?.text, '格式和 board');
});

test('does not mutate the source when query is empty', () => {
  const result = replaceAllMatches(data, '', 'x');
  assert.equal(result.replacements, 0);
  assert.equal(result.data, data);
});

test('searches and replaces group labels without changing node text', () => {
  const matches = findCanvasMatches(data, '泳道');
  assert.deepEqual(matches[0], { nodeId: 'g', text: 'Canvas 泳道', index: 7, field: 'label' });
  const result = replaceCurrentMatch(data, matches[0]!, '泳道', '需求方');
  assert.equal(result.nodes[3]?.label, 'Canvas 需求方');
  assert.equal(result.nodes[3]?.text, undefined);
});
