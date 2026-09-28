import assert from 'node:assert/strict';
import test from 'node:test';
import { inlineStyleFromPatch, markdownTextSelection, styleTextSelection } from '../src/rich-text';

test('converts supported node styles to inline text styles', () => {
  assert.equal(inlineStyleFromPatch({
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 700,
    textColor: 'var(--text-accent)'
  }), 'font-family: serif; font-size: 24px; font-weight: 700; color: var(--text-accent)');
});

test('wraps only the selected text range', () => {
  assert.equal(
    styleTextSelection('Canvas Studio', 7, 13, { fontSize: 20 }),
    'Canvas <span style="font-size: 20px">Studio</span>'
  );
});

test('rejects invalid ranges and node-only styles', () => {
  assert.equal(styleTextSelection('text', 2, 2, { fontSize: 20 }), null);
  assert.equal(styleTextSelection('text', 0, 4, { textAlign: 'center' }), null);
});

test('wraps selected text with Markdown emphasis markers', () => {
  assert.equal(markdownTextSelection('Canvas Studio', 0, 6, '**'), '**Canvas** Studio');
  assert.equal(markdownTextSelection('Canvas Studio', 7, 13, '*'), 'Canvas *Studio*');
});
