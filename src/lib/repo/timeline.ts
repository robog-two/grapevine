import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { timelineEvents } from '@/db/schema';
import { encryptJSON, decryptJSON, decryptField } from '@/lib/crypto';
import type { AuthedUser } from '@/lib/session';
import type { ChangeType } from './types';

export async function logTimelineEvent(
  user: AuthedUser,
  personId: string,
  itemId: string | null,
  changeType: ChangeType,
  label: string,
  snapshot: unknown,
) {
  await db.insert(timelineEvents).values({
    userId: user.userId,
    personId,
    itemId,
    changeType,
    labelEnc: encryptJSON(label, user.dek),
    snapshotEnc: encryptJSON(snapshot, user.dek),
  });
}

export interface TimelineEntry {
  id: string;
  changeType: ChangeType;
  label: string;
  snapshot: unknown;
  createdAt: Date;
}

export async function listTimeline(user: AuthedUser, personId: string): Promise<TimelineEntry[]> {
  const rows = await db
    .select()
    .from(timelineEvents)
    .where(and(eq(timelineEvents.personId, personId), eq(timelineEvents.userId, user.userId)))
    .orderBy(desc(timelineEvents.createdAt));

  return rows.map((r) => ({
    id: r.id,
    changeType: r.changeType as ChangeType,
    label: decryptJSON<string>(r.labelEnc, user.dek),
    snapshot: decryptJSON(r.snapshotEnc, user.dek),
    createdAt: r.createdAt,
  }));
}
