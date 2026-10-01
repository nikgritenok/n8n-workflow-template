# AGENTS.md

> Шаблон репозитория под n8n workflow-проекты для агента
> [oh-my-pi](https://omp.sh) (команда `omp`). После создания из шаблона
> (GitHub → Use this template) заполни раздел «Настройки проекта».

## Настройки проекта

- **N8N_INSTANCE_URL:** `https://<инстанс>`
- **WORKFLOW_PREFIX:** `[<префикс>]` (пример: `[nikita]`)
- **WORKFLOW_TAG:** `<тег>` (пример: `nikita`)
- ⚠️ Если инстанс общий боевой: трогать можно только объекты с префиксом и тегом выше; любое update/delete/activate чужого id запрещено без явной команды пользователя.

## Инструменты (pnpm — единственный менеджер пакетов)

- **Node 24+, pnpm 10+** — версии фиксируют `packageManager` и `.nvmrc`.
- **skills CLI** (`pnpm dlx skills`, пакет [`skills`](https://www.npmjs.com/package/skills)) — установка и обновление скиллов:
  - `pnpm dlx skills list` — что установлено в проекте;
  - `pnpm dlx skills update -p -y` — обновить проектные скиллы до свежих версий (обновляет и `skills-lock.json`, и `.agents/skills/`);
  - `pnpm dlx skills experimental_install` — восстановить скиллы из `skills-lock.json` (если папки не закоммичены или разошлись);
  - `pnpm dlx skills add <пакет>` — добавить новый пакет скиллов.
- **n8n CLI** ([`@n8n/cli`](https://www.npmjs.com/package/@n8n/cli), глобально: `pnpm add -g @n8n/cli`) — работа с инстансом из терминала. Бинарь называется `n8n-cli`, подключение — `n8n-cli login`. Глобальная установка в проект не коммитится.
- **mermaid-cli** — схемы процессов.
- Локальные проверки: `pnpm run check` (`validate` + `check:skills`). CI гоняет то же самое, зависимостей нет — `install` не нужен.

## MCP-серверы (проектные, `.omp/mcp.json`)

- `n8n-docs` — официальные доки n8n (Streamable HTTP). Источник истины по синтаксису нод, конфигам, миграциям.
- `n8n-kapa` — доки+форум+блог через Kapa AI (Streamable HTTP, OAuth): `omp` → `/mcp reauth n8n-kapa`, токен хранится в профиле (`agent.db`), не в репо.
- Свои серверы добавляются также в `.omp/mcp.json` (`/mcp add`, scope Project). Секреты — только через `${VAR}` из `.env` (см. `.env.example`), никогда текстом.
- Перед генерацией JSON workflow с незнакомыми нодами — искать схему в `n8n-docs`.

## Ограничения

- Ответы LLM при нехватке данных — вопросы, а не выдуманные факты.
- Скиллы в `.agents/skills/`: состав задаёт `skills-lock.json` (сверяется `pnpm run check:skills`; обновление — только через `skills update`, руками папки не править). При работе с нодами, выражениями, JSON workflow или логикой агентов — сверяться с `using-n8n-skills-official`.
- Экспорты workflow — JSON в `workflows/`; секреты только через credentials n8n, никогда текстом в параметрах (ловится `pnpm validate`).
