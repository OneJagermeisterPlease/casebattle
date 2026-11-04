import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './test/setup.ts',
    env: {
      DATABASE_URL: 'file:./test.db',
      CATALOG: 'generated',
      BATTLE_ROUND_MS: '5',
      BATTLE_START_DELAY_MS: '5',
      ADMIN_NICKNAME: 'testadmin',
      ADMIN_PASSWORD: 'testadmin-pass',
      TELEGRAM_BOT_TOKEN: '',
    },
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
  },
});
