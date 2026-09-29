import type { CanvasDocument } from './types';

export type CanvasBackground = 'default' | 'plain' | 'cool' | 'warm';

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

export function canvasBackground(data: CanvasDocument): CanvasBackground {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const studio = metadata?.canvasStudio as Record<string, unknown> | undefined;
  const value = studio?.background;
  return value === 'plain' || value === 'cool' || value === 'warm' ? value : 'default';
}

export function setCanvasBackground(data: CanvasDocument, background: CanvasBackground): CanvasDocument {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return {
    ...data,
    metadata: { ...metadata, canvasStudio: { ...studio, background } }
  };
}
