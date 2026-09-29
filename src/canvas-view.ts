import type { CanvasDocument } from './types';

export function canvasGridEnabled(data: CanvasDocument): boolean {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const studio = metadata?.canvasStudio as Record<string, unknown> | undefined;
  return studio?.grid === true;
}

export function setCanvasGrid(data: CanvasDocument, enabled: boolean): CanvasDocument {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    metadata: { ...metadata, canvasStudio: { ...studio, grid: enabled } }
  };
}
