import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const url = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/personal_crm';

export const db = drizzle({ client: neon(url), schema });
