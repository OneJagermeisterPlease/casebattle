import cors from '@fastify/cors';
import Fastify from 'fastify';
import { ZodError } from 'zod';
import { env } from './env';
import { HttpError } from './errors';
import { adminRoutes } from './routes/admin';
import { authRoutes } from './routes/auth';
import { battleRoutes } from './routes/battles';
import { catalogRoutes } from './routes/catalog';
import { playRoutes } from './routes/play';
import { socialRoutes } from './routes/social';
import { telegramRoutes } from './routes/telegram';

export async function buildApp({ logger = false } = {}) {
  const app = Fastify({ logger });
  await app.register(cors, { origin: env.webOrigin });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) return reply.status(err.status).send({ error: err.message });
    if (err instanceof ZodError) return reply.status(400).send({ error: err.issues[0]?.message ?? 'Неверные данные' });
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) return reply.status(status).send({ error: (err as Error).message });
    app.log.error(err);
    return reply.status(500).send({ error: 'Внутренняя ошибка сервера' });
  });

  app.get('/health', async () => ({ status: 'ok' }));
  await app.register(authRoutes);
  await app.register(telegramRoutes);
  await app.register(catalogRoutes);
  await app.register(playRoutes);
  await app.register(socialRoutes);
  await app.register(battleRoutes);
  await app.register(adminRoutes);
  return app;
}
