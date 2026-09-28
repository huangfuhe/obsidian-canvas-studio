import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyMediaPath, filterMediaItems, mediaItemsFromPaths } from '../src/media';

test('classifies vault media paths', () => {
  assert.equal(classifyMediaPath('assets/photo.png'), 'image');
  assert.equal(classifyMediaPath('assets/icon.svg'), 'vector');
  assert.equal(classifyMediaPath('assets/spec.pdf'), 'pdf');
  assert.equal(classifyMediaPath('notes/readme.md'), 'file');
  assert.equal(classifyMediaPath('assets/video.mov'), 'file');
  assert.equal(classifyMediaPath('data/config.json'), 'file');
  assert.equal(classifyMediaPath('notes/data.bin'), null);
});

test('filters media by query and kind', () => {
  const items = mediaItemsFromPaths(['a/photo.png', 'b/icon.svg', 'c/spec.pdf', 'd/readme.md']);
  assert.deepEqual(filterMediaItems(items, 'photo').map((item) => item.path), ['a/photo.png']);
  assert.deepEqual(filterMediaItems(items, '', 'vector').map((item) => item.path), ['b/icon.svg']);
});
