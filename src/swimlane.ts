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

export type SwimlaneOrientation = 'columns' | 'rows';

export interface SwimlaneSpec {
  id: string;
  name: string;
  orientation?: SwimlaneOrientation;
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
const ROW_LANE_HEIGHT = 280;

const CROSS_TEAM_LANES: SwimlaneLaneSpec[] = [
  { key: 'requester', label: '需求方', color: '5' },
  { key: 'owner', label: '负责人', color: '4' },
  { key: 'reviewer', label: '评审方', color: '3' }
];

const CROSS_TEAM_STEPS: SwimlaneStepSpec[] = [
  { key: 'submit', lane: 'requester', order: 0, text: '提交需求', shape: 'parallelogram' },
  { key: 'clarify', lane: 'owner', order: 1, text: '澄清与拆解' },
  { key: 'review', lane: 'reviewer', order: 2, text: '方案评审', shape: 'diamond' },
  { key: 'execute', lane: 'owner', order: 3, text: '执行与验证' },
  { key: 'accept', lane: 'requester', order: 4, text: '验收结果', shape: 'pill' }
];

const CROSS_TEAM_EDGES: SwimlaneSpec['edges'] = [
  { from: 'submit', to: 'clarify' },
  { from: 'clarify', to: 'review' },
  { from: 'review', to: 'execute', label: '通过' },
  { from: 'execute', to: 'accept' }
];

export const SWIMLANE_TEMPLATES: SwimlaneSpec[] = [
  {
    id: 'cross-team-request',
    name: '多角色流程泳道',
    lanes: CROSS_TEAM_LANES,
    steps: CROSS_TEAM_STEPS,
    edges: CROSS_TEAM_EDGES
  },
  {
    id: 'cross-team-request-rows',
    name: '多角色流程泳道（行式）',
    orientation: 'rows',
    lanes: CROSS_TEAM_LANES,
    steps: CROSS_TEAM_STEPS,
    edges: CROSS_TEAM_EDGES
  }
];

export function instantiateSwimlane(
  template: SwimlaneSpec,
  options: SwimlaneOptions
): CanvasDocument {
  const orientation = template.orientation ?? 'columns';
  const maxOrder = Math.max(...template.steps.map((step) => step.order));
  const columnLaneHeight = LANE_PADDING * 2 + STEP_HEIGHT + maxOrder * (STEP_HEIGHT + STEP_GAP);
  const rowLaneWidth = LANE_PADDING * 2 + STEP_WIDTH + maxOrder * (STEP_WIDTH + STEP_GAP);
  const laneWidth = orientation === 'rows' ? rowLaneWidth : LANE_WIDTH;
  const laneHeight = orientation === 'rows' ? ROW_LANE_HEIGHT : columnLaneHeight;
  const lanePosition = new Map<string, { x: number; y: number }>();
  const laneNodes: CanvasNodeData[] = template.lanes.map((lane, index) => {
    const x = options.origin.x + (orientation === 'columns' ? index * (LANE_WIDTH + LANE_GAP) : 0);
    const y = options.origin.y + (orientation === 'rows' ? index * (ROW_LANE_HEIGHT + LANE_GAP) : 0);
    lanePosition.set(lane.key, { x, y });
    return {
      id: options.idFactory('group'),
      type: 'group',
      x,
      y,
      width: laneWidth,
      height: laneHeight,
      label: lane.label,
      color: lane.color,
      styleAttributes: {
        border: 'solid',
        canvasStudioLaneAxis: orientation === 'rows' ? 'row' : 'column',
        canvasStudioLaneKey: lane.key
      }
    };
  });

  const stepIds = new Map<string, string>();
  const stepNodes: CanvasNodeData[] = template.steps.map((step) => {
    const id = options.idFactory('node');
    stepIds.set(step.key, id);
    const lane = lanePosition.get(step.lane) ?? options.origin;
    const x = orientation === 'rows'
      ? lane.x + LANE_PADDING + step.order * (STEP_WIDTH + STEP_GAP)
      : lane.x + (LANE_WIDTH - STEP_WIDTH) / 2;
    const y = orientation === 'rows'
      ? lane.y + (ROW_LANE_HEIGHT - STEP_HEIGHT) / 2
      : options.origin.y + LANE_PADDING + step.order * (STEP_HEIGHT + STEP_GAP);
    const diamond = step.shape === 'diamond';
    return {
      id,
      type: 'text',
      x: diamond ? x - 30 : x,
      y: orientation === 'rows' && diamond ? y - 30 : y,
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
    const forwardFrom = orientation === 'rows' ? 'bottom' : 'right';
    const forwardTo = orientation === 'rows' ? 'top' : 'left';
    const backwardFrom = orientation === 'rows' ? 'top' : 'left';
    const backwardTo = orientation === 'rows' ? 'bottom' : 'right';
    return {
      id: options.idFactory('edge'),
      fromNode: stepIds.get(edge.from)!,
      fromSide: sameLane ? (orientation === 'rows' ? 'right' : 'bottom') : forward ? forwardFrom : backwardFrom,
      toNode: stepIds.get(edge.to)!,
      toSide: sameLane ? (orientation === 'rows' ? 'left' : 'top') : forward ? forwardTo : backwardTo,
      toEnd: 'arrow',
      ...(edge.label ? { label: edge.label } : {}),
      styleAttributes: { pathfindingMethod: 'square' }
    };
  });

  return { nodes: [...laneNodes, ...stepNodes], edges };
}
