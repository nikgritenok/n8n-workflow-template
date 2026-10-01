# n8n workflow template

Шаблон репозитория под n8n workflow-проекты (агент [oh-my-pi](https://omp.sh), команда `omp`): webhook → обработка → результат.
Репозиторий создан из шаблона — дальше живёт своей жизнью.

## Быстрый старт

1. Установи pnpm 10+ и Node 24+ (версию pnpm фиксирует `packageManager`, Node — `.nvmrc`).
2. Заполни `Настройки проекта` в `AGENTS.md`: URL инстанса, префикс workflow, тег.
3. Скопируй `.env.example` в `.env` и заполни значения (`.env` не коммитится).
4. Открой проект в `omp`: серверы из `.omp/mcp.json` подхватятся сами; OAuth-серверы (`n8n-kapa`) — `/mcp reauth n8n-kapa`.
5. Положи экспорты workflow (JSON из n8n) в `workflows/`.
6. `pnpm run check` — та же проверка, что гоняет CI (зависимостей нет, `install` не нужен).

## Структура

- `.agents/skills/` + `skills-lock.json` — зафиксированные скиллы (состав задаёт lock).
- `.omp/mcp.json` — проектные MCP-серверы (`n8n-docs`, `n8n-kapa`). Глобальных быть не должно.
- `.env.example` — стандарт переменных окружения (секреты — только в локальном `.env`).
- `workflows/` — экспорты workflow n8n в JSON (пусто до первого экспорта).

## Проверки

- `pnpm validate` — каждый `workflows/**/*.json`: валидный JSON, непустые
  `name`/`nodes`/`connections`, нет секретов в открытом виде, нет закоммиченного `pinData`;
  плюс `.omp/mcp.json` валиден и без секретов, `.env.example` на месте и без живых токенов.
- `pnpm run check:skills` — папки `.agents/skills/` один в один соответствуют
  `skills-lock.json`, у каждой есть `SKILL.md`.

## Обновление скиллов

- `pnpm run skills:update` — обновить проектные скиллы (и `skills-lock.json`,
  и `.agents/skills/`). Коммитить обновлённый lock вместе со скиллами.
- `pnpm run skills:restore` — восстановить скиллы из `skills-lock.json`.
- Добавить пакет: `pnpm dlx skills add <пакет>`.

## Безопасность

Трогать можно только workflow с префиксом из `AGENTS.md` и соответствующим тегом.
Чужие id не обновлять/удалять/активировать без явной команды. Секреты — только
через credentials n8n или `.env`, никогда в параметрах текстом.
