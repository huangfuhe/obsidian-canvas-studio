import type { CanvasDocument } from './types';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  id: string;
  points: StrokePoint[];
  color?: string;
  width?: number;
}

const STROKES_KEY = 'strokes';

export function canvasStrokes(data: CanvasDocument): CanvasStroke[] {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const studio = metadata?.canvasStudio as Record<string, unknown> | undefined;
  const raw = studio?.[STROKES_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const stroke = item as Partial<CanvasStroke>;
    if (typeof stroke.id !== 'string' || !Array.isArray(stroke.points)) return [];
    const points = stroke.points.filter((point): point is StrokePoint => typeof point === 'object'
      && point !== null
      && typeof (point as StrokePoint).x === 'number'
      && typeof (point as StrokePoint).y === 'number');
    return points.length >= 2 ? [{ id: stroke.id, points, ...(stroke.color ? { color: stroke.color } : {}), ...(stroke.width ? { width: stroke.width } : {}) }] : [];
  });
}

export function addCanvasStroke(data: CanvasDocument, stroke: CanvasStroke): CanvasDocument {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    metadata: {
      ...metadata,
      canvasStudio: { ...studio, [STROKES_KEY]: [...canvasStrokes(data), stroke] }
    }
  };
}

export function clearCanvasStrokes(data: CanvasDocument): CanvasDocument {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    metadata: { ...metadata, canvasStudio: { ...studio, [STROKES_KEY]: [] } }
  };
}

export function removeLastCanvasStroke(data: CanvasDocument): CanvasDocument {
  const strokes = canvasStrokes(data);
  if (strokes.length === 0) return data;
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    metadata: { ...metadata, canvasStudio: { ...studio, [STROKES_KEY]: strokes.slice(0, -1) } }
  };
}

function distanceToSegment(point: StrokePoint, start: StrokePoint, end: StrokePoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

export function removeStrokeNearPoint(
  data: CanvasDocument,
  point: StrokePoint,
  tolerance = 12
): CanvasDocument {
  const strokes = canvasStrokes(data);
  const index = strokes.findIndex((stroke) => stroke.points.some((start, pointIndex) => {
    const end = stroke.points[pointIndex + 1];
    return end && distanceToSegment(point, start, end) <= tolerance + (stroke.width ?? 3) / 2;
  }));
  if (index < 0) return data;
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    metadata: { ...metadata, canvasStudio: { ...studio, [STROKES_KEY]: strokes.filter((_, strokeIndex) => strokeIndex !== index) } }
  };
}
