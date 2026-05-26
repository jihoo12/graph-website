import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { GraphData, GraphNode, GraphEdge, NodeCategory } from './types';

const CATEGORY_CONFIG: Record<NodeCategory, { color: string; borderColor: string; textColor: string; icon: string }> = {
  core:     { color: '#1e1b4b', borderColor: '#6366f1', textColor: '#c7d2fe', icon: '◈' },
  service:  { color: '#0c2340', borderColor: '#38bdf8', textColor: '#bae6fd', icon: '⬡' },
  database: { color: '#0f2318', borderColor: '#4ade80', textColor: '#bbf7d0', icon: '⬠' },
  external: { color: '#2d1a00', borderColor: '#fb923c', textColor: '#fed7aa', icon: '◎' },
  user:     { color: '#2d0f1a', borderColor: '#f472b6', textColor: '#fce7f3', icon: '◉' },
};

const NODE_RADIUS: Record<NodeCategory, number> = {
  core: 38, service: 32, database: 28, external: 26, user: 30,
};

interface GraphViewProps {
  data: GraphData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filterCategory: NodeCategory | 'all';
}

export default function GraphView({ data, selectedId, onSelect, filterCategory }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);

  const visibleNodes = filterCategory === 'all'
    ? data.nodes
    : data.nodes.filter(n => n.category === filterCategory);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = data.edges.filter(e => {
    const src = typeof e.source === 'string' ? e.source : e.source.id;
    const tgt = typeof e.target === 'string' ? e.target : e.target.id;
    return visibleIds.has(src) && visibleIds.has(tgt);
  });

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current!);
    const width = svgRef.current!.clientWidth || 900;
    const height = svgRef.current!.clientHeight || 620;

    svg.selectAll('*').remove();

    // Defs — arrow marker + glow filter
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 10).attr('refY', 5)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M0 1L9 5L0 9')
      .attr('fill', 'none')
      .attr('stroke', '#475569')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round');

    const glowFilter = defs.append('filter').attr('id', 'glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const container = svg.append('g');

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => container.attr('transform', event.transform));
    svg.call(zoom);

    // Deep clone nodes/edges for simulation
    const nodes: GraphNode[] = visibleNodes.map(n => ({ ...n }));
    const edges: GraphEdge[] = visibleEdges.map(e => ({ ...e }));

    // Edge lines
    const link = container.append('g')
      .selectAll<SVGLineElement, GraphEdge>('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', d => Math.sqrt(d.weight) * 1.2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrow)');

    // Edge labels
    const edgeLabel = container.append('g')
      .selectAll<SVGTextElement, GraphEdge>('text')
      .data(edges.filter(e => e.label))
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#64748b')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('pointer-events', 'none')
      .text(d => d.label || '');

    // Node groups
    const node = container.append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simRef.current?.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (_event, d) => onSelect(d.id === selectedId ? null : d.id));

    // Node background circles (glow ring)
    node.append('circle')
      .attr('r', d => NODE_RADIUS[d.category] + 6)
      .attr('fill', d => CATEGORY_CONFIG[d.category].borderColor)
      .attr('opacity', d => d.id === selectedId ? 0.25 : 0.07)
      .attr('class', 'ring');

    // Main node circle
    node.append('circle')
      .attr('r', d => NODE_RADIUS[d.category])
      .attr('fill', d => CATEGORY_CONFIG[d.category].color)
      .attr('stroke', d => CATEGORY_CONFIG[d.category].borderColor)
      .attr('stroke-width', d => d.id === selectedId ? 2.5 : 1.5)
      .attr('filter', d => d.id === selectedId ? 'url(#glow)' : null);

    // Category icon
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', -7)
      .attr('font-size', 12)
      .attr('fill', d => CATEGORY_CONFIG[d.category].borderColor)
      .attr('pointer-events', 'none')
      .text(d => CATEGORY_CONFIG[d.category].icon);

    // Node label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('y', 7)
      .attr('font-size', 10)
      .attr('font-weight', '600')
      .attr('fill', d => CATEGORY_CONFIG[d.category].textColor)
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .attr('pointer-events', 'none')
      .text(d => d.label);

    // Force simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(edges)
        .id(d => d.id).distance(140).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => NODE_RADIUS[d.category] + 18));

    simRef.current = sim;

    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          const dx = tgt.x! - src.x!, dy = tgt.y! - src.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return tgt.x! - (dx / dist) * (NODE_RADIUS[tgt.category] + 10);
        })
        .attr('y2', d => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          const dx = tgt.x! - src.x!, dy = tgt.y! - src.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return tgt.y! - (dy / dist) * (NODE_RADIUS[tgt.category] + 10);
        });

      edgeLabel
        .attr('x', d => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          return (src.x! + tgt.x!) / 2;
        })
        .attr('y', d => {
          const src = d.source as GraphNode;
          const tgt = d.target as GraphNode;
          return (src.y! + tgt.y!) / 2 - 6;
        });

      node.attr('transform', d => `translate(${d.x!},${d.y!})`);
    });

    sim.stop();
    return undefined;
  }, [visibleNodes, visibleEdges, selectedId, onSelect]);

  useEffect(() => {
    const cleanup = draw();
    return cleanup;
  }, [draw]);

  useEffect(() => {
    const observer = new ResizeObserver(() => draw());
    if (svgRef.current) observer.observe(svgRef.current.parentElement!);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <svg
      ref={svgRef}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    />
  );
}
