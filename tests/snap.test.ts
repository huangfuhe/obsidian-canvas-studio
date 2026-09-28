import assert from 'node:assert/strict';
import test from 'node:test';
import { snapNodePosition } from '../src/snap';

test('snaps to the grid when no nearby node alignment is closer', () => {
  const result = snapNodePosition(
    { id: 'a', type: 'text', x: 43, y: 58, width: 100, height: 60 },
    [],
    { gridSize: 20, threshold: 5 }
  );
  assert.deepEqual(result, { x: 40, y: 60, guideX: 40, guideY: 60 });
});

test('snaps node centers and edges to nearby nodes', () => {
  const result = snapNodePosition(
    { id: 'moving', type: 'text', x: 204, y: 98, width: 100, height: 60 },
    [{ id: 'target', type: 'text', x: 0, y: 100, width: 100, height: 60 }],
    { gridSize: 20, threshold: 8 }
  );
  assert.equal(result.x, 200);
  assert.equal(result.y, 100);
  assert.equal(result.guideY, 100);
});

test('leaves positions unchanged outside the threshold', () => {
  const result = snapNodePosition(
    { id: 'moving', type: 'text', x: 109, y: 109, width: 100, height: 60 },
    [],
    { gridSize: 20, threshold: 5 }
  );
  assert.deepEqual(result, { x: 109, y: 109 });
});
