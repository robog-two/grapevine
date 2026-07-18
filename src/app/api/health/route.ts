import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ status: 'ok' });
  } catch (err) {
    return Response.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
