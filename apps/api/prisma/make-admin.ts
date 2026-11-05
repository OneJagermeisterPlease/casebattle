// Выдаёт права администратора: tsx prisma/make-admin.ts <ник или @telegram>
import { prisma } from '../src/db';

const who = process.argv[2]?.replace(/^@/, '');
if (!who) {
  const users = await prisma.user.findMany({ where: { isBot: false }, orderBy: { createdAt: 'asc' } });
  console.log('Укажите ник. Игроки:', users.map((u) => `${u.nickname}${u.telegramUsername ? ` (@${u.telegramUsername})` : ''}${u.isAdmin ? ' [админ]' : ''}`).join(', '));
  process.exit(1);
}
const user = await prisma.user.findFirst({ where: { OR: [{ nickname: who }, { telegramUsername: who }] } });
if (!user) {
  console.error(`Игрок ${who} не найден`);
  process.exit(1);
}
await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
console.log(`${user.nickname} теперь администратор`);
await prisma.$disconnect();
