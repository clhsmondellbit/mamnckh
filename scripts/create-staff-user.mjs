import postgres from 'postgres';
import { randomBytes, scryptSync } from 'node:crypto';

const email = process.env.STAFF_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const displayName = process.env.STAFF_BOOTSTRAP_NAME?.trim();
const password = process.env.STAFF_BOOTSTRAP_PASSWORD;
const role = 'super_admin';
if (!process.env.DATABASE_URL || !email || !displayName || !password || password.length < 16) {
  console.error('Required: DATABASE_URL, STAFF_BOOTSTRAP_EMAIL, STAFF_BOOTSTRAP_NAME, STAFF_BOOTSTRAP_PASSWORD (16+ chars). This script creates only the initial Super Admin.');
  process.exit(1);
}
const salt = randomBytes(16);
const derived = scryptSync(password, salt, 64, { N:16384, r:8, p:1, maxmem:64*1024*1024 });
const passwordHash = `scrypt$16384$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const sql = postgres(process.env.DATABASE_URL, { max:1, connect_timeout:10, prepare:false });
try {
  const rows = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(87111, 9001)`;
    const existing = await tx`select count(*)::int as count from staff_users`;
    if ((existing[0]?.count || 0) > 0) throw new Error('Bootstrap is one-time only. Create later staff accounts from the protected Admin dashboard.');
    return tx`insert into staff_users (email,display_name,password_hash,role) values (${email},${displayName},${passwordHash},${role}) returning id,email,role`;
  });
  console.log(`Created staff account: ${rows[0].email} (${rows[0].role}), id=${rows[0].id}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not create staff account.');
  process.exitCode=1;
} finally { await sql.end({ timeout:5 }); }
