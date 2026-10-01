import { pool } from './pool';

async function main() {
  console.log('🗑  Resetting database...');
  try {
    // Drop all tables by dropping the public schema and recreating it
    await pool.query('DROP SCHEMA public CASCADE');
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO postgres');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✅ Database schema reset. Run db:migrate and db:seed to re-initialize.');
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
