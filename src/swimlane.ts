import type { CanvasDocument, CanvasEdgeData, CanvasNodeData } from './types';

export interface SwimlaneLaneSpec {
  key: string;
  label: string;
  color: string;
}

export interface SwimlaneStepSpec {
  key: string;
  lane: string;
  order: number;
  text: string;
  shape?: string;
}

export interface SwimlaneSpec {
  id: string;
  name: string;
  lanes: SwimlaneLaneSpec[];
  steps: SwimlaneStepSpec[];
  edges: Array<{ from: string; to: string; label?: string }>;
}

export interface SwimlaneOptions {
  origin: { x: number; y: number };
  idFactory: (prefix: string) => string;
  fontFamily?: string;
  fontSize?: number;
}

const LANE_WIDTH = 360;
const LANE_GAP = 40;
const LANE_PADDING = 48;
const STEP_WIDTH = 260;
const STEP_HEIGHT = 96;
const STEP_GAP = 100;

export const SWIMLANE_TEMPLATES: SwimlaneSpec[] = [
  {
    id: 'cross-team-request',
    name: '跨团队协作泳道',
    lanes: [
      { key: 'requester', label: '需求方', color: '5' },
      { key: 'owner', label: '负责人', color: '4' },
      { key: 'reviewer', label: '评审方', color: '3' }
    ],
    steps: [
      { key: 'submit', lane: 'requester', order: 0, text: '提交需求', shape: 'parallelogram' },
      { key: 'clarify', lane: 'owner', order: 1, text: '澄清与拆解' },
      { key: 'review', lane: 'reviewer', order: 2, text: '方案评审', shape: 'diamond' },
      { key: 'execute', lane: 'owner', order: 3, text: '执行与验证' },
      { key: 'accept', lane: 'requester', order: 4, text: '验收结果', shape: 'pill' }
    ],
    edges: [
      { from: 'submit', to: 'clarify' },
      { from: 'clarify', to: 'review' },
      { from: 'review', to: 'execute', label: '通过' },
      { from: 'execute', to: 'accept' }
    ]
  }
];

export function instantiateSwimlane(
  template: SwimlaneSpec,
  options: SwimlaneOptions
): CanvasDocument {
  const maxOrder = Math.max(...template.steps.map((step) => step.order));
  const laneHeight = LANE_PADDING * 2 + STEP_HEIGHT + maxOrder * (STEP_HEIGHT + STEP_GAP);
  const laneX = new Map<string, number>();
  const laneNodes: CanvasNodeData[] = template.lanes.map((lane, index) => {
    const x = options.origin.x + index * (LANE_WIDTH + LANE_GAP);
    laneX.set(lane.key, x);
    return {
      id: options.idFactory('group'),
      type: 'group',
      x,
      y: options.origin.y,
      width: LANE_WIDTH,
      height: laneHeight,
      label: lane.label,
      color: lane.color,
      styleAttributes: { border: 'solid' }
    };
  });

  const stepIds = new Map<string, string>();
  const stepNodes: CanvasNodeData[] = template.steps.map((step) => {
    const id = options.idFactory('node');
    stepIds.set(step.key, id);
    const x = (laneX.get(step.lane) ?? options.origin.x) + (LANE_WIDTH - STEP_WIDTH) / 2;
    const y = options.origin.y + LANE_PADDING + step.order * (STEP_HEIGHT + STEP_GAP);
    const diamond = step.shape === 'diamond';
    return {
      id,
      type: 'text',
      x: diamond ? x - 30 : x,
      y,
      width: diamond ? STEP_WIDTH + 60 : STEP_WIDTH,
      height: diamond ? STEP_HEIGHT + 60 : STEP_HEIGHT,
      text: step.text,
      styleAttributes: {
        shape: step.shape ?? 'rectangle',
        textAlign: 'center',
        fontFamily: options.fontFamily ?? 'sans-serif',
        fontSize: options.fontSize ?? 16,
        fontWeight: step.shape === 'pill' ? 700 : 400,
        ...(diamond ? { padding: 24 } : {})
      }
    };
  });

  const stepMap = new Map(template.steps.map((step) => [step.key, step]));
  const laneIndex = new Map(template.lanes.map((lane, index) => [lane.key, index]));
  const edges: CanvasEdgeData[] = template.edges.map((edge) => {
    const from = stepMap.get(edge.from)!;
    const to = stepMap.get(edge.to)!;
    const sameLane = from.lane === to.lane;
    const forward = (laneIndex.get(from.lane) ?? 0) < (laneIndex.get(to.lane) ?? 0);
    return {
      id: options.idFactory('edge'),
      fromNode: stepIds.get(edge.from)!,
      fromSide: sameLane ? 'bottom' : forward ? 'right' : 'left',
      toNode: stepIds.get(edge.to)!,
      toSide: sameLane ? 'top' : forward ? 'left' : 'right',
      toEnd: 'arrow',
      ...(edge.label ? { label: edge.label } : {}),
      styleAttributes: { pathfindingMethod: 'square' }
    };
  });

  return { nodes: [...laneNodes, ...stepNodes], edges };
}
