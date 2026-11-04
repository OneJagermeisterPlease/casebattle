import { buildApp } from './app';
import { resumeBattles } from './battles/runner';
import { env } from './env';
import { attachRealtime } from './realtime';
import { startTelegramBot } from './telegram';

const app = await buildApp({ logger: true });
attachRealtime(app.server);
await app.listen({ port: env.port, host: '0.0.0.0' });
await resumeBattles();
void startTelegramBot((msg) => app.log.info(msg));
