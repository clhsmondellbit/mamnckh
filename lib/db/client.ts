import 'server-only';
import postgres from 'postgres';

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('Database is not configured');
    this.name = 'DatabaseUnavailableError';
  }
}

type SqlClient = ReturnType<typeof postgres>;
type DatabaseGlobal = typeof globalThis & { __mamPhase2Sql?: SqlClient; __mamPhase2Url?: string };
const globalForDatabase = globalThis as DatabaseGlobal;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL) && process.env.ENABLE_STAFF_DASHBOARD === 'true';
}

export function getDatabase(): SqlClient {
  const url = process.env.DATABASE_URL;
  if (!url || process.env.ENABLE_STAFF_DASHBOARD !== 'true') throw new DatabaseUnavailableError();
  if (globalForDatabase.__mamPhase2Sql && globalForDatabase.__mamPhase2Url === url) return globalForDatabase.__mamPhase2Sql;
  if (globalForDatabase.__mamPhase2Sql) void globalForDatabase.__mamPhase2Sql.end({ timeout: 1 }).catch(() => undefined);
  globalForDatabase.__mamPhase2Sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 });
  globalForDatabase.__mamPhase2Url = url;
  return globalForDatabase.__mamPhase2Sql;
}
