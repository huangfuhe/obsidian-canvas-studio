import type { CanvasNodeData } from './types';

export type BasicTextKind = 'text' | 'sticky-note';

export function createBasicTextNode(
  id: string,
  kind: BasicTextKind,
  origin: { x: number; y: number },
  fontFamily = 'sans-serif',
  fontSize = 16
): CanvasNodeData {
  if (kind === 'sticky-note') {
    return {
      id,
      type: 'text',
      x: origin.x,
      y: origin.y,
      width: 260,
      height: 180,
      text: '便签',
      color: '3',
      styleAttributes: {
        shape: 'rectangle',
        fontFamily,
        fontSize,
        padding: 16
      }
    };
  }
  return {
    id,
    type: 'text',
    x: origin.x,
    y: origin.y,
    width: 280,
    height: 120,
    text: '输入文本',
    styleAttributes: { fontFamily, fontSize, padding: 12 }
  };
}
