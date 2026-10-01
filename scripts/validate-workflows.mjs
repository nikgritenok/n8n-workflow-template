// pnpm validate — структурная проверка экспортов n8n в workflows/**/*.json.
// Только стандартная библиотека, зависимостей нет. Схемы незнакомых нод
// сверяются через n8n-docs (см. AGENTS.md); этот скрипт ловит только
// механические ошибки: битый JSON, пустые поля, секреты в открытом виде,
// закоммиченные pinData.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS_DIR = path.join(ROOT, "workflows");

const SECRET_KEY = /(password|passwd|secret|token|api[_-]?key|private[_-]?key)$/i;

function isExpression(value) {
  return typeof value === "string" && value.includes("{{") && value.includes("}}");
}

function scanSecrets(value, trail, hits) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSecrets(item, `${trail}[${index}]`, hits));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      // В экспорте credentials — только ссылки { id, name }, секретов там нет.
      if (key === "credentials") continue;
      if (SECRET_KEY.test(key) && typeof item === "string" && item !== "" && !isExpression(item)) {
        hits.push(`${trail}.${key}`);
      }
      scanSecrets(item, `${trail}.${key}`, hits);
    }
  }
}

async function collectJson(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err?.code === "ENOENT") return out;
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectJson(full, out);
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

function checkWorkflow(data, file, errors) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    errors.push(`${file}: корень — объект workflow, получен ${Array.isArray(data) ? "массив" : typeof data}`);
    return;
  }
  if (typeof data.name !== "string" || data.name.trim() === "") {
    errors.push(`${file}: пустое name — workflow без имени`);
  }
  if (!Array.isArray(data.nodes) || data.nodes.length === 0) {
    errors.push(`${file}: nodes — непустой массив`);
  } else {
    data.nodes.forEach((node, index) => {
      for (const field of ["id", "name", "type"]) {
        if (node === null || typeof node !== "object" || typeof node[field] !== "string" || node[field] === "") {
          errors.push(`${file}: nodes[${index}] — пустое поле ${field}`);
        }
      }
    });
  }
  if (data.connections === undefined) {
    errors.push(`${file}: нет connections — проверь экспорт и сверь через get_workflow_details`);
  } else if (data.connections === null || typeof data.connections !== "object" || Array.isArray(data.connections)) {
    errors.push(`${file}: connections — объект`);
  }
  if (data.pinData !== undefined && data.pinData !== null && Object.keys(data.pinData).length > 0) {
    errors.push(`${file}: непустое pinData — тестовые пины не коммитятся`);
  }
  const hits = [];
  scanSecrets(data, "$", hits);
  for (const hit of hits) {
    errors.push(`${file}: похоже на секрет в открытом виде: ${hit} — вынести в credentials (см. AGENTS.md)`);
  }
}

const files = await collectJson(WORKFLOWS_DIR);
if (files.length === 0) {
  console.log("workflows/*.json не найдены — пропускаю.");
  process.exit(0);
}
const errors = [];
for (const file of files) {
  const rel = path.relative(ROOT, file);
  let data;
  try {
    data = JSON.parse(await readFile(file, "utf8"));
  } catch {
    errors.push(`${rel}: невалидный JSON`);
    continue;
  }
  const before = errors.length;
  checkWorkflow(data, rel, errors);
  if (errors.length === before) console.log(`ok ${rel}`);
}
if (errors.length > 0) {
  console.error(`\n${errors.length} проблем(ы):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`\nПроверено workflow: ${files.length}.`);
