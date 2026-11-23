> 这是简体中文译本，译自 `README.md`。与英文原文如有出入，以原文为准。

<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" alt="discord community" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/pi-coding-agent"><img src="https://img.shields.io/npm/v/@earendil-works/pi-coding-agent?style=flat-square" alt="npm" /></a>
</p>

> 新贡献者提交的 issue 和 PR 默认会被自动关闭。维护者每天会复查被自动关闭的 issue。见 [CONTRIBUTING.md](CONTRIBUTING.md)。

# Pi

Pi 是一个极简、可扩展的 agent harness，你可以把它改成完全属于自己的东西。

让 Pi 适配你的工作流，而不是反过来。用[扩展](../../packages/coding-agent/docs/extensions.md)、[技能](./coding-agent/skills.md)、[提示模板](./coding-agent/prompt-templates.md)和[主题](./coding-agent/themes.md)定制 Pi。把它们打包成 [Pi 包](./coding-agent/packages.md)，通过 npm 或 git 分发。

Pi 自带强大的默认配置，但刻意不做 sub-agent、plan mode 之类的功能。你可以让 Pi 自己建一个，或者装一个按你的方式实现的包。

Pi 可以[交互式使用](./coding-agent/usage.md)，也可以在 [print 或 JSON 模式](./coding-agent/cli.md)下自动化运行，还能通过 [RPC](./coding-agent/rpc.md) 控制，或者用 [Pi TypeScript SDK](./coding-agent/sdk.md) 构建应用。真实世界的集成案例见 [OpenClaw](https://github.com/OpenClaw/OpenClaw)。

## 快速开始

安装命令行工具：

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

Windows 上：

```shell
powershell -c "irm https://pi.dev/install.ps1 | iex"
```

安装脚本会锁定所有依赖，并用 `pi update` 更新 Pi。也可以用 npm 直接安装，但 npm 不锁定传递依赖：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Pi 需要 Node.js 22.19 或更新版本。macOS、Linux 和 Windows 的安装脚本会在需要时自己装。正常运行 npm 安装不要求执行依赖的生命周期脚本。

在你希望 Pi 工作的目录里启动它：

```bash
cd /path/to/project
pi
```

要用内置 provider，在 Pi 里执行 `/login` 连接订阅或 API key，然后给 Pi 一个任务。

完整的安装和使用说明见[文档](https://pi.dev/docs/latest)，演示见 [pi.dev](https://pi.dev)。
## 用 Nix 运行

```bash
nix run github:earendil-works/pi/stable
```

`stable` 指向最新发布版。用 `nix profile add github:earendil-works/pi/stable` 安装，用 `nix profile upgrade pi` 更新。要固定版本，用发布 tag，例如 `github:earendil-works/pi/v1.0.0`；要用 `main` 上未发布的改动，用 `github:earendil-works/pi`。Nix 从源码构建 Pi。

支持 Linux 和 macOS 上的 ARM64 与 x86-64。用 `nix build .` 或 `nix run .` 构建或运行你的 checkout。

Nix 构建是离线的，所以内置的模型数据来自固定在 `nix/model-catalog.json` 里的 pi.dev 模型目录修订版。运行时 Pi 仍会像平常一样叠加 pi.dev 上更新的目录数据。当固定的修订版与 checkout 不再匹配（例如新增了 provider 或新的模型类型）时，Nix 工作流会在 `main` 上替换这个固定值。手动刷新：

```bash
npm run update:model-catalog-pin
```

## 包

这个 monorepo 包含 Pi CLI 及其支撑库。

| 包 | 说明 |
|---------|-------------|
| **[@earendil-works/chord](../../packages/chord)** | 跨进程的应用对象运行时：contracts、documents、store、links、支持热重载的插件、HTTP、worker、web 和终端客户端 |
| **[@earendil-works/pi-telemetry](../../packages/telemetry)** | 厂商中立的遥测契约、参考实现、一致性测试和类型化 schema |
| **[@earendil-works/pi-ai](../../packages/ai)** | 统一的多 provider LLM API（OpenAI、Anthropic、Google 等） |
| **[@earendil-works/pi-durable](../../packages/durable)** | 持久化的会话、任务和文档运行时 |
| **[@earendil-works/pi-agent-core](../../packages/agent)** | 带工具调用和状态管理的 agent 运行时 |
| **[@earendil-works/pi-coding-agent](../../packages/coding-agent)** | 交互式 coding agent CLI |
| **[@earendil-works/pi-tui](../../packages/tui)** | 带差分渲染的终端 UI 库，让文本渲染更高效 |

Slack 和聊天自动化以及工作流见 [earendil-works/pi-chat](https://github.com/earendil-works/pi-chat)。

## 权限与容器化

Pi 不自带用于限制文件系统、进程、网络或凭证访问的权限系统。默认情况下，它以启动它的用户和进程的权限运行。

如果你需要更强的边界，把 Pi 容器化或放进沙箱。见 [packages/coding-agent/docs/containerization.md](./coding-agent/containerization.md) 里的三种方式：

- **Gondolin 扩展**：把 `pi` 和 provider 凭证留在宿主机上，把内置工具和 `!` 命令路由进本地 Linux 微 VM。
- **纯 Docker**：把整个 `pi` 进程跑在本地容器里，实现简单的隔离。
- **OpenShell**：把整个 `pi` 进程跑在受策略控制的沙箱里。

## 参与贡献

贡献规范见 [CONTRIBUTING.md](CONTRIBUTING.md)，项目专属规则（人和 agent 都适用）见 [AGENTS.md](AGENTS.md)。Pi 的长期计划也可以在 [RFC](https://rfc.earendil.com/keyword/pi) 里找到。

## 开发

```bash
npm install --ignore-scripts  # 安装全部依赖，但不执行生命周期脚本
npm run build         # 刷新模型数据，然后构建所有包
npm run build:offline # 用已有的模型数据重建，不访问网络
npm run check         # lint、格式化和类型检查
./test.sh            # 运行测试（没有 API key 时跳过依赖 LLM 的测试）
./pi-test.sh         # 从源码运行 pi（可以在任何目录执行）
```

### 在 monorepo 外使用本地包

把所有公开包构建成一套相互一致的本地产物：

```bash
npm run pack:packages -- --out .artifacts/pi-packages
```

这会先刷新模型数据再构建 `pi-ai`。模型数据已经就绪、不想联网时，加上 `--offline-model-data`。

然后让一个外部项目使用其中一个包，并让它所有 Pi 依赖都从同一套产物里解析。默认用 npm：

```bash
node scripts/use-local-packages.mjs \
  --manifest .artifacts/pi-packages/manifest.json \
  --consumer ../my-project \
  --package @earendil-works/pi-durable \
  --package @earendil-works/pi-agent-core
cd ../my-project
npm install --ignore-scripts
```

pnpm 项目把 `--consumer` 指向 workspace 根目录：

```bash
node scripts/use-local-packages.mjs \
  --manifest .artifacts/pi-packages/manifest.json \
  --consumer ../my-project \
  --package @earendil-works/pi-agent-core \
  --package-manager pnpm
cd ../my-project
pnpm install --ignore-scripts
```

每个直接依赖重复一次 `--package`。该命令会用带内容寻址的本地 `file:` 引用更新消费方的 `package.json`。对 npm 会把传递依赖的 overrides 写入 `package.json`，对 pnpm 写入 `pnpm-workspace.yaml`。安装或更新消费方期间要保留产物目录。改动 Pi 源码后重新执行这两条命令。

## 从发布源码构建独立可执行文件

GitHub release 会附带一份由该 release 的 `SHA256SUMS` 文件校验的版本化源码归档。解压后运行与官方独立可执行文件相同的构建脚本：

```bash
VERSION="<release-version>"
tar -xzf "pi-${VERSION}-source.tar.gz"
cd "pi-${VERSION}"
./scripts/build-binaries.sh --offline-model-data --platform linux-x64 --out "$PWD/out"
```

归档里包含发布用的模型数据和原生预构建产物。`--offline-model-data` 使用这些模型数据，不刷新 provider 目录。脚本会安装依赖，并把可执行文件和它的运行时资源一起构建出来；依赖已经就绪时加 `--skip-install`。

## 供应链加固

我们把 npm 依赖变更当作需要评审的代码变更。

- 外部直接依赖固定到精确版本，内部 workspace 包仍用版本范围。
- `.npmrc` 设置 `save-exact=true` 和 `min-release-age=2`，避免 npm 解析时用到当天发布的依赖。
- `package-lock.json` 是依赖的唯一真相。除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1`，否则 pre-commit 会阻止意外的 lockfile 提交。
- `npm run check` 校验固定版本、原生 TypeScript import 兼容性，以及生成的 coding-agent 安装锁。
- pi.dev 的安装脚本从 `packages/coding-agent/install-lock/` 安装，该目录由根 lockfile 生成，用来固定传递依赖。npm 包本身不固定传递依赖。
- 本地发布冒烟测试和 npm 发布使用同一个 tarball 打包器；npm 发布的是校验过的 tarball，不会重新打包 workspace 目录。
- 本地发布安装、文档里的 npm 安装，以及 `pi update --self` 在支持的地方都带 `--ignore-scripts`。
- CI 用 `npm ci --ignore-scripts` 安装，并且有定时 GitHub workflow 跑 `npm audit --omit=dev` 和 `npm audit signatures --omit=dev`。
- 安装锁生成时对依赖的生命周期脚本有显式 allowlist；新出现带生命周期脚本的依赖会让检查失败，直到经过评审。
## 分享你的开源 coding agent 会话

如果你用 Pi 或其他 coding agent 做开源工作，请分享这些会话。

公开的开源会话数据能帮助改进 coding agent，让它基于真实任务、工具使用、失败和修复来进步，而不是只靠玩具基准。

完整说明见[这条 X 帖子](https://x.com/badlogicgames/status/2037811643774652911)。

要发布会话，用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)，它的 README.md 里有设置说明。你只需要一个 Hugging Face 账号、Hugging Face CLI 和 `pi-share-hf`。

也可以看[这段视频](https://x.com/badlogicgames/status/2041151967695634619)，我在里面演示了如何发布我的 `pi-mono` 会话。

我会把自己的 `pi-mono` 工作会话定期发布在这里：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

## 许可证

MIT

<p align="center">
  <a href="https://pi.dev">pi.dev</a> 域名由
  <br /><br />
  <a href="https://exe.dev"><img src="./coding-agent/images/exy.png" alt="Exy mascot" width="48"><br />exe.dev</a>
  慷慨捐赠
</p>
