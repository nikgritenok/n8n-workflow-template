// pnpm check:skills — сверка .agents/skills/ со skills-lock.json.
// Правило: состав скиллов задаёт lock-файл, папки — его материализация.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = path.join(ROOT, ".agents", "skills");
const LOCK_FILE = path.join(ROOT, "skills-lock.json");

const lock = JSON.parse(await readFile(LOCK_FILE, "utf8"));
const locked = new Set(Object.keys(lock.skills ?? {}));

const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
const onDisk = new Set(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name));

const errors = [];
for (const name of locked) {
  if (!onDisk.has(name)) errors.push(`в lock есть, на диске нет: ${name}`);
}
for (const name of onDisk) {
  if (!locked.has(name)) errors.push(`на диске есть, в lock нет: ${name}`);
}
for (const name of onDisk) {
  try {
    await readFile(path.join(SKILLS_DIR, name, "SKILL.md"), "utf8");
  } catch {
    errors.push(`нет SKILL.md: .agents/skills/${name}/SKILL.md`);
  }
}
if (errors.length > 0) {
  console.error("skills расходятся с skills-lock.json:");
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`Скиллы в порядке: ${onDisk.size}.`);
