import assert from 'node:assert/strict';
import test from 'node:test';
import { createBasicTextNode, createShapeNode } from '../src/basic-nodes';

test('creates a native editable text card', () => {
  const node = createBasicTextNode('text-1', 'text', { x: 100, y: 200 }, 'serif', 18);
  assert.equal(node.type, 'text');
  assert.equal(node.text, '输入文本');
  assert.equal(node.styleAttributes?.fontFamily, 'serif');
  assert.equal(node.styleAttributes?.fontSize, 18);
});

test('creates a yellow native sticky note', () => {
  const node = createBasicTextNode('note-1', 'sticky-note', { x: 20, y: 40 });
  assert.equal(node.type, 'text');
  assert.equal(node.color, '3');
  assert.equal(node.styleAttributes?.padding, 16);
  assert.equal(node.width, 260);
  assert.equal(node.height, 180);
});

test('creates a native flowchart shape without an existing selection', () => {
  const node = createShapeNode('shape-1', 'diamond', { x: 10, y: 20 }, 'sans-serif', 16);
  assert.equal(node.type, 'text');
  assert.equal(node.styleAttributes?.shape, 'diamond');
  assert.equal(node.width, 340);
  assert.equal(node.height, 180);
  assert.equal(node.text, '新建形状');
});
