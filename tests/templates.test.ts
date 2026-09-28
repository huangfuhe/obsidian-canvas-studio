import assert from 'node:assert/strict';
import test from 'node:test';
import { FLOW_TEMPLATES, instantiateFlowTemplate } from '../src/templates';

function overlaps(a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('all declarative flow templates generate valid non-overlapping canvases', () => {
  for (const template of FLOW_TEMPLATES) {
    let index = 0;
    const canvas = instantiateFlowTemplate(template, {
      origin: { x: 500, y: 100 },
      idFactory: (prefix) => `${prefix}-${++index}`
    });
    const ids = new Set(canvas.nodes.map((node) => node.id));
    assert.equal(ids.size, canvas.nodes.length, template.id);
    assert.equal(canvas.edges.length, template.edges.length, template.id);
    assert.ok(canvas.edges.every((edge) => ids.has(edge.fromNode) && ids.has(edge.toNode)), template.id);
    for (let left = 0; left < canvas.nodes.length; left++) {
      for (let right = left + 1; right < canvas.nodes.length; right++) {
        assert.equal(overlaps(canvas.nodes[left]!, canvas.nodes[right]!), false, `${template.id}: ${left}/${right}`);
      }
    }
  }
});

test('centers every tier around the template origin', () => {
  let index = 0;
  const template = FLOW_TEMPLATES.find((item) => item.id === 'decision-branch')!;
  const canvas = instantiateFlowTemplate(template, {
    origin: { x: 600, y: 40 },
    idFactory: (prefix) => `${prefix}-${++index}`
  });
  const first = canvas.nodes[0]!;
  assert.equal(first.x + first.width / 2, 600);
  const branchNodes = canvas.nodes.filter((node) => node.text === '执行处理' || node.text === '返回错误');
  assert.equal(branchNodes.length, 2);
  const minX = Math.min(...branchNodes.map((node) => node.x));
  const maxX = Math.max(...branchNodes.map((node) => node.x + node.width));
  assert.equal((minX + maxX) / 2, 600);
});
