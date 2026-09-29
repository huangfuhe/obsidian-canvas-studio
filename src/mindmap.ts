import type { CanvasDocument } from './types';

const MIND_MAP_ROOT_KEY = 'mindMapRootId';

function studioMetadata(data: CanvasDocument): { metadata: Record<string, unknown>; studio: Record<string, unknown> } {
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {};
  const studio = (metadata.canvasStudio as Record<string, unknown> | undefined) ?? {};
  return { metadata, studio };
}

export function mindMapRootId(data: CanvasDocument): string | null {
  const { studio } = studioMetadata(data);
  const rootId = studio[MIND_MAP_ROOT_KEY];
  return typeof rootId === 'string' && data.nodes.some((node) => node.id === rootId) ? rootId : null;
}

export function setMindMapRoot(data: CanvasDocument, nodeId: string | null): CanvasDocument {
  if (nodeId !== null && !data.nodes.some((node) => node.id === nodeId)) return data;
  const { metadata, studio } = studioMetadata(data);
  const nextStudio = { ...studio };
  if (nodeId === null) delete nextStudio[MIND_MAP_ROOT_KEY];
  else nextStudio[MIND_MAP_ROOT_KEY] = nodeId;
  return { ...data, metadata: { ...metadata, canvasStudio: nextStudio } };
}
