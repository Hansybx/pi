# 关于这份中文文档

这是 [pi](https://github.com/earendil-works/pi) 官方文档的简体中文译本，放在仓库的 `docs/zh/` 下。

## 内容来源

- **官方文档站**：<https://docs.pi.dev/latest>（也写作 <https://pi.dev/docs/latest>）。该站点的页面由仓库里的 Markdown 直接生成，导航清单是 `packages/coding-agent/docs/docs.json`，所以「翻译文档站」和「翻译仓库文档」是同一件事。译文按 `docs.json` 的导航组织，见 [INDEX.md](INDEX.md)。
- **仓库级文档**：`README.md`、`AGENTS.md`、`CONTRIBUTING.md`、`SECURITY.md`。
- 对应关系：`packages/coding-agent/docs/<name>.md` → `docs/zh/coding-agent/<name>.md`；仓库根目录的 `<name>.md` → `docs/zh/<name>.md`。

每篇译文开头都标注了原文路径。与英文原文如有出入，以原文为准。

## 目录

| 路径 | 内容 |
| --- | --- |
| `docs/zh/INDEX.md` | 按文档站导航组织的索引 |
| `docs/zh/coding-agent/` | 文档站的 42 篇文档（含 `index.md` 概览），`images/` 是配图副本 |
| `docs/zh/coding-agent/extensions.md` | 扩展文档全文（约 3400 行，原文档最长的一篇） |
| `docs/zh/README.md`、`AGENTS.md`、`CONTRIBUTING.md`、`SECURITY.md` | 仓库级文档 |
| `docs/zh/tools/` | 校验脚本（结构一致性、链接可达性） |

## 翻译约定

- 代码块、命令、文件路径、环境变量、配置键、API 名称、`<a id>` 锚点保持原样；只翻译说明性文字与链接文字。
- 链接已重写为指向本目录内对应文件；指向源码和示例的链接指向仓库内的原始路径。
- 术语统一：session → 会话，tool → 工具，extension → 扩展，skill → 技能，prompt template → 提示模板，compaction → 压缩，steering message → 引导消息，follow-up message → 后续消息。`agent`、`provider`、`fork`、RPC、JSONL、SDK 等词首次出现时给出中文，之后保留英文。
- 图片从 `packages/coding-agent/docs/images/` 复制到 `docs/zh/coding-agent/images/`，保证本目录自包含。
- 标题翻译后，原英文锚点会失效，因此译文在相应标题前补了 `<a id="原英文锚点"></a>`（共 46 处），让文档内部跳转继续可用。

## 校验

两个脚本只读，可在仓库根目录运行：

```bash
node docs/zh/tools/qa.mjs         # 每篇译文与原文对比：代码块逐字一致、标题层级/表格行数/锚点数量一致
node docs/zh/tools/linkcheck.mjs  # 检查 docs/zh 下所有相对链接都能解析到真实文件
```

当前结果：42 篇文档全部通过，432 个相对链接 0 个失效。

## 这次没有翻译的部分

以下目录是内部设计文档和实验性应用的文档，体量远大于用户手册（合计约 90 万词），暂未翻译：

| 目录 | 内容 | 体量 |
| --- | --- | --- |
| `packages/chord/docs/` | Chord 跨进程对象运行时的设计、决策日志、切片规格 | 48 篇，约 33 万词 |
| `apps/p2/docs/` | 实验性 Web UI 的架构与插件说明 | 66 篇，约 27 万词 |
| `apps/p3/docs/` | p2 继任者的设计与切片 | 67 篇，约 20 万词 |
| `packages/durable/docs/` | 持久化 runtime 的规格 | 4 篇，约 8 万词 |
| `packages/coding-agent/CHANGELOG.md` | 发布历史（文档站的 Changelog 页） | 约 7.8 万词 |

需要的话可以按目录继续翻译，优先级建议：`durable`（做产品会用）→ `p3`（应用形态）→ `chord`（插件运行时）。

## 注意

`docs/zh/AGENTS.md` 是项目开发规则的中文译本，位于文档目录内。支持 `AGENTS.md` 约定的 agent 工具会把该目录下的文件当作作用域指令读取；如果你不希望中文文档影响 agent 行为，把它改名为 `AGENTS.zh-CN.md` 即可，译文内容不受影响。

## 译文质量

译文由 AI 生成，技术表述的最终依据仍是英文原文；发现错译请修正对应文件。结构校验能保证代码块和文档骨架与原文一致，但不能保证每句话的措辞最优。