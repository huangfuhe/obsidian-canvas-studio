import type { CanvasNodeData } from './types';

export interface SnapOptions {
  gridSize: number;
  threshold: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guideX?: number;
  guideY?: number;
}

function closest(current: number, candidates: Array<{ value: number; guide: number }>, threshold: number) {
  let match: { value: number; guide: number } | undefined;
  let distance = threshold + 1;
  for (const candidate of candidates) {
    const nextDistance = Math.abs(candidate.value - current);
    if (nextDistance <= threshold && nextDistance < distance) {
      match = candidate;
      distance = nextDistance;
    }
  }
  return match;
}

export function snapNodePosition(
  moving: CanvasNodeData,
  others: CanvasNodeData[],
  options: SnapOptions
): SnapResult {
  const xCandidates = [{
    value: Math.round(moving.x / options.gridSize) * options.gridSize,
    guide: Math.round(moving.x / options.gridSize) * options.gridSize
  }];
  const yCandidates = [{
    value: Math.round(moving.y / options.gridSize) * options.gridSize,
    guide: Math.round(moving.y / options.gridSize) * options.gridSize
  }];
  const movingXOffsets = [0, moving.width / 2, moving.width];
  const movingYOffsets = [0, moving.height / 2, moving.height];

  for (const node of others) {
    const targetX = [node.x, node.x + node.width / 2, node.x + node.width];
    const targetY = [node.y, node.y + node.height / 2, node.y + node.height];
    for (const target of targetX) {
      for (const offset of movingXOffsets) xCandidates.push({ value: target - offset, guide: target });
    }
    for (const target of targetY) {
      for (const offset of movingYOffsets) yCandidates.push({ value: target - offset, guide: target });
    }
  }

  const snapX = closest(moving.x, xCandidates, options.threshold);
  const snapY = closest(moving.y, yCandidates, options.threshold);
  return {
    x: snapX?.value ?? moving.x,
    y: snapY?.value ?? moving.y,
    ...(snapX ? { guideX: snapX.guide } : {}),
    ...(snapY ? { guideY: snapY.guide } : {})
  };
}
