import type { CanvasDocument, CanvasNodeData } from './types';

export type ComponentCategory = '常用组件' | '流程组件' | '容器组件';

export interface ComponentSpec {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  build: (origin: { x: number; y: number }, idFactory: (prefix: string) => string) => CanvasDocument;
}

function textNode(
  id: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  styleAttributes: Record<string, string | number>,
  color?: string
): CanvasNodeData {
  return {
    id,
    type: 'text',
    x,
    y,
    width,
    height,
    text,
    ...(color ? { color } : {}),
    styleAttributes
  };
}

function groupNode(id: string, label: string, x: number, y: number, width: number, height: number, color: string): CanvasNodeData {
  return {
    id,
    type: 'group',
    x,
    y,
    width,
    height,
    label,
    color,
    styleAttributes: { border: 'solid' }
  };
}

export const COMPONENT_LIBRARY: ComponentSpec[] = [
  {
    id: 'button',
    name: '按钮',
    category: '常用组件',
    description: '可作为流程动作或原型操作入口。',
    build: (origin, idFactory) => ({
      nodes: [textNode(idFactory('node'), '按钮', origin.x, origin.y, 220, 72, { shape: 'pill', textAlign: 'center', fontSize: 16, fontWeight: 700 }, '6')],
      edges: []
    })
  },
  {
    id: 'input',
    name: '输入框',
    category: '常用组件',
    description: '用于原型或流程中的输入状态。',
    build: (origin, idFactory) => ({
      nodes: [textNode(idFactory('node'), '请输入内容', origin.x, origin.y, 280, 72, { shape: 'rectangle', textAlign: 'left', padding: 16, fontSize: 16 }, '5')],
      edges: []
    })
  },
  {
    id: 'tag',
    name: '标签',
    category: '常用组件',
    description: '用于状态、分类或流程阶段标记。',
    build: (origin, idFactory) => ({
      nodes: [textNode(idFactory('node'), '标签', origin.x, origin.y, 160, 56, { shape: 'pill', textAlign: 'center', fontSize: 14 }, '5')],
      edges: []
    })
  },
  {
    id: 'info-card',
    name: '信息卡片',
    category: '容器组件',
    description: '带标题和内容的分组卡片。',
    build: (origin, idFactory) => {
      const groupId = idFactory('group');
      const titleId = idFactory('node');
      const bodyId = idFactory('node');
      return {
        nodes: [
          groupNode(groupId, '信息卡片', origin.x, origin.y, 360, 240, '5'),
          textNode(titleId, '标题', origin.x + 32, origin.y + 44, 296, 56, { shape: 'pill', textAlign: 'left', padding: 12, fontSize: 18, fontWeight: 700 }, '5'),
          textNode(bodyId, '补充说明内容', origin.x + 32, origin.y + 120, 296, 72, { shape: 'rectangle', textAlign: 'left', padding: 12, fontSize: 14 })
        ],
        edges: []
      };
    }
  },
  {
    id: 'alert-card',
    name: '提示卡片',
    category: '容器组件',
    description: '用于风险、警告或评审结论。',
    build: (origin, idFactory) => {
      const groupId = idFactory('group');
      const bodyId = idFactory('node');
      return {
        nodes: [
          groupNode(groupId, '提示卡片', origin.x, origin.y, 360, 180, '1'),
          textNode(bodyId, '请注意这项风险', origin.x + 32, origin.y + 52, 296, 76, { shape: 'document', textAlign: 'center', padding: 16, fontSize: 16, fontWeight: 700 }, '1')
        ],
        edges: []
      };
    }
  }
];

export function componentsByCategory(): Map<ComponentCategory, ComponentSpec[]> {
  const result = new Map<ComponentCategory, ComponentSpec[]>();
  for (const component of COMPONENT_LIBRARY) {
    const list = result.get(component.category) ?? [];
    list.push(component);
    result.set(component.category, list);
  }
  return result;
}
