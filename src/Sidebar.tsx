import type { GraphNode, GraphEdge, NodeCategory } from './types';

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  core: 'Core Infrastructure',
  service: 'Microservice',
  database: 'Data Store',
  external: 'External API',
  user: 'Client',
};

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  core:     '#6366f1',
  service:  '#38bdf8',
  database: '#4ade80',
  external: '#fb923c',
  user:     '#f472b6',
};

interface SidebarProps {
  node: GraphNode | null;
  allNodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export default function Sidebar({ node, allNodes, edges, onClose, onNavigate }: SidebarProps) {
  if (!node) return null;

  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  const outgoing = edges.filter(e => {
    const src = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id;
    return src === node.id;
  });
  const incoming = edges.filter(e => {
    const tgt = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id;
    return tgt === node.id;
  });

  const color = CATEGORY_COLORS[node.category];

  return (
    <aside style={{
      width: 280,
      flexShrink: 0,
      background: '#0d1117',
      borderLeft: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: color + '1a',
          border: `1.5px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontSize: 14,
          color,
        }}>
          {node.label.charAt(0)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9', marginBottom: 2 }}>{node.label}</div>
          <span style={{
            fontSize: 10, fontWeight: 500,
            background: color + '22',
            color,
            padding: '2px 8px',
            borderRadius: 10,
            border: `1px solid ${color}44`,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>
            {CATEGORY_LABELS[node.category]}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#64748b', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0,
          }}
          aria-label="Close"
        >×</button>
      </div>

      {/* Description */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{node.description}</p>
      </div>

      {/* Stats */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: 12 }}>
        {[
          { label: 'Outgoing', value: outgoing.length, color: '#38bdf8' },
          { label: 'Incoming', value: incoming.length, color: '#4ade80' },
          { label: 'Total', value: outgoing.length + incoming.length, color: '#a78bfa' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, textAlign: 'center',
            background: '#111827', borderRadius: 8,
            padding: '10px 6px',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Connections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        {outgoing.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Outgoing ({outgoing.length})
            </div>
            {outgoing.map(edge => {
              const tgtId = typeof edge.target === 'string' ? edge.target : (edge.target as GraphNode).id;
              const tgt = nodeMap.get(tgtId);
              if (!tgt) return null;
              return (
                <button key={edge.id} onClick={() => onNavigate(tgtId)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', background: '#111827',
                  border: '1px solid #1e293b', borderRadius: 8,
                  padding: '8px 12px', cursor: 'pointer', marginBottom: 6,
                  textAlign: 'left',
                }}>
                  <span style={{ color: CATEGORY_COLORS[tgt.category], fontSize: 16, flexShrink: 0 }}>→</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tgt.label}</div>
                    {edge.label && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{edge.label}</div>}
                  </div>
                </button>
              );
            })}
          </section>
        )}

        {incoming.length > 0 && (
          <section>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Incoming ({incoming.length})
            </div>
            {incoming.map(edge => {
              const srcId = typeof edge.source === 'string' ? edge.source : (edge.source as GraphNode).id;
              const src = nodeMap.get(srcId);
              if (!src) return null;
              return (
                <button key={edge.id} onClick={() => onNavigate(srcId)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', background: '#111827',
                  border: '1px solid #1e293b', borderRadius: 8,
                  padding: '8px 12px', cursor: 'pointer', marginBottom: 6,
                  textAlign: 'left',
                }}>
                  <span style={{ color: CATEGORY_COLORS[src.category], fontSize: 16, flexShrink: 0 }}>←</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{src.label}</div>
                    {edge.label && <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{edge.label}</div>}
                  </div>
                </button>
              );
            })}
          </section>
        )}
      </div>
    </aside>
  );
}
