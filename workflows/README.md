# workflows/

Экспорты workflow из n8n в JSON (n8n → `⋯` → Download).

- Имя файла — как workflow в n8n, с префиксом из `AGENTS.md`
  (пример: `[nikita] tender-report.json`).
- Коммитится только экспорт из n8n, руками JSON не править.
- `pinData` перед коммитом стереть (проверяется `pnpm validate`).
- Секреты — только через credentials n8n, никогда текстом (тоже проверяется).
