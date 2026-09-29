import type { CanvasDocument, CanvasEdgeData, CanvasNodeData, CanvasStyleAttributes } from './types';

export interface FlowTemplateItem {
  key: string;
  text: string;
  shape?: string;
  color?: string;
}

export interface FlowTemplateEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowTemplateSpec {
  id: string;
  name: string;
  tiers: FlowTemplateItem[][];
  edges: FlowTemplateEdge[];
}

export interface FlowTemplateOptions {
  origin: { x: number; y: number };
  idFactory: (prefix: string) => string;
  fontFamily?: string;
  fontSize?: number;
}

const FLOW_NODE_GAP = 72;
const FLOW_TIER_GAP = 96;

export const FLOW_TEMPLATES: FlowTemplateSpec[] = [
  {
    id: 'basic-process',
    name: '基础流程',
    tiers: [
      [{ key: 'start', text: '开始', shape: 'pill', color: '4' }],
      [{ key: 'process', text: '处理步骤', shape: 'rectangle' }],
      [{ key: 'decision', text: '是否满足条件？', shape: 'diamond', color: '3' }],
      [{ key: 'end', text: '结束', shape: 'pill', color: '5' }]
    ],
    edges: [
      { from: 'start', to: 'process' },
      { from: 'process', to: 'decision' },
      { from: 'decision', to: 'end', label: '是' }
    ]
  },
  {
    id: 'decision-branch',
    name: '判断分支',
    tiers: [
      [{ key: 'input', text: '接收请求', shape: 'parallelogram', color: '5' }],
      [{ key: 'validate', text: '校验请求', shape: 'rectangle' }],
      [{ key: 'decision', text: '校验通过？', shape: 'diamond', color: '3' }],
      [
        { key: 'accept', text: '执行处理', shape: 'rectangle', color: '4' },
        { key: 'reject', text: '返回错误', shape: 'document', color: '1' }
      ],
      [{ key: 'finish', text: '完成', shape: 'pill' }]
    ],
    edges: [
      { from: 'input', to: 'validate' },
      { from: 'validate', to: 'decision' },
      { from: 'decision', to: 'accept', label: '是' },
      { from: 'decision', to: 'reject', label: '否' },
      { from: 'accept', to: 'finish' },
      { from: 'reject', to: 'finish' }
    ]
  }
];

function shapeSize(shape?: string): { width: number; height: number; style: CanvasStyleAttributes } {
  if (shape === 'diamond') return { width: 340, height: 180, style: { shape, padding: 32 } };
  if (shape === 'pill') return { width: 240, height: 96, style: { shape } };
  if (shape === 'document' || shape === 'database') return { width: 280, height: 120, style: { shape } };
  return { width: 280, height: 96, style: { shape: shape ?? 'rectangle' } };
}

export function instantiateFlowTemplate(
  template: FlowTemplateSpec,
  options: FlowTemplateOptions
): CanvasDocument {
  const ids = new Map<string, string>();
  const nodes: CanvasNodeData[] = [];
  let y = options.origin.y;

  for (const tier of template.tiers) {
    const sizes = tier.map((item) => shapeSize(item.shape));
    const tierWidth = sizes.reduce((sum, size) => sum + size.width, 0) + FLOW_NODE_GAP * Math.max(0, tier.length - 1);
    const tierHeight = Math.max(...sizes.map((size) => size.height));
    let x = options.origin.x - tierWidth / 2;
    tier.forEach((item, index) => {
      const size = sizes[index]!;
      const id = options.idFactory('node');
      ids.set(item.key, id);
      const flowRole = item.key === 'start' ? 'start' : item.key === 'end' || item.key === 'finish' ? 'end' : undefined;
      nodes.push({
        id,
        type: 'text',
        x,
        y: y + (tierHeight - size.height) / 2,
        width: size.width,
        height: size.height,
        text: item.text,
        ...(item.color ? { color: item.color } : {}),
        styleAttributes: {
          ...size.style,
          textAlign: 'center',
          fontFamily: options.fontFamily ?? 'sans-serif',
          fontSize: options.fontSize ?? 16,
          fontWeight: item.shape === 'pill' ? 700 : 400,
          ...(flowRole ? { canvasStudioFlowRole: flowRole } : {})
        }
      });
      x += size.width + FLOW_NODE_GAP;
    });
    y += tierHeight + FLOW_TIER_GAP;
  }

  const edges: CanvasEdgeData[] = template.edges.map((edge) => ({
    id: options.idFactory('edge'),
    fromNode: ids.get(edge.from)!,
    fromSide: 'bottom',
    toNode: ids.get(edge.to)!,
    toSide: 'top',
    toEnd: 'arrow',
    ...(edge.label ? { label: edge.label } : {}),
    styleAttributes: { pathfindingMethod: 'square' }
  }));

  return { nodes, edges };
}
