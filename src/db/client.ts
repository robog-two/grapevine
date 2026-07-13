import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __personalCrmSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  // `postgres()` doesn't open a connection until the first query, so it's
  // safe to construct with a placeholder when DATABASE_URL isn't set yet —
  // this keeps `next build`'s static page-data collection (which imports
  // every route module but sends no real requests) from failing before the
  // app is even deployed. A real request against an unconfigured database
  // will fail naturally at query time instead.
  const url = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/personal_crm';
  return postgres(url, { max: 5 });
}

// Reuse the connection across hot reloads / lambda invocations.
const sql = global.__personalCrmSql ?? createClient();
if (process.env.NODE_ENV !== 'production') global.__personalCrmSql = sql;

export const db = drizzle(sql, { schema });
