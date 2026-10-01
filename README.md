# n8n workflow template

Шаблон репозитория под n8n workflow-проекты (агент [oh-my-pi](https://omp.sh), команда `omp`): webhook → обработка → результат.
Репозиторий создан из шаблона — дальше живёт своей жизнью.

## Быстрый старт

1. Установи pnpm 10+ и Node 24+ (версию pnpm фиксирует `packageManager`, Node — `.nvmrc`).
2. Заполни `Настройки проекта` в `AGENTS.md`: URL инстанса, префикс workflow, тег.
3. Скопируй `.env.example` в `.env` и заполни значения
4. Открой проект в `omp`: серверы из `.omp/mcp.json` подхватятся сами; OAuth-серверы

## Структура

- `.agents/skills/` + `skills-lock.json` — зафиксированные скиллы (состав задаёт lock).
- `.omp/mcp.json` — проектные MCP-серверы (`n8n-docs`, `n8n-kapa`). Глобальных быть не должно.
- `.env.example` — стандарт переменных окружения (секреты — только в локальном `.env`).
- `workflows/` — экспорты workflow n8n в JSON (пусто до первого экспорта).

## Тулчейн

Версии зафиксированы в `devDependencies` + `pnpm-lock.yaml`, CI ставит через
`pnpm install --frozen-lockfile`. Секреты — только через credentials n8n или `.env`, никогда
в параметрах workflow текстом.

## Обновление скиллов

- `pnpm run skills:update` — обновить проектные скиллы (и `skills-lock.json`,
  и `.agents/skills/`). Коммитить обновлённый lock вместе со скиллами.
- `pnpm run skills:restore` — восстановить скиллы из `skills-lock.json`.
- Добавить пакет: `pnpm exec skills add <пакет>`.

## Безопасность

Трогать можно только workflow с префиксом из `AGENTS.md` и соответствующим тегом.
Чужие id не обновлять/удалять/активировать без явной команды. Секреты — только
через credentials n8n или `.env`, никогда в параметрах текстом.
