import { and, eq, desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { timelineEvents, timelineFeed } from '@/db/schema';
import { encryptJSON, decryptJSON } from '@/lib/crypto';
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
    .from(timelineFeed)
    .where(and(eq(timelineFeed.personId, personId), eq(timelineFeed.userId, user.userId)))
    .orderBy(desc(timelineFeed.createdAt));

  return rows.map((r) => ({
    id: r.id,
    changeType: r.changeType as ChangeType,
    label: decryptJSON<string>(r.labelEnc, user.dek),
    snapshot: decryptJSON(r.snapshotEnc, user.dek),
    createdAt: r.createdAt,
  }));
}
