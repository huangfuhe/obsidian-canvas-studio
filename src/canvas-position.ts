export interface CanvasTransform {
  scaleX: number;
  scaleY: number;
}

export interface CanvasSurfaceRect {
  left: number;
  top: number;
}

export function parseCssTransform(transform: string | null | undefined): CanvasTransform {
  if (!transform || transform === 'none') return { scaleX: 1, scaleY: 1 };
  const matrix = transform.match(/^matrix\(([^)]+)\)$/);
  if (matrix) {
    const values = matrix[1]?.split(',').map(Number) ?? [];
    const scaleX = Math.abs(values[0] ?? 1);
    const scaleY = Math.abs(values[3] ?? 1);
    return { scaleX: scaleX || 1, scaleY: scaleY || 1 };
  }
  const matrix3d = transform.match(/^matrix3d\(([^)]+)\)$/);
  if (matrix3d) {
    const values = matrix3d[1]?.split(',').map(Number) ?? [];
    const scaleX = Math.abs(values[0] ?? 1);
    const scaleY = Math.abs(values[5] ?? 1);
    return { scaleX: scaleX || 1, scaleY: scaleY || 1 };
  }
  return { scaleX: 1, scaleY: 1 };
}

export function clientPointToCanvas(
  clientX: number,
  clientY: number,
  rect: CanvasSurfaceRect,
  transform: CanvasTransform = { scaleX: 1, scaleY: 1 }
): { x: number; y: number } {
  return {
    x: (clientX - rect.left) / (transform.scaleX || 1),
    y: (clientY - rect.top) / (transform.scaleY || 1)
  };
}

export function canvasPointToClient(
  point: { x: number; y: number },
  rect: CanvasSurfaceRect,
  transform: CanvasTransform = { scaleX: 1, scaleY: 1 }
): { x: number; y: number } {
  return {
    x: rect.left + point.x * (transform.scaleX || 1),
    y: rect.top + point.y * (transform.scaleY || 1)
  };
}
