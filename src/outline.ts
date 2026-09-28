import { fromMarkdown } from 'mdast-util-from-markdown';
import type { RootContent } from 'mdast';
import { computeMindMapLayout, moveNodesToLayout } from './layout';
import type { CanvasDocument, CanvasEdgeData, CanvasNodeData, LayoutDirection } from './types';

export interface OutlineItem {
  text: string;
  children: OutlineItem[];
}

export interface OutlineCanvasOptions {
  direction: LayoutDirection;
  origin: { x: number; y: number };
  idFactory: (prefix: string) => string;
  fontFamily?: string;
  fontSize?: number;
  maxNodes?: number;
  syntheticRootText?: string;
}

function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const typed = node as { value?: unknown; children?: unknown[] };
  if (typeof typed.value === 'string') return typed.value;
  return (typed.children ?? []).map(nodeText).join('');
}

function listItems(node: RootContent): OutlineItem[] {
  if (node.type !== 'list') return [];
  return node.children.flatMap((item) => {
    const label = item.children
      .filter((child) => child.type !== 'list')
      .map(nodeText)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const children = item.children
      .filter((child): child is Extract<RootContent, { type: 'list' }> => child.type === 'list')
      .flatMap(listItems);
    return label ? [{ text: label, children }] : children;
  });
}

export function parseMarkdownOutline(markdown: string): OutlineItem[] {
  const tree = fromMarkdown(markdown);
  const roots: OutlineItem[] = [];
  const headingStack: Array<{ depth: number; item: OutlineItem }> = [];

  for (const node of tree.children) {
    if (node.type === 'heading') {
      const text = nodeText(node).replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const item: OutlineItem = { text, children: [] };
      while (headingStack.length > 0 && headingStack[headingStack.length - 1]!.depth >= node.depth) {
        headingStack.pop();
      }
      const parent = headingStack[headingStack.length - 1]?.item;
      (parent?.children ?? roots).push(item);
      headingStack.push({ depth: node.depth, item });
      continue;
    }

    if (node.type === 'list') {
      const parent = headingStack[headingStack.length - 1]?.item;
      (parent?.children ?? roots).push(...listItems(node));
    }
  }

  return roots;
}

function countOutline(items: OutlineItem[]): number {
  return items.reduce((sum, item) => sum + 1 + countOutline(item.children), 0);
}

function nodeSize(text: string, root: boolean): { width: number; height: number } {
  const charactersPerLine = root ? 18 : 22;
  const lineCount = Math.max(1, Math.ceil([...text].length / charactersPerLine));
  return {
    width: root ? 300 : 260,
    height: Math.max(root ? 100 : 72, lineCount * 28 + 32)
  };
}

function edgeSides(direction: LayoutDirection): Pick<CanvasEdgeData, 'fromSide' | 'toSide'> {
  switch (direction) {
    case 'left': return { fromSide: 'left', toSide: 'right' };
    case 'down': return { fromSide: 'bottom', toSide: 'top' };
    case 'up': return { fromSide: 'top', toSide: 'bottom' };
    default: return { fromSide: 'right', toSide: 'left' };
  }
}

export function outlineToCanvas(
  outline: OutlineItem[],
  options: OutlineCanvasOptions
): CanvasDocument {
  if (outline.length === 0) throw new Error('Markdown 中没有可导入的标题或列表');
  const total = countOutline(outline);
  const maxNodes = options.maxNodes ?? 200;
  if (total > maxNodes) throw new Error(`大纲包含 ${total} 个节点，超过 ${maxNodes} 个节点的限制`);

  const rootItems = outline.length === 1
    ? outline
    : [{ text: options.syntheticRootText ?? '导入的大纲', children: outline }];
  const nodes: CanvasNodeData[] = [];
  const edges: CanvasEdgeData[] = [];
  const sides = edgeSides(options.direction);

  const append = (item: OutlineItem, parentId: string | null, depth: number): string => {
    const id = options.idFactory('node');
    const size = nodeSize(item.text, depth === 0);
    nodes.push({
      id,
      type: 'text',
      x: 0,
      y: 0,
      ...size,
      text: item.text,
      styleAttributes: {
        fontFamily: options.fontFamily ?? 'sans-serif',
        fontSize: depth === 0 ? Math.max(options.fontSize ?? 16, 20) : options.fontSize ?? 16,
        fontWeight: depth === 0 ? 700 : 400,
        textAlign: depth === 0 ? 'center' : 'left',
        shape: depth === 0 ? 'pill' : 'rectangle'
      }
    });
    if (parentId) {
      edges.push({
        id: options.idFactory('edge'),
        fromNode: parentId,
        toNode: id,
        ...sides,
        toEnd: 'arrow',
        styleAttributes: { pathfindingMethod: 'square' }
      });
    }
    for (const child of item.children) append(child, id, depth + 1);
    return id;
  };

  const rootId = append(rootItems[0]!, null, 0);
  const document: CanvasDocument = { nodes, edges };
  const layout = computeMindMapLayout(document, { rootId, direction: options.direction });
  const positioned = moveNodesToLayout(document, layout);
  const root = positioned.nodes.find((node) => node.id === rootId)!;
  const offsetX = options.origin.x - root.x;
  const offsetY = options.origin.y - root.y;
  return {
    nodes: positioned.nodes.map((node) => ({ ...node, x: node.x + offsetX, y: node.y + offsetY })),
    edges: positioned.edges
  };
}
