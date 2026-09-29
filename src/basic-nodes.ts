import type { CanvasNodeData } from './types';

export type BasicTextKind = 'text' | 'sticky-note';

export type BasicShape = 'rectangle' | 'pill' | 'diamond' | 'parallelogram' | 'circle' | 'predefined-process' | 'document' | 'database';

export function fittedTextNodeHeight(contentHeight: number, minimum = 80, chrome = 16): number {
  if (!Number.isFinite(contentHeight) || contentHeight < 0) return minimum;
  return Math.max(minimum, Math.ceil(contentHeight + chrome));
}

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

export function createShapeNode(
  id: string,
  shape: BasicShape,
  origin: { x: number; y: number },
  fontFamily = 'sans-serif',
  fontSize = 16
): CanvasNodeData {
  const size = shape === 'diamond'
    ? { width: 340, height: 180 }
    : shape === 'circle'
      ? { width: 220, height: 220 }
      : shape === 'pill'
        ? { width: 240, height: 96 }
        : shape === 'document' || shape === 'database'
          ? { width: 280, height: 120 }
          : { width: 280, height: 96 };
  return {
    id,
    type: 'text',
    x: origin.x,
    y: origin.y,
    ...size,
    text: '新建形状',
    styleAttributes: {
      shape: shape === 'rectangle' ? undefined : shape,
      fontFamily,
      fontSize,
      textAlign: 'center',
      padding: shape === 'diamond' ? 32 : 12
    }
  };
}
