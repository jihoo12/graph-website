export type NodeCategory = 'core' | 'service' | 'database' | 'external' | 'user';

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  description: string;
  connections: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
