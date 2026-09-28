import assert from 'node:assert/strict';
import test from 'node:test';
import { performance } from 'node:perf_hooks';
import { computeMindMapLayout } from '../src/layout';
import type { CanvasDocument } from '../src/types';

function linearCanvas(size: number): CanvasDocument {
  return {
    nodes: Array.from({ length: size }, (_, index) => ({
      id: `node-${index}`,
      type: 'text' as const,
      x: 0,
      y: 0,
      width: 240,
      height: 80
    })),
    edges: Array.from({ length: size - 1 }, (_, index) => ({
      id: `edge-${index}`,
      fromNode: `node-${index}`,
      toNode: `node-${index + 1}`
    }))
  };
}

test('lays out 100 nodes within the P0 performance budget', () => {
  const start = performance.now();
  const result = computeMindMapLayout(linearCanvas(100), { rootId: 'node-0' });
  const elapsed = performance.now() - start;
  assert.equal(result.positions.size, 100);
  assert.ok(elapsed < 100, `100-node layout took ${elapsed.toFixed(1)} ms`);
});

test('lays out 500 nodes without stack or latency failure', () => {
  const start = performance.now();
  const result = computeMindMapLayout(linearCanvas(500), { rootId: 'node-0' });
  const elapsed = performance.now() - start;
  assert.equal(result.positions.size, 500);
  assert.ok(elapsed < 1500, `500-node layout took ${elapsed.toFixed(1)} ms`);
});
