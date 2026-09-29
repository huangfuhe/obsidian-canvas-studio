import assert from 'node:assert/strict';
import test from 'node:test';
import { clientPointToCanvas, parseCssTransform, viewportWithOverlayClearance } from '../src/canvas-position';

test('parses canvas CSS zoom transforms', () => {
  assert.deepEqual(parseCssTransform('matrix(2, 0, 0, 1.5, 40, 20)'), { scaleX: 2, scaleY: 1.5 });
  assert.deepEqual(parseCssTransform('matrix3d(2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 50, 70, 0, 1)'), { scaleX: 2, scaleY: 3 });
  assert.deepEqual(parseCssTransform('none'), { scaleX: 1, scaleY: 1 });
});

test('maps a screen drop point into canvas coordinates', () => {
  assert.deepEqual(clientPointToCanvas(440, 320, { left: 40, top: 20 }, { scaleX: 2, scaleY: 2 }), { x: 200, y: 150 });
});

test('shrinks a fitted viewport around center and reserves toolbar clearance', () => {
  const result = viewportWithOverlayClearance(
    { x: 100, y: 200, zoom: 1 },
    { width: 1000, height: 800 },
    64,
    0.9
  );
  assert.equal(result.x, 100);
  assert.ok(Math.abs(result.y - 164.444444444) < 1e-9);
  assert.ok(Math.abs(result.zoom - 0.84799690655495) < 1e-12);
});
