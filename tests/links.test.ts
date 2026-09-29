import assert from 'node:assert/strict';
import test from 'node:test';
import { createLinkNode, normalizeLinkUrl } from '../src/links';

test('normalizes web and Obsidian URLs', () => {
  assert.equal(normalizeLinkUrl('example.com/docs'), 'https://example.com/docs');
  assert.equal(normalizeLinkUrl('obsidian://open?vault=Demo'), 'obsidian://open?vault=Demo');
  assert.equal(normalizeLinkUrl('mailto:team@example.com'), 'mailto:team@example.com');
  assert.equal(normalizeLinkUrl(''), null);
});

test('creates a native Canvas link node', () => {
  assert.deepEqual(createLinkNode('link-1', 'https://example.com', { x: 20, y: 40 }, '文档'), {
    id: 'link-1',
    type: 'link',
    x: 20,
    y: 40,
    width: 360,
    height: 120,
    url: 'https://example.com',
    text: '文档'
  });
});
