import type { CanvasDocument } from './types';

export type CanvasBackground = 'default' | 'plain' | 'cool' | 'warm';
export type CanvasMode = 'free' | 'mindmap' | 'flowchart';

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

export function canvasMode(data: CanvasDocument): CanvasMode {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const studio = metadata?.canvasStudio as Record<string, unknown> | undefined;
  const value = studio?.mode;
  return value === 'mindmap' || value === 'flowchart' ? value : 'free';
}

export function setCanvasMode(data: CanvasDocument, mode: CanvasMode): CanvasDocument {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return { ...data, metadata: { ...metadata, canvasStudio: { ...studio, mode } } };
}

export function canvasPresentationStartNode(data: CanvasDocument): string | null {
  const metadata = data.metadata as Record<string, unknown> | undefined;
  return typeof metadata?.startNode === 'string' ? metadata.startNode : null;
}

export function setCanvasPresentationStartNode(data: CanvasDocument, nodeId: string): CanvasDocument {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  return { ...data, metadata: { ...metadata, startNode: nodeId } };
}
