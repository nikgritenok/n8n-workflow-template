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

Тулчейн зафиксирован в `devDependencies` + `pnpm-lock.yaml`, CI ставит через
`pnpm install --frozen-lockfile`. После клонирования: `pnpm install`.

- **Node 24+, pnpm 10+** — версии фиксируют `packageManager` и `.nvmrc`.
- **skills CLI** (пакет [`skills`](https://www.npmjs.com/package/skills), `1.7.0`) — установка и обновление скиллов:
  - `pnpm exec skills list` — что установлено в проекте;
  - `pnpm run skills:update` — обновить проектные скиллы до свежих версий (обновляет и `skills-lock.json`, и `.agents/skills/`);
  - `pnpm run skills:restore` — восстановить скиллы из `skills-lock.json` (если папки не закоммичены или разошлись);
  - `pnpm exec skills add <пакет>` — добавить новый пакет скиллов.
- **n8n CLI** (пакет [`@n8n/cli`](https://www.npmjs.com/package/@n8n/cli), `0.20.0` в `devDependencies`, бинарь — `n8n-cli`, подключение — `pnpm exec n8n-cli login`) — работа с инстансом из терминала.
- **mermaid-cli** — схемы процессов.
- Локальная проверка тулчейна: `pnpm install --frozen-lockfile && pnpm exec skills --version && pnpm exec n8n-cli --version`.

## MCP-серверы (проектные, `.omp/mcp.json`)

- `n8n-docs` — официальные доки n8n (Streamable HTTP). Источник истины по синтаксису нод, конфигам, миграциям.
- `n8n-kapa` — доки+форум+блог через Kapa AI (Streamable HTTP, OAuth): `omp` → `/mcp reauth n8n-kapa`, токен хранится в профиле (`agent.db`), не в репо.
- Свои серверы добавляются также в `.omp/mcp.json` (`/mcp add`, scope Project). Секреты — только через `${VAR}` из `.env` (см. `.env.example`), никогда текстом.
- Перед генерацией JSON workflow с незнакомыми нодами — искать схему в `n8n-docs`.

## Ограничения

- Ответы LLM при нехватке данных — вопросы, а не выдуманные факты.
- Скиллы в `.agents/skills/`: состав задаёт `skills-lock.json`; обновление — только через `skills update`, руками папки не править. При работе с нодами, выражениями, JSON workflow или логикой агентов — сверяться с `using-n8n-skills-official`.
- Workflows — JSON в `workflows/`; секреты только через credentials n8n, никогда текстом в параметрах.

## CODE STYLE

- Do not add unnecessary comments
