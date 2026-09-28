import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPONENT_LIBRARY, componentsByCategory } from '../src/components';

test('component library has categorized native Canvas components', () => {
  const categories = componentsByCategory();
  assert.equal(COMPONENT_LIBRARY.length, 6);
  assert.equal(categories.get('常用组件')?.length, 4);
  assert.equal(categories.get('容器组件')?.length, 2);
  for (const component of COMPONENT_LIBRARY) {
    let index = 0;
    const canvas = component.build({ x: 100, y: 200 }, (prefix) => `${prefix}-${++index}`);
    assert.ok(canvas.nodes.length > 0, component.id);
    assert.ok(canvas.nodes.every((node) => ['text', 'group'].includes(node.type)), component.id);
    assert.ok(canvas.nodes.every((node) => node.x >= 100 && node.y >= 200), component.id);
  }
});
