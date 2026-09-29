import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPONENT_LIBRARY } from '../src/components';
import { addTableColumn, addTableRow, insertTableColumnAfter, insertTableRowAfter, removeLastTableColumn, removeLastTableRow, removeTableColumnAtCell, removeTableRowAtCell, resizeTableCells } from '../src/table-actions';

test('adds rows and columns to a semantic native Canvas table', () => {
  let index = 0;
  const table = COMPONENT_LIBRARY.find((component) => component.id === 'table')!;
  const data = table.build({ x: 100, y: 200 }, (prefix) => `${prefix}-${++index}`);
  const group = data.nodes[0]!;
  assert.equal(group.styleAttributes?.canvasStudioTableRows, 4);
  assert.equal(group.styleAttributes?.canvasStudioTableColumns, 3);

  const withRow = addTableRow(data, group.id, (prefix) => `${prefix}-${++index}`);
  assert.equal(withRow.nodes.length, data.nodes.length + 3);
  assert.equal(withRow.nodes[0]?.height, 270);
  assert.equal(withRow.nodes[0]?.styleAttributes?.canvasStudioTableRows, 5);

  const withColumn = addTableColumn(withRow, group.id, (prefix) => `${prefix}-${++index}`);
  assert.equal(withColumn.nodes.length, withRow.nodes.length + 5);
  assert.equal(withColumn.nodes[0]?.width, 600);
  assert.equal(withColumn.nodes[0]?.styleAttributes?.canvasStudioTableColumns, 4);
  assert.equal(withColumn.nodes.at(-1)?.styleAttributes?.canvasStudioTableColumn, 3);

  const withoutRow = removeLastTableRow(withColumn, group.id);
  assert.equal(withoutRow.nodes[0]?.styleAttributes?.canvasStudioTableRows, 4);
  assert.equal(withoutRow.nodes.filter((node) => node.styleAttributes?.canvasStudioTableRow === 4).length, 0);
  const withoutColumn = removeLastTableColumn(withoutRow, group.id);
  assert.equal(withoutColumn.nodes[0]?.styleAttributes?.canvasStudioTableColumns, 3);
  assert.equal(withoutColumn.nodes.filter((node) => node.styleAttributes?.canvasStudioTableColumn === 3).length, 0);
});

test('inserts a row and column after a selected semantic cell', () => {
  let index = 0;
  const table = COMPONENT_LIBRARY.find((component) => component.id === 'table')!;
  const data = table.build({ x: 0, y: 0 }, (prefix) => `${prefix}-${++index}`);
  const cell = data.nodes.find((node) => node.styleAttributes?.canvasStudioTableRow === 1 && node.styleAttributes?.canvasStudioTableColumn === 1)!;
  const afterRow = insertTableRowAfter(data, cell.id, (prefix) => `${prefix}-${++index}`);
  assert.equal(afterRow.nodes[0]?.styleAttributes?.canvasStudioTableRows, 5);
  assert.equal(afterRow.nodes.filter((node) => node.styleAttributes?.canvasStudioTableRow === 2).length, 3);
  assert.equal(afterRow.nodes.find((node) => node.text === '单元格 2-2')?.styleAttributes?.canvasStudioTableRow, 3);

  const afterColumn = insertTableColumnAfter(afterRow, cell.id, (prefix) => `${prefix}-${++index}`);
  assert.equal(afterColumn.nodes[0]?.styleAttributes?.canvasStudioTableColumns, 4);
  assert.equal(afterColumn.nodes.filter((node) => node.styleAttributes?.canvasStudioTableColumn === 2).length, 5);
  assert.equal(afterColumn.nodes.find((node) => node.text === '单元格 1-3')?.styleAttributes?.canvasStudioTableColumn, 3);
});

test('removes the selected cell row or column and shifts later cells', () => {
  let index = 0;
  const table = COMPONENT_LIBRARY.find((component) => component.id === 'table')!;
  const data = table.build({ x: 0, y: 0 }, (prefix) => `${prefix}-${++index}`);
  const cell = data.nodes.find((node) => node.styleAttributes?.canvasStudioTableRow === 1 && node.styleAttributes?.canvasStudioTableColumn === 1)!;
  const withoutRow = removeTableRowAtCell(data, cell.id);
  assert.equal(withoutRow.nodes[0]?.styleAttributes?.canvasStudioTableRows, 3);
  assert.equal(withoutRow.nodes.find((node) => node.text === '单元格 2-2')?.styleAttributes?.canvasStudioTableRow, 1);

  const replacementCell = withoutRow.nodes.find((node) => node.styleAttributes?.canvasStudioTableRow === 1 && node.styleAttributes?.canvasStudioTableColumn === 1)!;
  const withoutColumn = removeTableColumnAtCell(withoutRow, replacementCell.id);
  assert.equal(withoutColumn.nodes[0]?.styleAttributes?.canvasStudioTableColumns, 2);
  assert.equal(withoutColumn.nodes.find((node) => node.text === '单元格 2-3')?.styleAttributes?.canvasStudioTableColumn, 1);
  const header = data.nodes.find((node) => node.styleAttributes?.canvasStudioTableRow === 0)!;
  assert.equal(removeTableRowAtCell(data, header.id), data);
});

test('resizes and repositions every semantic table cell', () => {
  let index = 0;
  const table = COMPONENT_LIBRARY.find((component) => component.id === 'table')!;
  const data = table.build({ x: 100, y: 200 }, (prefix) => `${prefix}-${++index}`);
  const result = resizeTableCells(data, data.nodes[0]!.id, { cellWidth: 200, cellHeight: 72 });
  assert.equal(result.nodes[0]?.width, 600);
  assert.equal(result.nodes[0]?.height, 288);
  const cell = result.nodes.find((node) => node.styleAttributes?.canvasStudioTableRow === 2 && node.styleAttributes?.canvasStudioTableColumn === 1)!;
  assert.deepEqual({ x: cell.x, y: cell.y, width: cell.width, height: cell.height }, { x: 308, y: 352, width: 184, height: 56 });
});
