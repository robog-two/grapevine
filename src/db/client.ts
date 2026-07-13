import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { runMigrations } from './init';

declare global {
  // eslint-disable-next-line no-var
  var __personalCrmSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  // Prefer Vercel Postgres connection strings in production:
  // - POSTGRES_PRISMA_URL: pooled connection (use for serverless functions)
  // - DATABASE_URL_UNPOOLED: direct connection (use for migrations)
  // Falls back to DATABASE_URL for other providers or local development
  const url =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    'postgres://user:pass@localhost:5432/personal_crm';
  return postgres(url, { max: 5 });
}

// Reuse the connection across hot reloads / lambda invocations.
const sql = global.__personalCrmSql ?? createClient();
if (process.env.NODE_ENV !== 'production') global.__personalCrmSql = sql;

export const db = drizzle(sql, { schema });

// Run migrations on first client initialization (non-blocking for performance)
if (typeof global !== 'undefined' && !global.__personalCrmMigrationsRun) {
  runMigrations().catch(err => console.error('Failed to run migrations:', err));
}
