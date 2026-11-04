import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from './db';
import { env } from './env';
import { httpError } from './errors';

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

function bearer(req: FastifyRequest): string | undefined {
  const h = req.headers.authorization;
  return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
}

export async function requireUser(req: FastifyRequest) {
  const id = verifyToken(bearer(req));
  if (!id) throw httpError(401, 'Нужно войти в аккаунт');
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.isBot) throw httpError(401, 'Нужно войти в аккаунт');
  if (user.isBanned) throw httpError(403, 'Аккаунт заблокирован');
  return user;
}

export async function requireAdmin(req: FastifyRequest) {
  const user = await requireUser(req);
  if (!user.isAdmin) throw httpError(403, 'Только для администраторов');
  return user;
}
