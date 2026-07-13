import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  // eslint-disable-next-line no-var
  var __personalCrmMigrationsRun: boolean | undefined;
}

async function runMigrations() {
  if (global.__personalCrmMigrationsRun) return;

  const url =
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    'postgres://user:pass@localhost:5432/personal_crm';

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema });

  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✓ Database migrations applied');
    global.__personalCrmMigrationsRun = true;
  } catch (err) {
    console.error('✗ Failed to run migrations:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

export { runMigrations };
