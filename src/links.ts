import type { CanvasNodeData } from './types';

export function normalizeLinkUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!url.protocol) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function createLinkNode(
  id: string,
  url: string,
  origin: { x: number; y: number },
  label?: string
): CanvasNodeData {
  return {
    id,
    type: 'link',
    x: origin.x,
    y: origin.y,
    width: 360,
    height: 120,
    url,
    text: label?.trim() || url
  };
}
