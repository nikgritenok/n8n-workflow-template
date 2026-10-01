# n8n workflow template

Шаблон репозитория под n8n workflow-проекты: webhook → обработка → результат.
Репозиторий создан из шаблона — дальше живёт своей жизнью.

## Быстрый старт

1. Установи pnpm 10+ и Node 24+ (версию pnpm фиксирует `packageManager`, Node — `.nvmrc`).
2. Заполни `Настройки проекта` в `AGENTS.md`: URL инстанса, префикс workflow, тег.
3. Положи экспорты workflow (JSON из n8n) в `workflows/`.
4. `pnpm run check` — та же проверка, что гоняет CI (зависимостей нет, `install` не нужен).

## Структура

- `.agents/skills/` + `skills-lock.json` — зафиксированные скиллы (состав задаёт lock).
- `workflows/` — экспорты workflow n8n в JSON (пусто до первого экспорта).
- `scripts/` — проверки без зависимостей: `validate-workflows.mjs`, `check-skills.mjs`.
- `.github/workflows/validate.yml` — CI: `pnpm run check`.

## Проверки

- `pnpm validate` — каждый `workflows/**/*.json`: валидный JSON, непустые
  `name`/`nodes`/`connections`, нет секретов в открытом виде, нет закоммиченного `pinData`.
- `pnpm run check:skills` — папки `.agents/skills/` один в один соответствуют
  `skills-lock.json`, у каждой есть `SKILL.md`.

## Обновление скиллов

- `pnpm run skills:update` — обновить проектные скиллы (и `skills-lock.json`,
  и `.agents/skills/`). Коммитить обновлённый lock вместе со скиллами.
- `pnpm run skills:restore` — восстановить скиллы из `skills-lock.json`.
- Добавить пакет: `pnpm dlx skills add <пакет>`.

## Безопасность (общий боевой инстанс)

Трогать можно только workflow с префиксом из `AGENTS.md` и соответствующим тегом.
Чужие id не обновлять/удалять/активировать без явной команды. Секреты — только
через credentials n8n, никогда в параметрах текстом.
