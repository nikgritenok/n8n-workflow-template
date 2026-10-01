// pnpm validate — проверка проектных артефактов без зависимостей.
// 1. workflows/**/*.json: валидный JSON, непустые name/nodes/connections,
//    нет секретов в открытом виде, нет закоммиченного pinData.
// 2. .omp/mcp.json: валидный JSON с mcpServers, без секретов текстом
//    (допустимы только ${VAR}-ссылки; OAuth-токены живут в профиле omp).
// 3. .env.example: существует, без живых токенов (только плейсхолдеры).
// Схемы незнакомых нод сверяются через n8n-docs (см. AGENTS.md).
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS_DIR = path.join(ROOT, "workflows");
const MCP_FILE = path.join(ROOT, ".omp", "mcp.json");
const ENV_EXAMPLE = path.join(ROOT, ".env.example");

const SECRET_KEY = /(password|passwd|secret|token|api[_-]?key|private[_-]?key)$/i;

function isExpression(value) {
  return typeof value === "string" && value.includes("{{") && value.includes("}}");
}

// Ссылка на переменную окружения (${VAR} / ${VAR:-default}) — не секрет.
function isEnvRef(value) {
  return typeof value === "string" && /\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}/.test(value);
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
      if (SECRET_KEY.test(key) && typeof item === "string" && item !== "" && !isExpression(item) && !isEnvRef(item)) {
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

async function checkMcp(errors) {
  let data;
  try {
    data = JSON.parse(await readFile(MCP_FILE, "utf8"));
  } catch {
    errors.push(".omp/mcp.json: нет или невалидный JSON — проектные MCP-серверы обязательны");
    return;
  }
  const servers = data?.mcpServers;
  if (servers === null || typeof servers !== "object" || Array.isArray(servers) || Object.keys(servers).length === 0) {
    errors.push(".omp/mcp.json: нужен непустой объект mcpServers");
    return;
  }
  let ok = true;
  for (const name of ["n8n-docs", "n8n-kapa"]) {
    const server = servers[name];
    if (server === null || typeof server !== "object" || Array.isArray(server)) {
      errors.push(`.omp/mcp.json: нет сервера "${name}"`);
      ok = false;
      continue;
    }
    if (typeof server.url !== "string" || server.url === "" || server.command !== undefined) {
      errors.push(`.omp/mcp.json: "${name}" — удалённый сервер: нужен url без command`);
      ok = false;
    }
    if (server.type !== undefined && server.type !== "http" && server.type !== "sse") {
      errors.push(`.omp/mcp.json: "${name}" — type только http/sse`);
      ok = false;
    }
  }
  const hits = [];
  scanSecrets(data, "$", hits);
  for (const hit of hits) {
    errors.push(`.omp/mcp.json: секрет в открытом виде: ${hit} — только \${VAR} из .env или OAuth профиля`);
    ok = false;
  }
  if (ok) console.log("ok .omp/mcp.json");
}

async function checkEnvExample(errors) {
  let text;
  try {
    text = await readFile(ENV_EXAMPLE, "utf8");
  } catch {
    errors.push(".env.example: файл обязателен — стандарт переменных окружения");
    return;
  }
  let dotEnv = null;
  try {
    await access(path.join(ROOT, ".env"));
    dotEnv = true;
  } catch {
    dotEnv = false;
  }
  if (dotEnv) errors.push(".env закоммичен или лежит в проекте — только локально, в репо лишь .env.example");
  const suspicious = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      suspicious.push(`плохая строка: ${trimmed.slice(0, 40)}`);
      continue;
    }
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value !== "" && !/<[^<>]+>/.test(value) && !isEnvRef(value)) suspicious.push(`${match[1]} похож на живое значение`);
  }
  if (suspicious.length > 0) {
    for (const item of suspicious) errors.push(`.env.example: ${item} — только плейсхолдеры <...>`);
  } else {
    console.log("ok .env.example");
  }
}

const files = await collectJson(WORKFLOWS_DIR);
const errors = [];
await checkMcp(errors);
await checkEnvExample(errors);
if (files.length === 0) {
  console.log("workflows/*.json не найдены — пропускаю.");
} else {
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
  console.log(`\nПроверено workflow: ${files.length}.`);
}
if (errors.length > 0) {
  console.error(`\n${errors.length} проблем(ы):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log("\nПроверки прошли.");
