# Case Battle (demo)

Демо-платформа открытия кейсов и кейс-батлов **на выдуманной валюте**.
Механики — в духе популярных case-battle сайтов, но:

- 🪙 только демо-монеты (**coins**), которые выдаются бесплатно;
- ❌ нет депозитов, выводов, обмена на реальные деньги или предметы;
- ❌ монеты и предметы не имеют реальной ценности и не продаются.

> Бренд, дизайн и графику делаем свои — не копируем чужой сайт.

## Функционал (MVP → дальше)

| Модуль | Что делает |
|---|---|
| Аккаунт | Регистрация/вход (email + пароль или OAuth), профиль, аватар |
| Кошелёк | Стартовый баланс, ежедневный бонус, история транзакций (только демо-coins) |
| Кейсы | Каталог кейсов, содержимое с шансами, анимация рулетки, открытие x1–x5 |
| Инвентарь | Выпавшие предметы, «продажа» за coins, вывод — **нет** |
| Кейс-батлы | Лобби, режимы 1v1 / 1v1v1 / 1v1v1v1 / 2v2, боты, live через WebSocket, победитель забирает всё |
| Апгрейд | Обмен предмета на более дорогой с шансом |
| Provably fair | server seed + client seed + nonce, проверка любого результата |
| Соц. часть | Live-лента дропов, лидерборд, чат |
| Админка | CRUD кейсов/предметов, шансы, выдача coins |

Подробный план и разделение задач — в [docs/ROADMAP.md](docs/ROADMAP.md).

## Стек

- **apps/web** — Next.js (App Router) + React + TypeScript
- **apps/api** — NestJS + Socket.IO + Prisma
- **packages/shared** — общие типы и provably-fair логика (используется и фронтом, и бэком)
- **PostgreSQL** — основное хранилище, **Redis** — очереди/лобби батлов/pub-sub
- **pnpm workspaces**, Docker Compose для локальной инфраструктуры, GitHub Actions CI

## Быстрый старт

Нужно: Node.js 22 (см. `.nvmrc`), pnpm 9+, Docker.

```bash
corepack enable
pnpm install
cp .env.example .env
docker compose up -d          # postgres + redis
pnpm --filter api prisma migrate dev
pnpm dev                      # web: http://localhost:3000, api: http://localhost:4000
```

## Структура

```
apps/
  web/        фронтенд
  api/        бэкенд (REST + WebSocket)
packages/
  shared/     типы, provably fair, константы
docs/         роадмап, архитектура, решения
```

## Как работаем

Правила веток, коммитов и ревью — в [CONTRIBUTING.md](CONTRIBUTING.md).
