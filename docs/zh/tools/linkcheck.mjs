// 检查 docs/zh 下所有相对链接是否能解析到仓库内的真实文件。
// 用法：node docs/zh/tools/linkcheck.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const zhRoot = join(here, "..");

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? (e.name === "tools" ? [] : walk(join(dir, e.name))) : e.name.endsWith(".md") && !e.name.includes(".part") ? [join(dir, e.name)] : [],
  );

const files = walk(zhRoot);
let bad = 0;
let links = 0;
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const targets = [
    ...[...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]),
    ...[...text.matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const t of targets) {
    if (/^(https?:|mailto:|#)/.test(t)) continue;
    links++;
    const path = decodeURI(t.split("#")[0]);
    if (!path) continue;
    const abs = resolve(dirname(file), path);
    const ok = existsSync(abs) && (path.endsWith("/") ? statSync(abs).isDirectory() : true);
    if (!ok) {
      bad++;
      console.log("BROKEN", file.replace(zhRoot + "/", ""), "->", t);
    }
  }
}
console.log("links:", links, "broken:", bad, "files:", files.length);
process.exitCode = bad ? 1 : 0;