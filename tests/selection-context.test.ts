import assert from 'node:assert/strict';
import test from 'node:test';
import { describeSelectionContext, isContextualActionHidden } from '../src/selection-context';

test('describes canvas, node, edge, and mixed selection contexts', () => {
  assert.deepEqual(describeSelectionContext([], []), { kind: 'canvas', label: '整张画布', count: 0 });
  assert.deepEqual(describeSelectionContext([{ id: 'n', type: 'text', x: 0, y: 0, width: 1, height: 1 }], []), { kind: 'nodes', label: '单个节点', count: 1 });
  assert.deepEqual(describeSelectionContext([], [{ id: 'e', fromNode: 'a', toNode: 'b' }]), { kind: 'edges', label: '连线', count: 1 });
});

test('hides editing actions according to selection context', () => {
  assert.equal(isContextualActionHidden('edge', 'nodes'), true);
  assert.equal(isContextualActionHidden('edge', 'edges'), false);
  assert.equal(isContextualActionHidden('style', 'canvas'), true);
  assert.equal(isContextualActionHidden('text', 'canvas'), false);
});
