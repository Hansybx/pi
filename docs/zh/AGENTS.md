> 这是简体中文译本，译自 `AGENTS.md`。与英文原文如有出入，以原文为准。

# 开发规则

## 沟通风格

- 回答保持简短凝练
- 提交信息、issue、PR 评论或代码中不使用 emoji
- 不写空话或讨好的填充语（例如用「Thanks @user」而不是「Thanks so much @user!」）
- 只写技术性文字，直接了当
- 使用简洁、清晰、简单的语言。无法避免的术语在使用前先定义。
- 解释非平凡的设计和问题时按这样的顺序：问题、具体示例或简短追踪、然后解决方案。说明为什么该方案是必要的，并把它与可选的复杂性区分开。
- 优先给出具体行为和小示例，而不是抽象总结、密集术语或未加解释的变更列表。
- 当用户提问时，先回答问题，再做编辑或运行实现类命令。
- 回应反馈或分析时，先说清你同意还是不同意，再说你改了什么。

## 代码质量

- 在大范围改动之前、在编辑尚未完整检查过的文件之前，以及在被要求调查或审计时，完整读取文件。不要依赖搜索片段做广泛改动。
- 除非绝对必要，不使用 `any`。
- 不对 TypeScript 已保证类型的值做运行时检查（不对带类型的参数、带类型的回调结果或带类型的声明做 `typeof`/`instanceof`/`Array.isArray`/形状守卫）。只在已确定的信任边界上校验（wire input、经 schema 校验的 arguments 和 params）。
- 只有一个调用点的单行辅助函数直接内联。
- 外部 API 的类型去 node_modules 里查；不要猜。
- **不使用内联 import**（`await import()`、`import("pkg").Type`、动态类型 import）。只用顶层 import。
- 在 `packages/coding-agent` 中，通过 `src/config.ts` 里的辅助函数解析包内资源。不要直接使用 `__dirname`；这些辅助函数会考虑源码 checkout、npm 安装和独立二进制三种情况。
- 绝不为了修掉过期依赖导致的类型错误而移除或降级代码；应升级该依赖。
- 在由根配置检查的代码（`packages/*/src`、`packages/*/test`、`packages/coding-agent/examples`）中只使用可擦除的 TypeScript 语法（Node strip-only 模式）：不使用参数属性、`enum`、`namespace`/`module`、`import =`、`export =` 或其他需要向 JS 输出的构造。改用显式字段加构造函数赋值。
- 移除看起来是有意为之的功能或代码前，必须先询问。
- 除非用户要求，不要保留向后兼容。
- 绝不硬编码按键检查（例如 `matchesKey(keyData, "ctrl+x")`）。把默认值加到 `DEFAULT_EDITOR_KEYBINDINGS` 或 `DEFAULT_APP_KEYBINDINGS`，让它们保持可配置。
- 绝不直接修改 `packages/ai/src/models.generated.ts`；改为更新 `packages/ai/catalog/` 中的 catalog 定义（见其 README），然后重新生成。一并提交重新生成的 `models.generated.ts` diff 总是可以的，即使重新生成时带入了无关的上游模型元数据变更。`packages/ai/src/providers/data/` 中生成的模型数据被 gitignore：绝不 stage 它，也不要在 git 历史里找它。

## Chord v2 代码风格

适用于 Chord v2（`packages/chord/src/`）及其测试的绑定规则，书写和评审时都要遵守。其范本取自 pi-durable 的源码。

- 文件：一个文件一个概念，按概念命名；不写只有一个辅助函数的文件，不写大杂烩文件。第一行：一句注释说明该文件的用途。顺序：import、导出类型，然后先公开入口点，其辅助函数按使用顺序排在下面；常量紧挨其第一个使用处上方。顶层声明之间空一行。按概念拆文件，绝不按大小拆：一个概念可以占很长的文件（约 1,000 行以内都可以）；文件里出现第二个概念才是拆分理由。
- 函数：每个导出都有一行文档注释说明它做什么或保证什么。内联注释解释不显然的 why（成本、竞态、已定的规则），绝不解释下一行做什么。函数要短、只做一件事（约 40 行需要理由；对 tagged union 的一个 `switch` 没问题）。不用切换行为的布尔标志参数：拆成两个函数，或改用带标记的值。绝不重复写同样的行。context 放最后：必需参数，然后 `context`/`ctx`（始终必需，与 Durable 一致；只在错误上报路径上可选），然后可选参数。
- 类型与检查：每个状态和结果都用 tagged union。只在 TypeScript 无法表达某个已定不变量处使用类型转换，每处都附简短理由。每一处保留下来的运行时检查都要说明它服务于哪个信任边界（wire input、经 schema 校验的 params 和 arguments、类型无法表达的声明策略）。同一主机内的值都是普通数据，按约定不可变：绝不为了强制这一点而复制、冻结或遍历它；只有在某项决定明确时才冻结 Chord 自己拥有的元数据。不对损坏的 adapter、调用方或我们自己的模块写防御性代码。
- 成本与内存：不做决定未要求的热路径工作（遍历、复制、编译、每次调用的分配）。做计数工作的函数通过自己的 context 计数；调用点绝不替别人计数。缓存是以其拥有者为键的 `WeakMap`，每个都配 GC 测试；不使用模块级强缓存。
- 命名与 API：使用设计中的词汇（`params`、`binding`、`principal key`），不造同义词；使用已定的 `ChordError` 代码和原因。只导出后续层或应用需要的东西。不设 dev 或测试模式，不加未被要求的选项。
- 测试：每个源文件一个测试文件，每个机制一个 `describe`，按 layer spec 的测试清单逐条覆盖；成本守卫通过内存内遥测 adapter 完成；每个缓存和 binding 都要有 GC 测试。每个 slice 还要在 `packages/chord/test/examples/NN-topic.ts` 中新增一个或多个可运行示例，每个示例一个主题，跨 slice 连续编号，并写成给 Chord 使用者的参考（Durable 的 `test/examples/` 格式：头部说明展示什么和如何运行、带注释的步骤、打印出的结果）。
- Slice：Chord v2 按垂直 slice 构建（`packages/chord/docs/slices.md`）。实现者和评审者要完整阅读 slice spec、`slices.md` 中的功能图以及 `packages/chord/docs/design.md` 全文，并对照这三者检查工作；slice spec 引用 design 章节是为了定位，不是阅读上限。
- 延后工作：任何留给后续 slice 的东西，都要在同一次改动中写入 `packages/chord/docs/slices.md` 中该 slice 的「Carry-over」章节；一个 slice 的 spec 和构建包含该章节中的每一条目。
- 上报之前：像陌生人一样把每个改动过的文件从头到尾重读一遍；每个文件都必须能不必来回跳读就可理解。然后运行 `npm run check` 和该层的测试。

## 命令

- 代码变更后（非文档）：运行 `npm run check`（完整输出，不要只看 tail）。提交前修掉所有错误、警告和 info。它不运行测试。
- `apps/p2` 不在根 check 和根测试范围内。改动 p2 之后还要运行 `cd apps/p2 && npm run check`；p2 的套件是 `cd apps/p2 && npm test`（TUI 测试需要 Node 26，浏览器测试需要 `CHROMIUM_BIN`）。
- 当某处需要构建产物（`dist/`）时运行 `npm run build`：导入已构建包的测试或 benchmark、Durable 的 workerd 套件。Chord 和 Durable 的完整套件需要它：Chord 中启动 Node 进程或用 esbuild 打包的测试会从 `dist/` 加载工作区包（其余测试按其 vitest 配置从源码运行），而 Durable 导入 pi-ai 的 `utils/*`，这些没有源码导出。绝不用它做类型检查或 lint：那是 `npm run check`，是首选的检查方式。
- 除非用户要求，绝不运行 `npm test`。
- 绝不直接运行完整 vitest 套件：它包含在存在 endpoint/auth 环境变量时会激活的 e2e 测试。要跑所有非 e2e 测试，从仓库根运行 `./test.sh`。它只跑 `packages/*`。否则从包根运行特定测试：
  - Vitest：`node "$(git rev-parse --show-toplevel)/node_modules/vitest/dist/cli.js" --run test/specific.test.ts`
  - `packages/tui`（`node:test`）：`node --test test/specific.test.ts`
- 如果你创建或修改了测试文件，运行它，并对测试或实现反复迭代直到通过。
- 对于 `packages/coding-agent/test/suite/`，使用 `test/suite/harness.ts` + faux provider。不使用真实 provider API、密钥或付费 token。
- 为修复某个 github issue 而写的回归测试，要在测试旁加一条带该 github issue 编号的注释。
- 临时脚本用 `write` 写到临时文件（例如 `/tmp`），运行，按需修改，完成后删除。不要把多行脚本塞进 `bash` 命令。
- 除非用户要求，绝不提交。

## 依赖与安装安全

- 把 npm 依赖和 lockfile 变更当作需要评审的代码。直接的 registry 依赖，包括内部工作区依赖，都固定到精确版本。
- 更新 `undici` 时，你必须阅读目标版本的 changelog/release notes，并在应用更新前评估是否有任何变更可能影响功能。
- 本地填充/更新用 `npm install --ignore-scripts`；干净/CI 式用 `npm ci --ignore-scripts`。除非用户要求，不要运行生命周期脚本。
- 如果依赖元数据变化，用 `npm install --package-lock-only --ignore-scripts` 刷新 `package-lock.json`。
- 如果 `packages/coding-agent/install-lock/` 需要重新生成，运行 `node scripts/generate-coding-agent-install-lock.mjs`（用 `--check` 或 `npm run check` 验证）。带生命周期脚本的新依赖需要评审，并在该脚本中显式加入 allowlist 条目；绝不悄悄添加。
- 除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1`，pre-commit 会阻止 lockfile 提交。除非用户希望提交该 lockfile 变更，不要绕过。

## Git

此 cwd 中可能同时运行多个 pi 会话，各自修改不同文件。涉及你自己改动之外的未暂存、已暂存或未跟踪文件的 Git 操作会踩坏其他会话的工作。遵守这些规则：

提交：

- 只提交你在本次会话中改动的文件。
- 显式暂存路径（`git add <path1> <path2>`）；绝不 `git add -A` / `git add .`。
- 提交前运行 `git status`，确认你只暂存了自己的文件。
- `packages/ai/src/models.generated.ts` 可以始终与你的文件一并包含。
- 消息格式：`{feat,fix,docs}[(ai,tui,agent,coding-agent)]: <commit message> (optionally multiple lines)`。消息要有信息量且凝练。

绝不运行（会破坏其他 agent 的工作或绕过检查）：

- `git reset --hard`、`git checkout .`、`git clean -fd`、`git stash`、`git add -A`、`git add .`、`git commit --no-verify`。

如果发生 rebase 冲突：

- 只在你修改过的文件中解决冲突。
- 如果冲突出现在你未修改的文件中，中止并询问用户。
- 绝不 force push。

## Issue 与 PR

贡献者门槛（自动关闭工作流、`lgtm`/`lgtmi`、质量要求）见 `CONTRIBUTING.md`。

评审 PR 时：

- 除非用户明确要求，不要运行 `gh pr checkout`、`git switch`，或以其他方式把工作树切到 PR 分支。
- 使用 `gh pr view`、`gh pr diff`、`gh api` 以及对已获取 ref 的本地 `git show`/`git diff` 来检查 PR 元数据、提交和补丁，不切换分支。
- 如果需要 PR 文件内容，把它们获取/读取到临时文件中，或用 `git show <ref>:<path>`，而不切换分支。

创建 issue 时：

- 为受影响的包添加 `pkg:*` 标签（`pkg:agent`、`pkg:ai`、`pkg:coding-agent`、`pkg:tui`）；所有适用的都要用。

发布 issue/PR 评论时：

- 把评论写入临时文件，用 `gh issue/pr comment --body-file` 发布（绝不用 `--body` 发多行 markdown）。
- 评论保持凝练、技术性，符合用户的语气。
- 每条 AI 发布的评论都以发起提示词指定的 AI 生成免责声明行结尾（例如 `This comment is AI-generated by `/wr``）。

通过提交关闭 issue 时：

- 在消息中包含 `fixes #<number>` 或 `closes #<number>`，以便合并时自动关闭该 issue。多个 issue 时，每个 issue 重复该关键字（`closes #1, closes #2`）；共用一个关键字（`closes #1, #2`）只会关闭第一个。

## 编写 p2 插件代码

在编写或评审 `apps/p2` 中的插件代码（server 和 worker facet、contracts、stores）之前，完整阅读并遵循 [apps/p2/docs/plugin-practices.md](../../apps/p2/docs/plugin-practices.md)。

## 构建 p2 的 Web UI

构建或更改 p2 的 Web UI（`apps/p2`）时，加载并遵循 [.pi/skills/p2-ui.md](../../.pi/skills/p2-ui.md)。

## 用 tmux 测试 pi 交互模式

测试 pi 的交互模式时，加载并遵循 [.pi/skills/interactive-testing.md](../../.pi/skills/interactive-testing.md)。

## 变更日志

位置：`packages/*/CHANGELOG.md`（每个包一个）。

`## [Unreleased]` 下的分节：`### Breaking Changes`（需要迁移的 API 变更）、`### Added`、`### Changed`、`### Fixed`、`### Removed`。

规则：

- 所有新条目都放在 `## [Unreleased]` 下。先读完整个分节，追加到已有子分节；绝不重复创建子分节。
- 已发布版本的分节（例如 `## [0.12.2]`）不可变；绝不修改。
- 当工作目标是 `main` 之外的分支时，不要创建变更日志条目

署名：

- 内部（来自 issue）：`Fixed foo bar ([#123](https://github.com/earendil-works/pi/issues/123))`
- 外部贡献：`Added feature X ([#456](https://github.com/earendil-works/pi/pull/456) by [@username](https://github.com/username))`

## 发布

发布准备、发布、验证或恢复时，加载并遵循 [.pi/skills/release.md](../../.pi/skills/release.md)。

## 用户覆盖

如果用户的指令与本文档中的任何规则冲突，在覆盖之前要求明确确认。只有确认后才执行他们的指令。
