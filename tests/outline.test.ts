import assert from 'node:assert/strict';
import test from 'node:test';
import { outlineToCanvas, parseMarkdownOutline } from '../src/outline';

function idFactory(): (prefix: string) => string {
  let index = 0;
  return (prefix) => `${prefix}-${++index}`;
}

test('parses heading hierarchy and nested lists', () => {
  const outline = parseMarkdownOutline(`
# 项目
## 目标
- 完成核心功能
  - 保持 canvas 格式
- 通过兼容测试
## 风险
1. 内部 API 变化
2. 样式冲突
`);
  assert.equal(outline.length, 1);
  assert.equal(outline[0]?.text, '项目');
  assert.deepEqual(outline[0]?.children.map((item) => item.text), ['目标', '风险']);
  assert.equal(outline[0]?.children[0]?.children[0]?.children[0]?.text, '保持 canvas 格式');
  assert.deepEqual(outline[0]?.children[1]?.children.map((item) => item.text), ['内部 API 变化', '样式冲突']);
});

test('creates a connected canvas tree anchored at the requested origin', () => {
  const outline = parseMarkdownOutline('# 根\n## 分支 A\n- 子项\n## 分支 B');
  const canvas = outlineToCanvas(outline, {
    direction: 'right',
    origin: { x: 120, y: 80 },
    idFactory: idFactory()
  });
  assert.equal(canvas.nodes.length, 4);
  assert.equal(canvas.edges.length, 3);
  assert.deepEqual({ x: canvas.nodes[0]?.x, y: canvas.nodes[0]?.y }, { x: 120, y: 80 });
  assert.equal(new Set(canvas.nodes.map((node) => node.id)).size, canvas.nodes.length);
  assert.ok(canvas.edges.every((edge) => canvas.nodes.some((node) => node.id === edge.fromNode)));
  assert.ok(canvas.edges.every((edge) => canvas.nodes.some((node) => node.id === edge.toNode)));
});

test('adds a synthetic root for multiple top-level items', () => {
  const canvas = outlineToCanvas(parseMarkdownOutline('- A\n- B'), {
    direction: 'down',
    origin: { x: 0, y: 0 },
    idFactory: idFactory(),
    syntheticRootText: '列表'
  });
  assert.equal(canvas.nodes[0]?.text, '列表');
  assert.equal(canvas.nodes.length, 3);
  assert.equal(canvas.edges.length, 2);
});

test('rejects empty and oversized outlines', () => {
  assert.throws(() => outlineToCanvas([], {
    direction: 'right', origin: { x: 0, y: 0 }, idFactory: idFactory()
  }));
  const oversized = Array.from({ length: 4 }, (_, index) => ({ text: String(index), children: [] }));
  assert.throws(() => outlineToCanvas(oversized, {
    direction: 'right', origin: { x: 0, y: 0 }, idFactory: idFactory(), maxNodes: 3
  }));
});
