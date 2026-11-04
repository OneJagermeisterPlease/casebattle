# Как работаем (3 человека)

## Ветки
- `main` — всегда рабочая, защищена: только через Pull Request, нужен 1 approve и зелёный CI.
- Рабочие ветки: `feat/<коротко>`, `fix/<коротко>`, `chore/<коротко>`, например `feat/battle-lobby`.
- Одна задача (issue) = одна ветка = один PR. PR маленькие, до ~400 строк по возможности.

## Коммиты
[Conventional Commits](https://www.conventionalcommits.org/ru/): `feat(api): battle rounds`, `fix(web): roulette offset`, `docs: roadmap`.

## Задачи
- Все задачи — в GitHub Issues, доска — GitHub Projects (колонки: Backlog → To do → In progress → Review → Done).
- Берёшь задачу — назначь себя и перетащи в *In progress*.
- В PR пиши `Closes #<номер>`.

## Ревью
- Ревьюит любой другой участник команды. Отвечаем на ревью в течение суток.
- Автор сам мержит после approve (squash merge).

## Зоны ответственности (стартовые, можно меняться)
| Участник | Зона |
|---|---|
| Dev 1 | Backend: аккаунты, кошелёк, кейсы, provably fair, БД |
| Dev 2 | Backend realtime: кейс-батлы, WebSocket, лобби, боты, апгрейд |
| Dev 3 | Frontend: UI-кит, страницы, анимации рулетки и батлов |

## Важно
Проект — демо. Никакой интеграции с платёжками, реальными деньгами, скинами или внешними маркетплейсами.
