import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { mentions, mentionEdges, people } from '@/db/schema';
import { encryptField, decryptField } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import { extractMentions } from '@/lib/richtext';

/**
 * Re-derives the @mention edges for one note item from its current text.
 * Only the target person is stored per edge — the source person is the
 * item's person and is re-derived by the `mention_edges` view (3NF), so a
 * note moving to another person (e.g. a merge) re-points its edges for free.
 */
export async function syncMentionsForItem(user: AuthedUser, sourcePersonId: string, sourceItemId: string, text: string) {
  await db.delete(mentions).where(eq(mentions.sourceItemId, sourceItemId));
  const found = extractMentions(text);
  for (const m of found) {
    if (m.personId === sourcePersonId) continue; // no self-edges
    await db.insert(mentions).values({
      targetPersonId: m.personId,
      sourceItemId,
      contextSnippetEnc: encryptField(m.context, user.dek)!,
    });
  }
}

export async function deleteMentionsForItem(sourceItemId: string) {
  await db.delete(mentions).where(eq(mentions.sourceItemId, sourceItemId));
}

export interface GraphNode {
  id: string;
  name: string;
  iconKey: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  context: string;
}

export async function getRelationshipGraph(user: AuthedUser): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const peopleRows = await db
    .select({ id: people.id, nameEnc: people.nameEnc, iconKey: people.iconKey })
    .from(people)
    .where(eq(people.userId, user.userId));

  const nodes: GraphNode[] = peopleRows.map((p) => ({ id: p.id, name: decryptField(p.nameEnc, user.dek) ?? '', iconKey: p.iconKey }));
  const nodeIds = new Set(nodes.map((n) => n.id));
  if (nodeIds.size === 0) return { nodes, edges: [] };

  const edgeRows = await db.select().from(mentionEdges).where(eq(mentionEdges.userId, user.userId));

  const edges: GraphEdge[] = edgeRows
    .filter((e) => nodeIds.has(e.sourcePersonId) && nodeIds.has(e.targetPersonId))
    .map((e) => ({ source: e.sourcePersonId, target: e.targetPersonId, context: decryptField(e.contextSnippetEnc, user.dek) ?? '' }));

  return { nodes, edges };
}
