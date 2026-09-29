import type { CanvasDocument, CanvasNodeData, CanvasStyleAttributes } from './types';

interface TableMetrics {
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
}

function tableMetrics(group: CanvasNodeData): TableMetrics | null {
  const style = group.styleAttributes;
  if (style?.canvasStudioTable !== true) return null;
  const rows = Number(style.canvasStudioTableRows);
  const columns = Number(style.canvasStudioTableColumns);
  const cellWidth = Number(style.canvasStudioTableCellWidth);
  const cellHeight = Number(style.canvasStudioTableCellHeight);
  return rows > 0 && columns > 0 && cellWidth > 0 && cellHeight > 0 ? { rows, columns, cellWidth, cellHeight } : null;
}

function cellStyle(groupId: string, row: number, column: number, header: boolean): CanvasStyleAttributes {
  return {
    shape: 'rectangle',
    textAlign: 'center',
    padding: 8,
    fontSize: header ? 15 : 14,
    fontWeight: header ? 700 : 400,
    canvasStudioTableId: groupId,
    canvasStudioTableRow: row,
    canvasStudioTableColumn: column
  };
}

function cellNode(
  group: CanvasNodeData,
  metrics: TableMetrics,
  row: number,
  column: number,
  idFactory: (prefix: string) => string
): CanvasNodeData {
  const header = row === 0;
  return {
    id: idFactory('node'),
    type: 'text',
    x: group.x + column * metrics.cellWidth + 8,
    y: group.y + row * metrics.cellHeight + 8,
    width: metrics.cellWidth - 16,
    height: metrics.cellHeight - 16,
    text: header ? `列 ${column + 1}` : `单元格 ${row}-${column + 1}`,
    ...(header ? { color: '5' } : {}),
    styleAttributes: cellStyle(group.id, row, column, header)
  };
}

export function addTableRow(data: CanvasDocument, groupId: string, idFactory: (prefix: string) => string): CanvasDocument {
  const group = data.nodes.find((node) => node.id === groupId && node.type === 'group');
  if (!group) return data;
  const metrics = tableMetrics(group);
  if (!metrics) return data;
  const row = metrics.rows;
  const cells = Array.from({ length: metrics.columns }, (_, column) => cellNode(group, metrics, row, column, idFactory));
  return {
    ...data,
    nodes: data.nodes.map((node) => node.id === groupId ? {
      ...node,
      height: (metrics.rows + 1) * metrics.cellHeight,
      styleAttributes: { ...(node.styleAttributes ?? {}), canvasStudioTableRows: metrics.rows + 1 }
    } : node).concat(cells)
  };
}

export function addTableColumn(data: CanvasDocument, groupId: string, idFactory: (prefix: string) => string): CanvasDocument {
  const group = data.nodes.find((node) => node.id === groupId && node.type === 'group');
  if (!group) return data;
  const metrics = tableMetrics(group);
  if (!metrics) return data;
  const column = metrics.columns;
  const cells = Array.from({ length: metrics.rows }, (_, row) => cellNode(group, metrics, row, column, idFactory));
  return {
    ...data,
    nodes: data.nodes.map((node) => node.id === groupId ? {
      ...node,
      width: (metrics.columns + 1) * metrics.cellWidth,
      styleAttributes: { ...(node.styleAttributes ?? {}), canvasStudioTableColumns: metrics.columns + 1 }
    } : node).concat(cells)
  };
}

function removeTableCells(data: CanvasDocument, group: CanvasNodeData, axis: 'row' | 'column'): CanvasDocument {
  const metrics = tableMetrics(group);
  if (!metrics) return data;
  if (axis === 'row' && metrics.rows <= 1 || axis === 'column' && metrics.columns <= 1) return data;
  const target = axis === 'row' ? metrics.rows - 1 : metrics.columns - 1;
  const removedIds = new Set(data.nodes.filter((node) => {
    if (node.styleAttributes?.canvasStudioTableId !== group.id) return false;
    const index = Number(axis === 'row' ? node.styleAttributes.canvasStudioTableRow : node.styleAttributes.canvasStudioTableColumn);
    return index === target;
  }).map((node) => node.id));
  return {
    ...data,
    nodes: data.nodes.filter((node) => !removedIds.has(node.id)).map((node) => node.id === group.id ? {
      ...node,
      ...(axis === 'row'
        ? { height: (metrics.rows - 1) * metrics.cellHeight, styleAttributes: { ...(node.styleAttributes ?? {}), canvasStudioTableRows: metrics.rows - 1 } }
        : { width: (metrics.columns - 1) * metrics.cellWidth, styleAttributes: { ...(node.styleAttributes ?? {}), canvasStudioTableColumns: metrics.columns - 1 } })
    } : node),
    edges: data.edges.filter((edge) => !removedIds.has(edge.fromNode) && !removedIds.has(edge.toNode))
  };
}

export function removeLastTableRow(data: CanvasDocument, groupId: string): CanvasDocument {
  const group = data.nodes.find((node) => node.id === groupId && node.type === 'group');
  return group ? removeTableCells(data, group, 'row') : data;
}

export function removeLastTableColumn(data: CanvasDocument, groupId: string): CanvasDocument {
  const group = data.nodes.find((node) => node.id === groupId && node.type === 'group');
  return group ? removeTableCells(data, group, 'column') : data;
}
