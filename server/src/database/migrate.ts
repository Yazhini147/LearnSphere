import { runMigrations } from './migrations';
import { pool } from './pool';

async function main() {
  console.log('🗃  Running database migrations...');
  try {
    await runMigrations();
    console.log('✅ Migrations complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
