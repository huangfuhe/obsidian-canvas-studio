import assert from 'node:assert/strict';
import test from 'node:test';
import { snapFragmentIntoGroup, snapNodeIntoGroup } from '../src/group-snap';
import type { CanvasNodeData } from '../src/types';

const group: CanvasNodeData = { id: 'g', type: 'group', x: 100, y: 100, width: 400, height: 300 };

test('clamps a moved node inside the group padding', () => {
  const result = snapNodeIntoGroup({ id: 'n', type: 'text', x: 450, y: 330, width: 100, height: 100, text: 'N' }, [group]);
  assert.equal(result.groupId, 'g');
  assert.deepEqual(result.node, { id: 'n', type: 'text', x: 384, y: 284, width: 100, height: 100, text: 'N' });
});

test('leaves a node outside the group unchanged', () => {
  const node: CanvasNodeData = { id: 'n', type: 'text', x: 700, y: 500, width: 100, height: 100, text: 'N' };
  assert.deepEqual(snapNodeIntoGroup(node, [group]), { node });
});

test('clamps a dropped component fragment to the group bounds', () => {
  const fragment: CanvasNodeData[] = [
    { id: 'a', type: 'text', x: 450, y: 320, width: 180, height: 100, text: 'A' },
    { id: 'b', type: 'text', x: 450, y: 440, width: 180, height: 80, text: 'B' }
  ];
  const result = snapFragmentIntoGroup(fragment, [group], { x: 450, y: 320 });
  assert.equal(result.groupId, 'g');
  assert.deepEqual(result.origin, { x: 304, y: 184 });
});
