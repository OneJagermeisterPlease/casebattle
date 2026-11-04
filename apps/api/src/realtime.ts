import type { Server as HttpServer } from 'node:http';
import type { BattleDTO, DropDTO } from '@casebattle/shared';
import { Server } from 'socket.io';
import { prisma } from './db';
import { env } from './env';
import { dropDTO } from './serialize';

let io: Server | null = null;

export function attachRealtime(server: HttpServer) {
  io = new Server(server, { cors: { origin: env.webOrigin } });
  io.on('connection', (socket) => {
    socket.join('feed');
    socket.on('battle:watch', (id: unknown) => typeof id === 'string' && socket.join(`battle:${id}`));
    socket.on('battle:unwatch', (id: unknown) => typeof id === 'string' && socket.leave(`battle:${id}`));
    socket.on('lobby:watch', () => socket.join('lobby'));
    socket.on('lobby:unwatch', () => socket.leave('lobby'));
  });
  const timer = setInterval(() => void emitStats(), 10_000);
  io.on('close', () => clearInterval(timer));
  return io;
}

export function closeRealtime() {
  io?.close();
  io = null;
}

export async function emitStats() {
  if (!io) return;
  const totalDrops = await prisma.inventoryItem.count();
  io.to('feed').emit('stats', { online: io.engine.clientsCount, totalDrops });
}

export async function emitDrops(ids: string[]) {
  if (!io || ids.length === 0) return;
  const rows = await prisma.inventoryItem.findMany({
    where: { id: { in: ids } },
    include: { item: true, user: true, case: true },
  });
  const drops: DropDTO[] = rows.map(dropDTO);
  for (const d of drops) io.to('feed').emit('drop', d);
}

export function emitBattle(event: string, battle: BattleDTO, extra: Record<string, unknown> = {}) {
  if (!io) return;
  io.to(`battle:${battle.id}`).emit(event, { battle, ...extra });
  io.to('lobby').emit('lobby:update', battle);
}
