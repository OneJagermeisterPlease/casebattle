import { PrismaClient, type Prisma } from '@prisma/client';
import './env';

export const prisma = new PrismaClient();
export type Tx = Prisma.TransactionClient;
