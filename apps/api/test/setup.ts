import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Отдельная одноразовая БД для тестов: удаляем файл и создаём схему заново.
export default function setup() {
  const env = {
    ...process.env,
    DATABASE_URL: 'file:./test.db',
    CATALOG: 'generated',
    ADMIN_NICKNAME: 'testadmin',
    ADMIN_PASSWORD: 'testadmin-pass',
  };
  for (const f of ['test.db', 'test.db-journal']) rmSync(fileURLToPath(new URL(`../prisma/${f}`, import.meta.url)), { force: true });
  execSync('npx prisma db push --skip-generate', { env, stdio: 'ignore' });
  execSync('npx tsx prisma/seed.ts', { env, stdio: 'ignore' });
}
