import assert from 'node:assert/strict';
import test from 'node:test';
import { clientPointToCanvas, parseCssTransform } from '../src/canvas-position';

test('parses canvas CSS zoom transforms', () => {
  assert.deepEqual(parseCssTransform('matrix(2, 0, 0, 1.5, 40, 20)'), { scaleX: 2, scaleY: 1.5 });
  assert.deepEqual(parseCssTransform('matrix3d(2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 50, 70, 0, 1)'), { scaleX: 2, scaleY: 3 });
  assert.deepEqual(parseCssTransform('none'), { scaleX: 1, scaleY: 1 });
});

test('maps a screen drop point into canvas coordinates', () => {
  assert.deepEqual(clientPointToCanvas(440, 320, { left: 40, top: 20 }, { scaleX: 2, scaleY: 2 }), { x: 200, y: 150 });
});
