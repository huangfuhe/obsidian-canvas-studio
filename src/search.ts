import type { CanvasDocument } from './types';

export interface CanvasSearchMatch {
  nodeId: string;
  text: string;
  index: number;
  field?: 'label' | 'url';
}

function normalized(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLocaleLowerCase();
}

export function findCanvasMatches(
  data: CanvasDocument,
  query: string,
  caseSensitive = false
): CanvasSearchMatch[] {
  if (!query) return [];
  const needle = normalized(query, caseSensitive);
  const matches: CanvasSearchMatch[] = [];
  for (const node of data.nodes) {
    const fields: Array<{ value: string; field?: 'label' | 'url' }> = [];
    if (typeof node.text === 'string') fields.push({ value: node.text });
    if (typeof node.label === 'string') fields.push({ value: node.label, field: 'label' });
    if (node.type === 'link' && typeof node.url === 'string') fields.push({ value: node.url, field: 'url' });
    for (const field of fields) {
      const haystack = normalized(field.value, caseSensitive);
      let fromIndex = 0;
      while (fromIndex < haystack.length) {
        const index = haystack.indexOf(needle, fromIndex);
        if (index < 0) break;
        matches.push({ nodeId: node.id, text: field.value, index, ...(field.field ? { field: field.field } : {}) });
        fromIndex = index + Math.max(needle.length, 1);
      }
    }
  }
  return matches;
}

export function replaceCurrentMatch(
  data: CanvasDocument,
  match: CanvasSearchMatch,
  query: string,
  replacement: string
): CanvasDocument {
  if (!query) return data;
  return {
    ...data,
    nodes: data.nodes.map((node) => {
      const source = match.field === 'label' ? node.label : match.field === 'url' ? node.url : node.text;
      if (node.id !== match.nodeId || typeof source !== 'string') return node;
      const before = source.slice(0, match.index);
      const after = source.slice(match.index + query.length);
      const value = `${before}${replacement}${after}`;
      if (match.field === 'label') return { ...node, label: value };
      if (match.field === 'url') return { ...node, url: value };
      return { ...node, text: value };
    })
  };
}

export function replaceAllMatches(
  data: CanvasDocument,
  query: string,
  replacement: string,
  caseSensitive = false
): { data: CanvasDocument; replacements: number } {
  if (!query) return { data, replacements: 0 };
  const needle = normalized(query, caseSensitive);
  let replacements = 0;
  const nodes = data.nodes.map((node) => {
    const replaceValue = (source: string): string => {
      const sourceNormalized = normalized(source, caseSensitive);
      let cursor = 0;
      let output = '';
      while (cursor < source.length) {
        const index = sourceNormalized.indexOf(needle, cursor);
        if (index < 0) {
          output += source.slice(cursor);
          break;
        }
        output += source.slice(cursor, index);
        output += replacement;
        cursor = index + query.length;
        replacements += 1;
      }
      return output === source ? source : output;
    };
    const text = typeof node.text === 'string' ? replaceValue(node.text) : node.text;
    const label = typeof node.label === 'string' ? replaceValue(node.label) : node.label;
    const url = node.type === 'link' && typeof node.url === 'string' ? replaceValue(node.url) : node.url;
    return text === node.text && label === node.label && url === node.url ? node : { ...node, text, label, url };
  });
  return { data: { ...data, nodes }, replacements };
}
