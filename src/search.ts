import type { CanvasDocument } from './types';

export interface CanvasSearchMatch {
  nodeId: string;
  text: string;
  index: number;
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
    if (typeof node.text !== 'string') continue;
    const haystack = normalized(node.text, caseSensitive);
    let fromIndex = 0;
    while (fromIndex < haystack.length) {
      const index = haystack.indexOf(needle, fromIndex);
      if (index < 0) break;
      matches.push({ nodeId: node.id, text: node.text, index });
      fromIndex = index + Math.max(needle.length, 1);
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
      if (node.id !== match.nodeId || typeof node.text !== 'string') return node;
      const before = node.text.slice(0, match.index);
      const after = node.text.slice(match.index + query.length);
      return { ...node, text: `${before}${replacement}${after}` };
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
    if (typeof node.text !== 'string') return node;
    const source = node.text;
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
    return output === source ? node : { ...node, text: output };
  });
  return { data: { ...data, nodes }, replacements };
}
