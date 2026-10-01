import fs from 'fs';
import path from 'path';
import { pool, withTransaction } from './pool';
import { runMigrations } from './migrations';

const SEEDS_DIR = path.resolve(__dirname, '../../../database/seeds');

async function runSeed(): Promise<void> {
  const seedFile = path.join(SEEDS_DIR, 'development.sql');

  if (!fs.existsSync(seedFile)) {
    console.warn('⚠  No seed file found at', seedFile);
    return;
  }

  const sql = fs.readFileSync(seedFile, 'utf-8');

  await withTransaction(async (client) => {
    await client.query(sql);
  });

  console.log('✅ Seed data applied.');
}

async function main() {
  console.log('🌱 Running database seed...');
  try {
    await runMigrations();
    await runSeed();
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
