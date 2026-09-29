import type { CanvasDocument, CanvasNodeData } from './types';

export type CanvasHealthKind =
  | 'duplicate-id'
  | 'invalid-edge'
  | 'orphan-edge'
  | 'cycle'
  | 'overlap'
  | 'outside-group'
  | 'invalid-semantic-reference';

export interface CanvasHealthIssue {
  kind: CanvasHealthKind;
  ids: string[];
  message: string;
}

function overlaps(a: CanvasNodeData, b: CanvasNodeData): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

function contains(group: CanvasNodeData, node: CanvasNodeData): boolean {
  const padding = 16;
  return node.x >= group.x + padding
    && node.y >= group.y + padding
    && node.x + node.width <= group.x + group.width - padding
    && node.y + node.height <= group.y + group.height - padding;
}

export function diagnoseCanvas(data: CanvasDocument): CanvasHealthIssue[] {
  const issues: CanvasHealthIssue[] = [];
  const ids = new Map<string, CanvasNodeData[]>();
  for (const node of data.nodes) {
    const bucket = ids.get(node.id) ?? [];
    bucket.push(node);
    ids.set(node.id, bucket);
  }
  for (const [id, nodes] of ids) {
    if (nodes.length > 1) issues.push({ kind: 'duplicate-id', ids: [id], message: `重复节点 ID：${id}` });
  }

  const nodeIds = new Set(data.nodes.map((node) => node.id));
  const groupsById = new Map(data.nodes.filter((node) => node.type === 'group').map((node) => [node.id, node]));
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const studio = metadata?.canvasStudio as Record<string, unknown> | undefined;
  const mindMapRootId = studio?.mindMapRootId;
  if (typeof mindMapRootId === 'string' && !nodeIds.has(mindMapRootId)) {
    issues.push({ kind: 'invalid-semantic-reference', ids: [mindMapRootId], message: `思维导图根节点不存在：${mindMapRootId}` });
  }
  const collapsed = studio?.collapsedMindMapNodeIds;
  if (Array.isArray(collapsed)) {
    for (const nodeId of collapsed) {
      if (typeof nodeId === 'string' && !nodeIds.has(nodeId)) {
        issues.push({ kind: 'invalid-semantic-reference', ids: [nodeId], message: `折叠分支节点不存在：${nodeId}` });
      }
    }
  }
  for (const node of data.nodes) {
    const laneId = node.styleAttributes?.canvasStudioLaneId;
    if (typeof laneId === 'string' && !groupsById.has(laneId)) {
      issues.push({ kind: 'invalid-semantic-reference', ids: [node.id, laneId], message: `节点 ${node.id} 引用了不存在的泳道 ${laneId}` });
    }
    const tableId = node.styleAttributes?.canvasStudioTableId;
    const table = typeof tableId === 'string' ? groupsById.get(tableId) : undefined;
    if (typeof tableId === 'string' && table?.styleAttributes?.canvasStudioTable !== true) {
      issues.push({ kind: 'invalid-semantic-reference', ids: [node.id, tableId], message: `单元格 ${node.id} 引用了不存在的表格 ${tableId}` });
    }
  }
  for (const edge of data.edges) {
    if (!edge.fromNode || !edge.toNode) {
      issues.push({ kind: 'invalid-edge', ids: [edge.id], message: `连线 ${edge.id} 缺少端点` });
      continue;
    }
    if (!nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode)) {
      issues.push({ kind: 'orphan-edge', ids: [edge.id], message: `连线 ${edge.id} 引用了不存在的节点` });
    }
  }

  const children = new Map<string, string[]>();
  for (const edge of data.edges) {
    if (!children.has(edge.fromNode)) children.set(edge.fromNode, []);
    children.get(edge.fromNode)?.push(edge.toNode);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (id: string, path: string[]) => {
    if (visiting.has(id)) {
      issues.push({ kind: 'cycle', ids: [...path, id], message: `检测到环：${[...path, id].join(' → ')}` });
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const child of children.get(id) ?? []) walk(child, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  };
  for (const node of data.nodes) walk(node.id, []);

  const visibleNodes = data.nodes.filter((node) => node.type !== 'group');
  for (let left = 0; left < visibleNodes.length; left++) {
    for (let right = left + 1; right < visibleNodes.length; right++) {
      const first = visibleNodes[left]!;
      const second = visibleNodes[right]!;
      if (overlaps(first, second)) issues.push({
        kind: 'overlap',
        ids: [first.id, second.id],
        message: `节点 ${first.id} 与 ${second.id} 重叠`
      });
    }
  }

  const groups = data.nodes.filter((node) => node.type === 'group');
  for (const group of groups) {
    for (const node of visibleNodes) {
      if (node.id === group.id || !overlaps(group, node)) continue;
      if (!contains(group, node)) issues.push({
        kind: 'outside-group',
        ids: [group.id, node.id],
        message: `节点 ${node.id} 部分越出分区 ${group.label ?? group.id}`
      });
    }
  }
  return issues;
}
