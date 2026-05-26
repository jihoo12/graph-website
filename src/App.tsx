import { useState, useMemo } from 'react';
import GraphView from './GraphView';
import Sidebar from './Sidebar';
import { graphData } from './data';
import type { NodeCategory } from './types';

const CATEGORIES: { value: NodeCategory | 'all'; label: string; color: string }[] = [
  { value: 'all',      label: 'All',        color: '#94a3b8' },
  { value: 'core',     label: 'Core',       color: '#6366f1' },
  { value: 'service',  label: 'Services',   color: '#38bdf8' },
  { value: 'database', label: 'Databases',  color: '#4ade80' },
  { value: 'external', label: 'External',   color: '#fb923c' },
  { value: 'user',     label: 'Clients',    color: '#f472b6' },
];

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<NodeCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const selectedNode = useMemo(
    () => graphData.nodes.find(n => n.id === selectedId) ?? null,
    [selectedId]
  );

  const filteredData = useMemo(() => {
    if (!search.trim()) return graphData;
    const q = search.toLowerCase();
    const matchingNodes = graphData.nodes.filter(
      n => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
    );
    const matchingIds = new Set(matchingNodes.map(n => n.id));
    return {
      nodes: matchingNodes,
      edges: graphData.edges.filter(e => {
        const src = typeof e.source === 'string' ? e.source : e.source.id;
        const tgt = typeof e.target === 'string' ? e.target : e.target.id;
        return matchingIds.has(src) && matchingIds.has(tgt);
      }),
    };
  }, [search]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      background: '#080c12',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      color: '#f1f5f9',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <header style={{
        height: 52,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px',
        background: '#0d1117',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo / title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" fill="#6366f1"/>
            <circle cx="3" cy="5" r="2" fill="#38bdf8"/>
            <circle cx="17" cy="5" r="2" fill="#38bdf8"/>
            <circle cx="3" cy="15" r="2" fill="#4ade80"/>
            <circle cx="17" cy="15" r="2" fill="#4ade80"/>
            <line x1="10" y1="10" x2="3" y2="5" stroke="#334155" strokeWidth="1"/>
            <line x1="10" y1="10" x2="17" y2="5" stroke="#334155" strokeWidth="1"/>
            <line x1="10" y1="10" x2="3" y2="15" stroke="#334155" strokeWidth="1"/>
            <line x1="10" y1="10" x2="17" y2="15" stroke="#334155" strokeWidth="1"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
            Graph View
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 220px' }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="#94a3b8" strokeWidth="1.5"/>
            <line x1="9" y1="9" x2="12" y2="12" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: 8, padding: '5px 10px 5px 28px',
              fontSize: 12, color: '#f1f5f9',
              outline: 'none',
            }}
          />
        </div>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: filterCategory === cat.value ? cat.color : '#1e293b',
                background: filterCategory === cat.value ? cat.color + '22' : 'transparent',
                color: filterCategory === cat.value ? cat.color : '#64748b',
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'all 0.15s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ fontSize: 11, color: '#475569', display: 'flex', gap: 12, flexShrink: 0 }}>
          <span><b style={{ color: '#94a3b8' }}>{filteredData.nodes.length}</b> nodes</span>
          <span><b style={{ color: '#94a3b8' }}>{filteredData.edges.length}</b> edges</span>
        </div>
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Grid background */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>

          <GraphView
            data={filteredData}
            selectedId={selectedId}
            onSelect={setSelectedId}
            filterCategory={filterCategory}
          />

          {/* Hint */}
          {!selectedId && (
            <div style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: '#0d1117cc', backdropFilter: 'blur(8px)',
              border: '1px solid #1e293b', borderRadius: 20,
              padding: '6px 16px', fontSize: 11, color: '#64748b',
              pointerEvents: 'none',
            }}>
              Click a node to explore · Drag to reposition · Scroll to zoom
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar
          node={selectedNode}
          allNodes={graphData.nodes}
          edges={graphData.edges}
          onClose={() => setSelectedId(null)}
          onNavigate={setSelectedId}
        />
      </div>
    </div>
  );
}
