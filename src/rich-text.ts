import type { CanvasStyleAttributes } from './types';

export interface TextSelectionSnapshot {
  nodeId: string;
  from: number;
  to: number;
  sourceText: string;
}

function safeStyleValue(value: unknown): string {
  return String(value).replace(/[;"<>]/g, '').trim();
}

export function inlineStyleFromPatch(patch: CanvasStyleAttributes): string | null {
  const declarations: string[] = [];
  const add = (property: string, value: unknown, suffix = '') => {
    if (value === null || value === undefined || value === '') return;
    declarations.push(`${property}: ${safeStyleValue(value)}${suffix}`);
  };
  add('font-family', patch.fontFamily);
  add('font-size', patch.fontSize, 'px');
  add('font-weight', patch.fontWeight);
  add('font-style', patch.fontStyle);
  add('text-decoration', patch.textDecoration);
  add('color', patch.textColor);
  add('line-height', patch.lineHeight);
  return declarations.length > 0 ? declarations.join('; ') : null;
}

export function styleTextSelection(
  sourceText: string,
  from: number,
  to: number,
  patch: CanvasStyleAttributes
): string | null {
  if (from < 0 || to <= from || to > sourceText.length) return null;
  const style = inlineStyleFromPatch(patch);
  if (!style) return null;
  return `${sourceText.slice(0, from)}<span style="${style}">${sourceText.slice(from, to)}</span>${sourceText.slice(to)}`;
}

export function markdownTextSelection(
  sourceText: string,
  from: number,
  to: number,
  marker: '**' | '~~' | '*'
): string | null {
  if (from < 0 || to <= from || to > sourceText.length) return null;
  return `${sourceText.slice(0, from)}${marker}${sourceText.slice(from, to)}${marker}${sourceText.slice(to)}`;
}

export function listTextSelection(
  sourceText: string,
  from: number,
  to: number,
  kind: 'bullet' | 'ordered'
): string | null {
  if (from < 0 || to <= from || to > sourceText.length) return null;
  let start = sourceText.lastIndexOf('\n', from - 1) + 1;
  let end = sourceText.indexOf('\n', to);
  if (end < 0) end = sourceText.length;
  const selected = sourceText.slice(start, end);
  const lines = selected.split('\n');
  const prefix = kind === 'bullet' ? '- ' : '';
  const listed = lines.map((line, index) => {
    if (/^\s*(?:[-*+]\s+|\d+\.\s+)/.test(line)) return line;
    return kind === 'ordered' ? `${index + 1}. ${line}` : `${prefix}${line}`;
  }).join('\n');
  return `${sourceText.slice(0, start)}${listed}${sourceText.slice(end)}`;
}
