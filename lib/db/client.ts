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

function connection() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseUnavailableError();
  if (globalForDatabase.__mamPhase2Sql && globalForDatabase.__mamPhase2Url === url) return globalForDatabase.__mamPhase2Sql;
  if (globalForDatabase.__mamPhase2Sql) void globalForDatabase.__mamPhase2Sql.end({ timeout: 1 }).catch(() => undefined);
  globalForDatabase.__mamPhase2Sql = postgres(url, { prepare: false, max: 5, idle_timeout: 20, connect_timeout: 10 });
  globalForDatabase.__mamPhase2Url = url;
  return globalForDatabase.__mamPhase2Sql;
}

/** Staff-only data access retains the explicit dashboard feature gate. */
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL) && process.env.ENABLE_STAFF_DASHBOARD === 'true';
}

export function getDatabase(): SqlClient {
  if (process.env.ENABLE_STAFF_DASHBOARD !== 'true') throw new DatabaseUnavailableError();
  return connection();
}

/** Public knowledge search is read-only at the API boundary and does not depend
 * on whether the optional staff dashboard is enabled. */
export function isKnowledgeDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getKnowledgeDatabase(): SqlClient {
  return connection();
}
