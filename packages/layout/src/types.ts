export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutNode {
  id: string;
  kind: "entity" | "enum";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutEdge {
  id: string;
  sourceId: string;
  targetId: string;
  points?: LayoutPoint[];
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
}

export type LayoutDirection = "RIGHT" | "DOWN" | "LEFT" | "UP";

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeSpacing?: number;
  layerSpacing?: number;
  useCache?: boolean;
}
