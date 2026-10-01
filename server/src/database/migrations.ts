import fs from 'fs';
import path from 'path';
import { pool, withTransaction } from './pool';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');

interface MigrationRecord {
  filename: string;
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<MigrationRecord>(
    'SELECT filename FROM schema_migrations ORDER BY filename',
  );
  return new Set(result.rows.map((r) => r.filename));
}

async function applyMigration(filename: string, sql: string): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1)',
      [filename],
    );
  });
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let migrated = 0;

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const filepath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filepath, 'utf-8');

    console.log(`  ⬆  Applying migration: ${file}`);
    await applyMigration(file, sql);
    migrated++;
  }

  if (migrated === 0) {
    console.log('  ✓  All migrations already applied.');
  } else {
    console.log(`  ✅ Applied ${migrated} migration(s).`);
  }
}
