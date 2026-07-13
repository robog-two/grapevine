import { runMigrations } from '@/db/init';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await runMigrations();
    return Response.json({ status: 'ok' });
  } catch (err) {
    return Response.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
