import type { CaseDetailDTO } from '@casebattle/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { httpError } from '../errors';
import { caseDTO, itemDTO } from '../serialize';
import { getSettings } from '../settings';

export async function catalogRoutes(app: FastifyInstance) {
  app.get('/config', async () => getSettings());

  app.get('/cases', async () => {
    const cases = await prisma.case.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } }, items: { include: { item: true } } },
    });
    return cases.map(caseDTO);
  });

  app.get('/cases/:slug', async (req): Promise<CaseDetailDTO> => {
    const { slug } = req.params as { slug: string };
    const c = await prisma.case.findUnique({
      where: { slug },
      include: { items: { include: { item: true } }, _count: { select: { items: true } } },
    });
    if (!c || !c.isActive) throw httpError(404, 'Кейс не найден');
    const total = c.items.reduce((s, ci) => s + ci.weight, 0);
    return {
      ...caseDTO(c),
      items: c.items
        .map((ci) => ({ ...itemDTO(ci.item), chance: ci.weight / total }))
        .sort((a, b) => b.price - a.price),
    };
  });

  app.get('/items', async (req) => {
    const q = z
      .object({
        search: z.string().trim().optional(),
        minPrice: z.coerce.number().int().optional(),
        maxPrice: z.coerce.number().int().optional(),
        kind: z.string().optional(),
        rarity: z.string().optional(),
        sort: z.enum(['asc', 'desc']).default('asc'),
        limit: z.coerce.number().int().min(1).max(200).default(60),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);
    const where = {
      price: { gte: q.minPrice, lte: q.maxPrice },
      kind: q.kind,
      rarity: q.rarity,
      ...(q.search ? { OR: [{ weapon: { contains: q.search } }, { finish: { contains: q.search } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.item.findMany({ where, orderBy: { price: q.sort }, take: q.limit, skip: q.offset }),
      prisma.item.count({ where }),
    ]);
    return { items: items.map(itemDTO), total };
  });
}
