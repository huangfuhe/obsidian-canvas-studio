import assert from 'node:assert/strict';
import test from 'node:test';
import { instantiateSwimlane, SWIMLANE_TEMPLATES } from '../src/swimlane';

test('generates non-overlapping lanes with contained steps', () => {
  let index = 0;
  const canvas = instantiateSwimlane(SWIMLANE_TEMPLATES[0]!, {
    origin: { x: 100, y: 200 },
    idFactory: (prefix) => `${prefix}-${++index}`
  });
  const lanes = canvas.nodes.filter((node) => node.type === 'group');
  const steps = canvas.nodes.filter((node) => node.type === 'text');
  assert.equal(lanes.length, 3);
  assert.equal(steps.length, 5);
  assert.equal(canvas.edges.length, 4);
  for (let left = 0; left < lanes.length; left++) {
    for (let right = left + 1; right < lanes.length; right++) {
      assert.ok(lanes[left]!.x + lanes[left]!.width < lanes[right]!.x);
    }
  }
  for (const step of steps) {
    assert.ok(lanes.some((lane) => step.x >= lane.x
      && step.x + step.width <= lane.x + lane.width
      && step.y >= lane.y
      && step.y + step.height <= lane.y + lane.height));
  }
});

test('uses outward edge anchors for forward and backward lane transitions', () => {
  let index = 0;
  const canvas = instantiateSwimlane(SWIMLANE_TEMPLATES[0]!, {
    origin: { x: 0, y: 0 },
    idFactory: (prefix) => `${prefix}-${++index}`
  });
  const forward = canvas.edges[0]!;
  const backward = canvas.edges[2]!;
  assert.deepEqual([forward.fromSide, forward.toSide], ['right', 'left']);
  assert.deepEqual([backward.fromSide, backward.toSide], ['left', 'right']);
});

test('supports row-oriented swimlanes with semantic axis metadata', () => {
  let index = 0;
  const template = SWIMLANE_TEMPLATES.find((candidate) => candidate.orientation === 'rows');
  assert.ok(template);
  const canvas = instantiateSwimlane(template, {
    origin: { x: 100, y: 200 },
    idFactory: (prefix) => `${prefix}-${++index}`
  });
  const lanes = canvas.nodes.filter((node) => node.type === 'group');
  const steps = canvas.nodes.filter((node) => node.type === 'text');
  assert.equal(lanes.length, 3);
  assert.ok(lanes[0]!.x === lanes[1]!.x && lanes[1]!.x === lanes[2]!.x);
  assert.ok(lanes[0]!.y < lanes[1]!.y && lanes[1]!.y < lanes[2]!.y);
  assert.ok(lanes.every((lane) => lane.styleAttributes?.canvasStudioLaneAxis === 'row'));
  for (const step of steps) {
    assert.ok(lanes.some((lane) => step.x >= lane.x
      && step.x + step.width <= lane.x + lane.width
      && step.y >= lane.y
      && step.y + step.height <= lane.y + lane.height));
  }
  assert.deepEqual([canvas.edges[0]?.fromSide, canvas.edges[0]?.toSide], ['bottom', 'top']);
});
