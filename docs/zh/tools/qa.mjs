// 校验中文译文与英文原文的结构一致性：代码块逐字相同、标题层级、表格行数一致，
// 且原文里的每个显式锚点都仍然存在于译文中。
// 用法：node docs/zh/tools/qa.mjs
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ZH = join(here, "..", "coding-agent");
const SRC = join(here, "..", "..", "..", "packages", "coding-agent", "docs");

const fences = (t) => {
  const out = [];
  const re = /^\x60{3,}([^\n]*)\n([\s\S]*?)^\x60{3,}\s*$/gm;
  let m;
  while ((m = re.exec(t))) out.push(m[2]);
  return out;
};
const shape = (t) => ({
  h1: (t.match(/^# /gm) || []).length,
  h2: (t.match(/^## /gm) || []).length,
  h3: (t.match(/^### /gm) || []).length,
  h4: (t.match(/^#### /gm) || []).length,
  rows: (t.match(/^\|/gm) || []).length,
  fences: fences(t).length,
});
const anchors = (t) => new Set([...t.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));

const files = readdirSync(ZH).filter((f) => f.endsWith(".md") && !f.includes(".part")).sort();
let problems = 0;
for (const f of files) {
  const src = readFileSync(join(SRC, f), "utf8");
  const zh = readFileSync(join(ZH, f), "utf8");
  const a = shape(src);
  const b = shape(zh);
  const diffs = Object.keys(a).filter((k) => a[k] !== b[k]).map((k) => k + " " + a[k] + "->" + b[k]);
  const fb = fences(src);
  const zb = fences(zh);
  const changed = [];
  for (let i = 0; i < Math.min(fb.length, zb.length); i++) if (fb[i] !== zb[i]) changed.push(i);
  const zhAnchors = anchors(zh);
  const lost = [...anchors(src)].filter((x) => !zhAnchors.has(x));
  const cjk = (zh.match(/[\u4e00-\u9fff]/g) || []).length / Math.max(1, zh.length);
  const ok = !diffs.length && !changed.length && !lost.length && cjk >= 0.05;
  if (!ok) problems++;
  console.log(
    [ok ? "ok  " : "FAIL", f.padEnd(28), "shape:" + (diffs.join(",") || "-"), "code:" + (changed.join("/") || "-"), "lost-anchors:" + (lost.join(",") || "-"), "cjk:" + cjk.toFixed(2)].join(" "),
  );
}
console.log("problems:", problems, "files:", files.length);
process.exitCode = problems ? 1 : 0;
