import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED && !process.env.POSTGRES_PRISMA_URL) {
  // Allow `drizzle-kit` introspection commands to load without a live DB URL
  // during CI; migrations/push still require a real DATABASE_URL.
  process.env.DATABASE_URL ??= 'postgres://user:pass@localhost:5432/personal_crm';
}

// For migrations, prefer the unpooled connection (required for schema changes)
const dbUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  'postgres://user:pass@localhost:5432/personal_crm';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
  strict: true,
  verbose: true,
});
