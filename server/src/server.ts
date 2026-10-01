import { config } from './config/env';
import { testConnection } from './database/pool';
import { runMigrations } from './database/migrations';
import app from './app';

async function main() {
  try {
    await testConnection();
    await runMigrations();

    app.listen(config.SERVER_PORT, () => {
      console.log(`🚀 LearnSphere API running on port ${config.SERVER_PORT}`);
      console.log(`   ENV: ${config.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();
