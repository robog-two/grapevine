'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { iconSrc } from '@/lib/icons';
import type { GraphNode, GraphEdge } from '@/lib/repo/mentions';

export function GraphView({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = searchParams.get('focus');

  const size = 560;
  const radius = Math.min(220, 60 + nodes.length * 14);
  const center = size / 2;
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, nodes.length);
    positions.set(n.id, { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) });
  });

  const focusedEdges = focus ? edges.filter((e) => e.source === focus || e.target === focus) : edges;
  const connectedIds = new Set(focusedEdges.flatMap((e) => [e.source, e.target]));

  return (
    <div style={{ position: 'relative', width: size, height: size, maxWidth: '100%', margin: '0 auto' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${size} ${size}`}>
        {focusedEdges.map((e, i) => {
          const a = positions.get(e.source);
          const b = positions.get(e.target);
          if (!a || !b) return null;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-text)" strokeWidth={1.5} />;
        })}
      </svg>
      {nodes.map((n) => {
        const pos = positions.get(n.id)!;
        const dimmed = focus && n.id !== focus && !connectedIds.has(n.id);
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => router.push(`/graph?focus=${n.id}`)}
            style={{
              position: 'absolute',
              left: pos.x - 19,
              top: pos.y - 19,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              opacity: dimmed ? 0.3 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div className={n.id === focus ? 'avatar avatar-lg' : 'avatar'}>
              <img src={iconSrc(n.iconKey)} alt="" />
            </div>
          </button>
        );
      })}
      {focus ? (
        <Link href={`/people/${focus}`} className="cap" style={{ position: 'absolute', left: 0, bottom: -28 }}>
          Open {nodes.find((n) => n.id === focus)?.name}&apos;s folder →
        </Link>
      ) : null}
      {focusedEdges[0] ? (
        <span className="help-text" style={{ position: 'absolute', right: 0, bottom: -28, maxWidth: 260, textAlign: 'right', display: 'block' }}>
          &quot;{focusedEdges[0].context}&quot;
        </span>
      ) : null}
    </div>
  );
}
