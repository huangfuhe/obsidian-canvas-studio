import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPONENT_LIBRARY } from '../src/components';
import { addTableColumn, addTableRow } from '../src/table-actions';

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
});
