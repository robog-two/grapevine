import Link from 'next/link';
import { requirePageUser } from '@/lib/session';
import { getRelationshipGraph } from '@/lib/repo/mentions';
import { GraphView } from '@/components/GraphView';

export default async function GraphPage() {
  const user = await requirePageUser();
  const { nodes, edges } = await getRelationshipGraph(user);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 20 }}>Relationship graph</div>
        <div className="seg" style={{ fontSize: 12 }}>
          <Link href="/people" className="seg-opt">
            Table
          </Link>
          <span className="seg-opt" data-active="true">
            Graph
          </span>
        </div>
      </div>
      {nodes.length === 0 ? (
        <p className="help-text">No one yet — add people, then @mention them in a note to connect them here.</p>
      ) : edges.length === 0 ? (
        <>
          <GraphView nodes={nodes} edges={edges} />
          <p className="help-text" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
            No @mentions yet — mention someone in a note (e.g. &quot;met via @Ava Kim&quot;) to draw a connection.
          </p>
        </>
      ) : (
        <GraphView nodes={nodes} edges={edges} />
      )}
      <p className="help-text" style={{ marginTop: 'var(--space-4)' }}>
        edge label = @mention context sentence · click a node to focus its connections
      </p>
    </div>
  );
}
